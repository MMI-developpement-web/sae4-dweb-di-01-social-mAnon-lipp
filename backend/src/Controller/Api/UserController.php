<?php

namespace App\Controller\Api;

use App\Dto\Payload\UpdateProfilePayload;
use App\Entity\User;
use App\Repository\TweetRepository;
use App\Service\FollowService;
use App\Service\UpdateProfileService;
use App\Resolver\MediaUrlResolver;
use App\Resolver\PaginationResolver;
use App\Service\TweetApiFormatter;
use App\Resolver\UserVisibilityResolver;
use App\Trait\ParseMultipartTrait;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api', format: 'json')]
class UserController extends AbstractController
{
    use ApiJsonResponderTrait;
    use ParseMultipartTrait;

    public function __construct(
        private UserVisibilityResolver $userVisibilityResolver,
        private TweetRepository $tweetRepository,
        private FollowService $followService,
        private PaginationResolver $paginationResolver,
        private MediaUrlResolver $mediaUrlResolver,
        private TweetApiFormatter $tweetApiFormatter,
        private UpdateProfileService $updateProfileService,
    ) {
    }

    /**
     * Get user profile by ID
     * GET /api/users/{id}
     */
    #[Route('/users/{id}', name: 'api.users.show', methods: ['GET'])]
    #[IsGranted('ROLE_USER')]

    public function show(int $id, #[CurrentUser] User $currentUser): JsonResponse
    {
        $targetUser = $this->userVisibilityResolver->findVisibleById($id);
        if ($targetUser === null) {
            return $this->errorJson('Utilisateur non trouvé', 404);
        }

        $isFollowing = false;
        $followerCount = $this->followService->getFollowerCount($targetUser);
        $followingCount = $this->followService->getFollowingCount($targetUser);
        if ($currentUser instanceof User) {
            $isFollowing = $this->followService->isFollowing($currentUser, $targetUser);
        }

        return $this->json([
            'user' => [
                'id' => $targetUser->getId(),
                'email' => $targetUser->getEmail(),
                'username' => $targetUser->getUsername(),
                'bio' => $targetUser->getBio(),
                'profilePicture' => $this->mediaUrlResolver->resolveUploadPath($targetUser->getProfilePicture()),
                'bannerPicture' => $this->mediaUrlResolver->resolveUploadPath($targetUser->getBannerPicture()),
                'location' => $targetUser->getLocation(),
                'website' => $targetUser->getWebsite(),
                'followerCount' => $followerCount,
                'followingCount' => $followingCount,
                'isFollowing' => $isFollowing,
            ],
        ], 200);
    }

    /**
     * Get user's tweets
     * GET /api/users/{id}/tweets?page=1&per_page=20
     */
    #[Route('/users/{id}/tweets', name: 'api.users.tweets', methods: ['GET'])]
    #[IsGranted('ROLE_USER')]
    public function tweets(int $id, Request $request, #[CurrentUser] User $currentUser): JsonResponse
    {
        $user = $this->userVisibilityResolver->findVisibleById($id);
        if ($user === null) {
            return $this->errorJson('Utilisateur non trouvé', 404);
        }

        $pagination = $this->paginationResolver->fromRequest($request);
        $page = $pagination['page'];
        $perPage = $pagination['perPage'];
        $offset = $pagination['offset'];

        $tweets = $this->tweetRepository->findBy(
            ['author' => $user],
            ['createdAt' => 'DESC'],
            $perPage,
            $offset
        );

        $total = $this->tweetRepository->count(['author' => $user]);

        $formattedTweets = $this->tweetApiFormatter->formatCollection($tweets, $currentUser instanceof User ? $currentUser : null);

        return $this->json([
            'tweets' => $formattedTweets,
            'pagination' => [
                'current_page' => $page,
                'per_page' => $perPage,
                'total_items' => $total,
            ],
        ], 200);
    }

    /**
     * Follow a user
     * POST /api/users/{id}/follow
     */
    #[Route('/users/{id}/follow', name: 'api.users.follow', methods: ['POST'])]
    #[IsGranted('ROLE_USER')]
    public function follow(int $id, #[CurrentUser] User $currentUser): JsonResponse
    {
        $targetUser = $this->userVisibilityResolver->findVisibleById($id);
        if ($targetUser === null) {
            return $this->errorJson('Utilisateur non trouvé', 404);
        }
        if (!$currentUser instanceof User) {
            return $this->errorJson('Non authentifié', 401);
        }

        try {
            $this->followService->follow($currentUser, $targetUser);
        } catch (\RuntimeException $e) {
            return $this->errorJson($e->getMessage(), 400);
        }

        return $this->json([
            'message' => 'Vous suivez maintenant cet utilisateur',
            'isFollowing' => true,
        ], 201);
    }

    /**
     * Unfollow a user
     * DELETE /api/users/{id}/follow
     */
    #[Route('/users/{id}/follow', name: 'api.users.unfollow', methods: ['DELETE'])]
    #[IsGranted('ROLE_USER')]
    public function unfollow(int $id, #[CurrentUser] User $currentUser): JsonResponse
    {
        $targetUser = $this->userVisibilityResolver->findVisibleById($id);
        if ($targetUser === null) {
            return $this->errorJson('Utilisateur non trouvé', 404);
        }

        if (!$currentUser instanceof User) {
            return $this->errorJson('Non authentifié', 401);
        }

        $this->followService->unfollow($currentUser, $targetUser);

        return $this->json([
            'message' => 'Vous ne suivez plus cet utilisateur',
            'isFollowing' => false,
        ], 200);
    }

    /**
     * Update user profile
     * PUT /api/users/{id}
     */
    #[Route('/users/{id}', name: 'api.users.update', methods: ['PUT'])]
    #[IsGranted('ROLE_USER')]
    public function update(
        int $id,
        #[CurrentUser] User $currentUser,
        Request $request,
    ): JsonResponse {
        // Only allow users to update their own profile
        if ($currentUser->getId() !== $id) {
            return $this->errorJson('Vous ne pouvez modifier que votre propre profil', 403);
        }

        $contentType = $request->headers->get('Content-Type', '');
        
        // Parse multipart form data for non-POST requests
        if (str_starts_with($contentType, 'multipart/form-data')) {
            $parsed = $this->parseMultipartRequest($request);
            $data = $parsed['fields'];
            
            // Convert parsed files to UploadedFile objects
            $uploadedFiles = [];
            foreach ($parsed['files'] as $fieldName => $fileInfo) {
                error_log("DEBUG: Creating UploadedFile for $fieldName from " . $fileInfo['tmp_name']);
                $uploadedFiles[$fieldName] = new UploadedFile(
                    $fileInfo['tmp_name'],
                    $fileInfo['name'],
                    $fileInfo['type'],
                    $fileInfo['error'],
                    true  // TEST MODE - trust the file is valid
                );
                error_log("DEBUG: UploadedFile created: " . $uploadedFiles[$fieldName]->getClientOriginalName());
            }
        } else {
            // Handle JSON requests
            $data = json_decode($request->getContent(), true) ?? [];
            $uploadedFiles = [];
        }
        
        $payload = new UpdateProfilePayload();
        $payload->bio = $data['bio'] ?? null;
        $payload->website = $data['website'] ?? null;
        $payload->location = $data['location'] ?? null;

        // Get file uploads
        $profilePicture = $uploadedFiles['profilePicture'] ?? null;
        $bannerPicture = $uploadedFiles['bannerPicture'] ?? null;

        error_log("DEBUG: profilePicture: " . (is_object($profilePicture) ? get_class($profilePicture) . " ({$profilePicture->getClientOriginalName()})" : var_export($profilePicture, true)));
        error_log("DEBUG: bannerPicture: " . (is_object($bannerPicture) ? get_class($bannerPicture) . " ({$bannerPicture->getClientOriginalName()})" : var_export($bannerPicture, true)));

        // Update profile
        try {
            $updatedUser = $this->updateProfileService->updateProfile(
                $currentUser,
                $payload->bio,
                $payload->website,
                $payload->location,
                $profilePicture,
                $bannerPicture,
            );

            return $this->json([
                'user' => [
                    'id' => $updatedUser->getId(),
                    'email' => $updatedUser->getEmail(),
                    'username' => $updatedUser->getUsername(),
                    'bio' => $updatedUser->getBio(),
                    'profilePicture' => $this->mediaUrlResolver->resolveUploadPath($updatedUser->getProfilePicture()),
                    'bannerPicture' => $this->mediaUrlResolver->resolveUploadPath($updatedUser->getBannerPicture()),
                    'location' => $updatedUser->getLocation(),
                    'website' => $updatedUser->getWebsite(),
                ],
                'message' => 'Profil mis à jour avec succès',
            ], 200);
        } catch (\Exception $e) {
            error_log("ERROR in update profile: " . $e->getMessage());
            return $this->errorJson('Erreur lors de la mise à jour: ' . $e->getMessage(), 400);
        }
    }
}
