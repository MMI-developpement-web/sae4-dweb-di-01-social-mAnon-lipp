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
