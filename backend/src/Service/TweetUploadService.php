<?php

namespace App\Service;

use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\File\Exception\FileException;
use Symfony\Component\String\Slugger\SluggerInterface;
use Symfony\Component\DependencyInjection\Attribute\Autowire;

class TweetUploadService
{
    private const ALLOWED_MIME_TYPES_IMAGE = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    private const ALLOWED_MIME_TYPES_VIDEO = ['video/mp4', 'video/webm'];
    private const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

    public function __construct(
        private SluggerInterface $slugger,
        #[Autowire('%kernel.project_dir%/public/uploads')]
        private string $uploadsDirectory,
    ) {
    }

    /**
     * Validate and upload media files for a tweet
     * @param UploadedFile[] $files
     * @return array<int, array{url: string, type: string, mimeType: string}>
     */
    public function uploadTweetMedias(array $files): array
    {
        $medias = [];

        foreach ($files as $file) {
            $media = $this->processMediaFile($file);
            if ($media !== null) {
                $medias[] = $media;
            }
        }

        return $medias;
    }

    /**
     * Process a single media file (image or video)
     * @return array{url: string, type: string, mimeType: string}|null
     */
    private function processMediaFile(UploadedFile $file): ?array
    {
        // Validate file size
        if ($file->getSize() > self::MAX_FILE_SIZE) {
            throw new FileException('Le fichier ne doit pas dépasser 50MB');
        }

        $mimeType = $file->getMimeType();
        
        // Determine if it's an image or video
        if (in_array($mimeType, self::ALLOWED_MIME_TYPES_IMAGE)) {
            $type = 'image';
        } elseif (in_array($mimeType, self::ALLOWED_MIME_TYPES_VIDEO)) {
            $type = 'video';
        } else {
            throw new FileException('Type de fichier non autorisé. Formats acceptés: JPG, PNG, GIF, WebP, MP4, WebM');
        }

        // Upload the file
        $filename = $this->uploadFile($file);

        return [
            'url' => '/uploads/' . $filename,
            'type' => $type,
            'mimeType' => $mimeType,
        ];
    }

    /**
     * Upload a file to the uploads directory
     */
    private function uploadFile(UploadedFile $file): string
    {
        // Verify uploads directory exists and is writable
        if (!is_dir($this->uploadsDirectory)) {
            throw new FileException('Uploads directory does not exist: ' . $this->uploadsDirectory);
        }

        if (!is_writable($this->uploadsDirectory)) {
            throw new FileException('Uploads directory is not writable: ' . $this->uploadsDirectory);
        }

        $originalFilename = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
        $safeFilename = $this->slugger->slug($originalFilename);
        $filename = $safeFilename . '-' . uniqid() . '.' . $file->guessExtension();

        try {
            $file->move($this->uploadsDirectory, $filename);
        } catch (FileException $e) {
            throw new FileException('Could not upload file: ' . $e->getMessage(), 0, $e);
        }

        return $filename;
    }
}
