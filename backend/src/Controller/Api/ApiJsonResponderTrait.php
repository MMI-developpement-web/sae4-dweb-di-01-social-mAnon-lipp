<?php

namespace App\Controller\Api;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\File\UploadedFile;

trait ApiJsonResponderTrait
{
    protected function errorJson(string $message, int $status): JsonResponse
    {
        return $this->json(['error' => $message], $status);
    }

    protected function extractMediaFiles(Request $request): array
    {
        $candidates = [];

        $media = $request->files->get('media');
        if ($media !== null) {
            $candidates = is_array($media) ? $media : [$media];
        }

        if ($candidates === []) {
            $mediaArray = $request->files->get('media[]');
            if ($mediaArray !== null) {
                $candidates = is_array($mediaArray) ? $mediaArray : [$mediaArray];
            }
        }

        if ($candidates === []) {
            $allFiles = $request->files->all();
            $fromAll = $allFiles['media'] ?? $allFiles['media[]'] ?? [];
            $candidates = is_array($fromAll) ? $fromAll : [$fromAll];
        }

        return array_values(array_filter(
            $candidates,
            static fn (mixed $file): bool => $file instanceof UploadedFile
        ));
    }

    protected function parseMultipartManually(Request $request): void
    {
        $contentType = (string) $request->headers->get('Content-Type', '');
        
        // Extract boundary from Content-Type header
        if (!preg_match('/boundary=([^\s;]+)/', $contentType, $matches)) {
            return;
        }
        
        $boundary = trim($matches[1], '"');
        $body = $request->getContent();
        
        // Split by boundary
        $parts = preg_split('/--' . preg_quote($boundary) . '(?:--)?/', $body);
        
        foreach ($parts as $part) {
            if (empty(trim($part))) {
                continue;
            }
            
            // Split headers from content
            if (!preg_match('/^(.*?)\r?\n\r?\n(.*)$/s', $part, $matches)) {
                continue;
            }
            
            $headers = $matches[1];
            $content = $matches[2];
            $content = rtrim($content, "\r\n");
            
            // Parse Content-Disposition header
            if (!preg_match('/Content-Disposition:\s*form-data;\s*name="([^"]+)"(?:;\s*filename="([^"]*)")?/i', $headers, $dispMatches)) {
                continue;
            }
            
            $fieldName = $dispMatches[1];
            $fileName = $dispMatches[2] ?? null;
            
            if ($fileName) {
                // It's a file — manually create UploadedFile
                $tmpFile = tempnam(sys_get_temp_dir(), 'upload_');
                file_put_contents($tmpFile, $content);
                
                $mimeType = 'application/octet-stream';
                if (preg_match('/Content-Type:\s*([^\r\n]+)/i', $headers, $mimeMatches)) {
                    $mimeType = trim($mimeMatches[1]);
                }
                
                $uploadedFile = new UploadedFile($tmpFile, $fileName, $mimeType, null, true);
                
                // Handle array-style field names like "media[]"
                if (str_ends_with($fieldName, '[]')) {
                    $baseName = substr($fieldName, 0, -2);
                    $existing = $request->files->get($baseName, []);
                    if (!is_array($existing)) {
                        $existing = [$existing];
                    }
                    $existing[] = $uploadedFile;
                    $request->files->set($baseName, $existing);
                } else {
                    $request->files->set($fieldName, $uploadedFile);
                }
            } else {
                // It's a form field
                // Handle array-style field names like "existingMediaIndices[]"
                if (str_ends_with($fieldName, '[]')) {
                    $baseName = substr($fieldName, 0, -2);
                    $existing = [];
                    if ($request->request->has($baseName)) {
                        $existing = $request->request->get($baseName);
                        if (!is_array($existing)) {
                            $existing = [$existing];
                        }
                    }
                    $existing[] = $content;
                    $request->request->set($baseName, $existing);
                } else {
                    $request->request->set($fieldName, $content);
                }
            }
        }
    }

    /**
     * Extract tweet content from either JSON or multipart form data
     */
    protected function extractTweetContent(Request $request): string
    {
        // Try to get from multipart form data first
        $content = $request->request->get('content');
        if (is_string($content)) {
            return $content;
        }

        // Try to decode from JSON body
        try {
            $data = json_decode($request->getContent(), true);
            if (is_array($data) && isset($data['content']) && is_string($data['content'])) {
                return $data['content'];
            }
        } catch (\Exception) {
            // JSON decode failed, return empty string
        }

        return '';
    }
}
