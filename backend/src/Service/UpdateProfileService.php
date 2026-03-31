<?php

namespace App\Service;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\File\Exception\FileException;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\String\Slugger\SluggerInterface;
use Symfony\Component\DependencyInjection\Attribute\Autowire;

class UpdateProfileService
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private SluggerInterface $slugger,
        #[Autowire('%kernel.project_dir%/public/uploads')]
        private string $uploadsDirectory,
    ) {
    }

    /**
     * Update user profile with optional file uploads
     */
    public function updateProfile(
        User $user,
        ?string $bio = null,
        ?string $website = null,
        ?string $location = null,
        ?UploadedFile $profilePicture = null,
        ?UploadedFile $bannerPicture = null,
    ): User {
        // Update text fields (only if non-empty)
        if ($bio !== null && trim($bio) !== '') {
            $user->setBio(trim($bio));
        }
        if ($website !== null && trim($website) !== '') {
            $user->setWebsite(trim($website));
        }
        if ($location !== null && trim($location) !== '') {
            $user->setLocation(trim($location));
        }

        // Handle file uploads
        if ($profilePicture) {
            $profilePath = $this->uploadFile($profilePicture);
            $user->setProfilePicture($profilePath);
        }

        if ($bannerPicture) {
            $bannerPath = $this->uploadFile($bannerPicture);
            $user->setBannerPicture($bannerPath);
        }

        $this->entityManager->flush();

        return $user;
    }

    /**
     * Upload a file and return its relative path
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
        $fileName = $safeFilename . '-' . uniqid() . '.' . $file->guessExtension();

        try {
            $file->move($this->uploadsDirectory, $fileName);
        } catch (FileException $e) {
            throw new FileException('Could not upload file: ' . $e->getMessage(), 0, $e);
        } catch (\Exception $e) {
            throw new FileException('Unexpected error uploading file: ' . $e->getMessage(), 0, $e);
        }

        return $fileName;
    }
}
