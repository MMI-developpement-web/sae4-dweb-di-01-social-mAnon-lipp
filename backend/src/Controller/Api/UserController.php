<?php

namespace App\Controller\Api;

use App\Entity\User;
use App\Repository\LikeRepository;
use App\Repository\UserRepository;
use App\Repository\TweetRepository;
use App\Service\FollowService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api', format: 'json')]
class UserController extends AbstractController
{
    public function __construct(
        private UserRepository $userRepository,
        private TweetRepository $tweetRepository,
        private LikeRepository $likeRepository,
        private FollowService $followService,
        private EntityManagerInterface $em,
    ) {
    }

    /**
     * Get user profile by ID
     * GET /api/users/{id}
     */
    #[Route('/users/{id}', name: 'api.users.show', methods: ['GET'])]
    #[IsGranted('ROLE_USER')]
    public function show(int $id): JsonResponse
    {
        $user = $this->userRepository->find($id);

        if (!$user) {
            return $this->json(['error' => 'Utilisateur non trouvé'], 404);
        }

        $currentUser = $this->getUser();
        $isFollowing = false;
        if ($currentUser instanceof User) {
            $isFollowing = $this->followService->isFollowing($currentUser, $user);
        }

        return $this->json([
            'user' => [
                'id' => $user->getId(),
                'email' => $user->getEmail(),
                'username' => $user->getUsername(),
                'bio' => $user->getBio(),
                'profilePicture' => $user->getProfilePictureUrl(),
                'banner' => $user->getBannerPictureUrl(),
                'location' => $user->getLocation(),
                'website' => $user->getWebsite(),
                'followerCount' => $user->getFollowerCount(),
                'followingCount' => $user->getFollowingCount(),
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
    public function tweets(int $id, Request $request): JsonResponse
    {
        $user = $this->userRepository->find($id);

        if (!$user) {
            return $this->json(['error' => 'Utilisateur non trouvé'], 404);
        }

        $page = max(1, (int) $request->query->get('page', 1));
        $perPage = min(50, max(1, (int) $request->query->get('per_page', 20)));
        $offset = ($page - 1) * $perPage;

        $tweets = $this->tweetRepository->findBy(
            ['author' => $user],
            ['createdAt' => 'DESC'],
            $perPage,
            $offset
        );

        $total = $this->tweetRepository->count(['author' => $user]);

        $currentUser = $this->getUser();

        $formattedTweets = array_map(function ($tweet) use ($currentUser) {
            return [
                'id' => $tweet->getId(),
                'content' => $tweet->getContent(),
                'createdAt' => $tweet->getCreatedAt(),
                'author' => [
                    'id' => $tweet->getAuthor()->getId(),
                    'username' => $tweet->getAuthor()->getUsername(),
                    'profilePicture' => $tweet->getAuthor()->getProfilePictureUrl(),
                ],
                'likeCount' => $this->likeRepository->countLikesForTweet($tweet),
                'isLiked' => $this->likeRepository->hasUserLikedTweet($currentUser, $tweet),
            ];
        }, $tweets);

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
    public function follow(int $id): JsonResponse
    {
        $targetUser = $this->userRepository->find($id);

        if (!$targetUser) {
            return $this->json(['error' => 'Utilisateur non trouvé'], 404);
        }

        $currentUser = $this->getUser();
        if (!$currentUser instanceof User) {
            return $this->json(['error' => 'Non authentifié'], 401);
        }

        try {
            $this->followService->follow($currentUser, $targetUser);
        } catch (\RuntimeException $e) {
            return $this->json(['error' => $e->getMessage()], 400);
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
    public function unfollow(int $id): JsonResponse
    {
        $targetUser = $this->userRepository->find($id);

        if (!$targetUser) {
            return $this->json(['error' => 'Utilisateur non trouvé'], 404);
        }

        $currentUser = $this->getUser();
        if (!$currentUser instanceof User) {
            return $this->json(['error' => 'Non authentifié'], 401);
        }

        $this->followService->unfollow($currentUser, $targetUser);

        return $this->json([
            'message' => 'Vous ne suivez plus cet utilisateur',
            'isFollowing' => false,
        ], 200);
    }
}
