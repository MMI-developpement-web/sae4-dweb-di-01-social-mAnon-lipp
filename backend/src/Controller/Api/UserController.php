<?php

namespace App\Controller\Api;

use App\Dto\Payload\UpdateProfilePayload;
use App\Entity\User;
use App\Repository\TweetRepository;
use App\Service\FollowService;
use App\Service\BlockService;
use App\Service\UpdateProfileService;
use App\Resolver\MediaUrlResolver;
use App\Resolver\PaginationResolver;
use App\Service\TweetApiFormatter;
use App\Resolver\UserVisibilityResolver;
use App\Trait\ParseMultipartTrait;
use Doctrine\ORM\EntityManagerInterface;
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
        private BlockService $blockService,
        private PaginationResolver $paginationResolver,
        private MediaUrlResolver $mediaUrlResolver,
        private TweetApiFormatter $tweetApiFormatter,
        private UpdateProfileService $updateProfileService,
        private EntityManagerInterface $entityManager,
    ) {
    }

    /**
     * Get user profile by ID
     * GET /api/users/{id}
     */
    #[Route('/users/{id}', name: 'api.users.show', methods: ['GET'], requirements: ['id' => '\\d+'])]
    #[IsGranted('ROLE_USER')]

    public function show(int $id, #[CurrentUser] User $currentUser): JsonResponse
    {
        $targetUser = $this->userVisibilityResolver->findVisibleById($id);
        if ($targetUser === null) {
            return $this->errorJson('Utilisateur non trouvé', 404);
        }

        $isFollowing = false;
        $isBlocked = false;
        $followerCount = $this->followService->getFollowerCount($targetUser);
        $followingCount = $this->followService->getFollowingCount($targetUser);
        if ($currentUser instanceof User) {
            $isFollowing = $this->followService->isFollowing($currentUser, $targetUser);
            $isBlocked = $this->blockService->isBlocked($currentUser, $targetUser);
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
                'isBlocked' => $isBlocked,
            ],
        ], 200);
    }

    /**
     * Get user profile by username
     * GET /api/users/by-username/{username}
     */
    #[Route('/users/by-username/{username}', name: 'api.users.show_by_username', methods: ['GET'])]
    #[IsGranted('ROLE_USER')]
    public function showByUsername(string $username, #[CurrentUser] User $currentUser): JsonResponse
    {
        $targetUser = $this->userVisibilityResolver->findVisibleByUsername($username);
        if ($targetUser === null) {
            return $this->errorJson('Utilisateur non trouvé', 404);
        }

        $isFollowing = false;
        $isBlocked = false;
        $followerCount = $this->followService->getFollowerCount($targetUser);
        $followingCount = $this->followService->getFollowingCount($targetUser);
        if ($currentUser instanceof User) {
            $isFollowing = $this->followService->isFollowing($currentUser, $targetUser);
            $isBlocked = $this->blockService->isBlocked($currentUser, $targetUser);
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
                'isBlocked' => $isBlocked,
            ],
        ], 200);
    }

    /**
     * Search users by partial username
     * GET /api/users/search?q=term
     */
    #[Route('/users/search', name: 'api.users.search', methods: ['GET'])]
    #[IsGranted('ROLE_USER')]
    public function search(Request $request): JsonResponse
    {
        $q = (string) $request->query->get('q', '');
        if (trim($q) === '') {
            return $this->json(['users' => []], 200);
        }

        $users = $this->userVisibilityResolver->findVisibleByUsernameLike($q, 10);

        $formattedUsers = [];
        foreach ($users as $user) {
            $formattedUsers[] = [
                'id' => $user->getId(),
                'email' => $user->getEmail(),
                'username' => $user->getUsername(),
                'bio' => $user->getBio(),
                'profilePicture' => $this->mediaUrlResolver->resolveUploadPath($user->getProfilePicture()),
                'bannerPicture' => $this->mediaUrlResolver->resolveUploadPath($user->getBannerPicture()),
                'location' => $user->getLocation(),
                'website' => $user->getWebsite(),
                'followerCount' => $this->followService->getFollowerCount($user),
                'followingCount' => $this->followService->getFollowingCount($user),
                'isFollowing' => false,
                'isBlocked' => false,
            ];
        }

        return $this->json(['users' => $formattedUsers], 200);
    }

    /**
     * Get user's tweets
     * GET /api/users/{id}/tweets?page=1&per_page=20
     */
    #[Route('/users/{id}/tweets', name: 'api.users.tweets', methods: ['GET'], requirements: ['id' => '\\d+'])]
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

        $tweets = $this->tweetRepository->findByUserWithPinnedFirst(
            $user->getId(),
            $perPage,
            $offset
        );

        $total = $this->tweetRepository->countByUser($user->getId());

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
    #[Route('/users/{id}/follow', name: 'api.users.follow', methods: ['POST'], requirements: ['id' => '\\d+'])]
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

        // Check if blocked by target user
        if ($this->blockService->isBlockedBy($currentUser, $targetUser)) {
            return $this->errorJson('Vous avez été bloqué par cet utilisateur', 403);
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
    #[Route('/users/{id}/follow', name: 'api.users.unfollow', methods: ['DELETE'], requirements: ['id' => '\\d+'])]
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
     * Block a user
     * POST /api/users/{id}/block
     */
    #[Route('/users/{id}/block', name: 'api.users.block', methods: ['POST'], requirements: ['id' => '\\d+'])]
    #[IsGranted('ROLE_USER')]
    public function block(int $id, #[CurrentUser] User $currentUser): JsonResponse
    {
        $targetUser = $this->userVisibilityResolver->findVisibleById($id);
        if ($targetUser === null) {
            return $this->errorJson('Utilisateur non trouvé', 404);
        }
        if (!$currentUser instanceof User) {
            return $this->errorJson('Non authentifié', 401);
        }

        try {
            $this->blockService->block($currentUser, $targetUser);
        } catch (\RuntimeException $e) {
            return $this->errorJson($e->getMessage(), 400);
        }

        return $this->json([
            'message' => 'Utilisateur bloqué avec succès',
            'isBlocked' => true,
        ], 201);
    }

    /**
     * Unblock a user
     * DELETE /api/users/{id}/block
     */
    #[Route('/users/{id}/block', name: 'api.users.unblock', methods: ['DELETE'], requirements: ['id' => '\\d+'])]
    #[IsGranted('ROLE_USER')]
    public function unblock(int $id, #[CurrentUser] User $currentUser): JsonResponse
    {
        $targetUser = $this->userVisibilityResolver->findVisibleById($id);
        if ($targetUser === null) {
            return $this->errorJson('Utilisateur non trouvé', 404);
        }
        if (!$currentUser instanceof User) {
            return $this->errorJson('Non authentifié', 401);
        }

        $this->blockService->unblock($currentUser, $targetUser);

        return $this->json([
            'message' => 'Utilisateur débloqué avec succès',
            'isBlocked' => false,
        ], 200);
    }

    /**
     * Get blocked users for current user
     * GET /api/users/{id}/blocked
     */
    #[Route('/users/{id}/blocked', name: 'api.users.blocked', methods: ['GET'], requirements: ['id' => '\\d+'])]
    #[IsGranted('ROLE_USER')]
    public function blocked(int $id, #[CurrentUser] User $currentUser): JsonResponse
    {
        // Only allow users to get their own blocked list
        if ($currentUser->getId() !== $id) {
            return $this->errorJson('Vous pouvez seulement voir votre propre liste de bloqués', 403);
        }

        $blockedUsers = $currentUser->getBlockedUsers();
        
        $formattedUsers = [];
        foreach ($blockedUsers as $user) {
            $formattedUsers[] = [
                'id' => $user->getId(),
                'email' => $user->getEmail(),
                'username' => $user->getUsername(),
                'bio' => $user->getBio(),
                'profilePicture' => $this->mediaUrlResolver->resolveUploadPath($user->getProfilePicture()),
                'bannerPicture' => $this->mediaUrlResolver->resolveUploadPath($user->getBannerPicture()),
                'location' => $user->getLocation(),
                'website' => $user->getWebsite(),
                'followerCount' => $this->followService->getFollowerCount($user),
                'followingCount' => $this->followService->getFollowingCount($user),
                'isFollowing' => false,
                'isBlocked' => true,
            ];
        }

        return $this->json([
            'users' => $formattedUsers,
        ], 200);
    }

    /**
     * Update user profile
     * PUT /api/users/{id}
     */
    #[Route('/users/{id}', name: 'api.users.update', methods: ['PUT'], requirements: ['id' => '\\d+'])]
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

        if (str_starts_with($contentType, 'multipart/form-data')) {
            // Parse multipart content into the Request object
            $this->parseMultipartRequest($request);
            $data = $request->request->all();
        } else {
            // Handle JSON requests
            $data = json_decode($request->getContent(), true) ?? [];
        }

        $payload = new UpdateProfilePayload();
        $payload->bio = $data['bio'] ?? null;
        $payload->website = $data['website'] ?? null;
        $payload->location = $data['location'] ?? null;

        // Get file uploads from Request (if set)
        $profilePicture = $request->files->get('profilePicture');
        $bannerPicture = $request->files->get('bannerPicture');

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
            return $this->errorJson('Erreur lors de la mise à jour du profil', 400);
        }
    }

    /**
     * Update user's read-only setting
     * PATCH /api/users/{id}/read-only
     */
    #[Route('/users/{id}/read-only', name: 'api.users.read_only', methods: ['PATCH'], requirements: ['id' => '\\d+'])]
    #[IsGranted('ROLE_USER')]
    public function updateReadOnly(
        int $id,
        #[CurrentUser] User $currentUser,
        Request $request,
    ): JsonResponse {
        // Only allow users to update their own read-only setting
        if ($currentUser->getId() !== $id) {
            return $this->errorJson('Vous ne pouvez modifier que votre propre paramètre', 403);
        }

        $data = json_decode($request->getContent(), true) ?? [];
        $readOnly = isset($data['readOnly']) ? (bool) $data['readOnly'] : false;

        $currentUser->setReadOnly($readOnly);
        $this->entityManager->flush();

        return $this->json([
            'readOnly' => $currentUser->getReadOnly(),
            'message' => 'Mode lecture seule ' . ($readOnly ? 'activé' : 'désactivé'),
        ], 200);
    }
}
