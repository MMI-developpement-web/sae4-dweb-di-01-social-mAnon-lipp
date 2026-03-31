<?php

namespace App\Trait;

use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\File\UploadedFile;

/**
 * Parse multipart/form-data for non-POST requests (like PUT)
 * Symfony only auto-parses multipart for POST, so we handle PUT manually
 */
trait ParseMultipartTrait
{
    /**
     * Parse multipart form data from request body
     * Returns array with both 'files' and 'fields'
     */
    protected function parseMultipartRequest(Request $request): array
    {
        $contentType = (string) $request->headers->get('Content-Type', '');
        if (!str_starts_with($contentType, 'multipart/form-data')) {
            return ['files' => [], 'fields' => []];
        }

        // Extract boundary from Content-Type header
        if (!preg_match('/boundary=([^;]+)/', $contentType, $matches)) {
            return ['files' => [], 'fields' => []];
        }

        $boundary = trim($matches[1], '"');
        $rawBody = $request->getContent();

        $files = [];
        $fields = [];

        // Split by boundary
        $parts = preg_split('/--' . preg_quote($boundary) . '(?:--)?/', $rawBody);

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
                // It's a file — create a temporary file and an UploadedFile
                $tmpPath = tempnam(sys_get_temp_dir(), 'upload_');
                file_put_contents($tmpPath, $content);

                $mimeType = 'application/octet-stream';
                if (preg_match('/Content-Type:\s*([^\r\n]+)/i', $headers, $mimeMatches)) {
                    $mimeType = trim($mimeMatches[1]);
                }

                $uploadedFile = new UploadedFile($tmpPath, $fileName, $mimeType, null, true);

                // Handle array-style field names like "media[]"
                if (str_ends_with($fieldName, '[]')) {
                    $baseName = substr($fieldName, 0, -2);
                    $existing = $request->files->get($baseName, []);
                    if (!is_array($existing)) {
                        $existing = [$existing];
                    }
                    $existing[] = $uploadedFile;
                    $request->files->set($baseName, $existing);

                    $files[$baseName][] = [
                        'name' => $fileName,
                        'type' => $mimeType,
                        'tmp_name' => $tmpPath,
                        'size' => strlen($content),
                        'error' => 0,
                    ];
                } else {
                    $request->files->set($fieldName, $uploadedFile);
                    $files[$fieldName] = [
                        'name' => $fileName,
                        'type' => $mimeType,
                        'tmp_name' => $tmpPath,
                        'size' => strlen($content),
                        'error' => 0,
                    ];
                }
            } else {
                // It's a form field
                if (str_ends_with($fieldName, '[]')) {
                    $baseName = substr($fieldName, 0, -2);
                    $existing = $request->request->get($baseName, []);
                    if (!is_array($existing)) {
                        $existing = [$existing];
                    }
                    $existing[] = $content;
                    $request->request->set($baseName, $existing);
                    $fields[$baseName] = $request->request->get($baseName);
                } else {
                    $request->request->set($fieldName, $content);
                    $fields[$fieldName] = $content;
                }
            }
        }

        return ['files' => $files, 'fields' => $fields];
    }
}