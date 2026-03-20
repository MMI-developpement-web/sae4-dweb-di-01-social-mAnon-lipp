<?php

namespace App\Resolver;

class MediaUrlResolver
{
    public function resolveUploadPath(?string $filename): ?string
    {
        if ($filename === null || $filename === '') {
            return null;
        }

        return '/uploads/' . ltrim($filename, '/');
    }
}
