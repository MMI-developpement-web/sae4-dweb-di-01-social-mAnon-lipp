<?php

namespace App\Controller\Api;

use App\Entity\User;
use App\Repository\TweetRepository;
use App\Service\FollowService;
use App\Resolver\MediaUrlResolver;
use App\Resolver\PaginationResolver;
use App\Service\TweetApiFormatter;
use App\Resolver\UserVisibilityResolver;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api', format: 'json')]
class UserController extends AbstractController
{
    use ApiJsonResponderTrait;

    public function __construct(
        private UserVisibilityResolver $userVisibilityResolver,
        private TweetRepository $tweetRepository,
        private FollowService $followService,
        private PaginationResolver $paginationResolver,
        private MediaUrlResolver $mediaUrlResolver,
        private TweetApiFormatter $tweetApiFormatter,
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
                'banner' => $this->mediaUrlResolver->resolveUploadPath($targetUser->getBannerPicture()),
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
}
