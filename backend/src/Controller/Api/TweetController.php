<?php

namespace App\Controller\Api;

use App\Dto\Payload\TweetPayload;
use App\Entity\User;
use App\Repository\TweetRepository;
use App\Resolver\PaginationResolver;
use App\Service\TweetApiFormatter;
use App\Service\TweetService;
use App\Service\LikeService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api', format: 'json')]
#[IsGranted('ROLE_USER')]
class TweetController extends AbstractController
{
    use ApiJsonResponderTrait;

    public function __construct(
        private TweetRepository $tweetRepository,
        private PaginationResolver $paginationResolver,
        private TweetApiFormatter $tweetApiFormatter,
        private TweetService $tweetService,
        private LikeService $likeService,
    ) {
    }

    /**
     * List all tweets in reverse chronological order (paginated)
     * GET /api/tweets?page=1&per_page=20
     */
    #[Route('/tweets', name: 'api.tweets.all', methods: ['GET'])]
    public function all(Request $request, #[CurrentUser] User $user): JsonResponse
    {
        $pagination = $this->paginationResolver->fromRequest($request);
        $page = $pagination['page'];
        $perPage = $pagination['perPage'];
        $offset = $pagination['offset'];

        $tweets = $this->tweetRepository->findFeedForUser($user->getId(), $perPage, $offset);
        $total = $this->tweetRepository->countFeedForUser($user->getId());

        $formattedTweets = $this->tweetApiFormatter->formatCollection($tweets, $user);

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
     * Create a new tweet
     * POST /api/tweets
     */
    #[Route('/tweets', name: 'api.tweets.create', methods: ['POST'])]
    public function create(
        #[MapRequestPayload] TweetPayload $payload,
        #[CurrentUser] User $user
    ): JsonResponse
    {
        $content = trim($payload->content);

        $tweet = $this->tweetService->createTweet($user, $content);

        return $this->json($tweet, 201, [], ['groups' => 'default']);
    }

    /**
     * Delete a tweet (owner only)
     * DELETE /api/tweets/{id}
     */
    #[Route('/tweets/{id}', name: 'api.tweets.delete', methods: ['DELETE'])]
    public function delete(int $id, #[CurrentUser] User $user): JsonResponse
    {
        $tweet = $this->tweetRepository->find($id);

        if (!$tweet) {
            return $this->errorJson('Tweet non trouvé', 404);
        }

        try {
            $this->tweetService->deleteTweet($user, $tweet);
        } catch (\RuntimeException $e) {
            return $this->errorJson('Vous n\'êtes pas autorisé à supprimer ce tweet', 403);
        }

        return $this->json(['message' => 'Tweet supprimé avec succès'], 200);
    }

    /**
     * Like a tweet
     * POST /api/tweets/{id}/like
     */
    #[Route('/tweets/{id}/like', name: 'api.tweets.like', methods: ['POST'])]
    public function like(int $id, #[CurrentUser] User $user): JsonResponse
    {
        $tweet = $this->tweetRepository->find($id);

        if (!$tweet) {
            return $this->errorJson('Tweet non trouvé', 404);
        }

        try {
            $this->likeService->like($user, $tweet);
        } catch (\RuntimeException $e) {
            return $this->errorJson('Vous avez déjà liké ce tweet', 409);
        }

        return $this->json([
            'message' => 'Tweet liké avec succès',
            'likeCount' => $this->countVisibleLikes($tweet),
        ], 201);
    }

    /**
     * Unlike a tweet
     * DELETE /api/tweets/{id}/like
     */
    #[Route('/tweets/{id}/like', name: 'api.tweets.unlike', methods: ['DELETE'])]
    public function unlike(int $id, #[CurrentUser] User $user): JsonResponse
    {
        $tweet = $this->tweetRepository->find($id);

        if (!$tweet) {
            return $this->errorJson('Tweet non trouvé', 404);
        }

        try {
            $this->likeService->unlike($user, $tweet);
        } catch (\RuntimeException $e) {
            return $this->errorJson('Vous n\'avez pas liké ce tweet', 404);
        }

        return $this->json([
            'message' => 'Like retiré avec succès',
            'likeCount' => $this->countVisibleLikes($tweet),
        ], 200);
    }

    private function countVisibleLikes(\App\Entity\Tweet $tweet): int
    {
        $count = 0;

        foreach ($tweet->getLikedByUsers() as $user) {
            if (!$user->isBlocked()) {
                ++$count;
            }
        }

        return $count;
    }
}

