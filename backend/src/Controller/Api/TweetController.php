<?php

namespace App\Controller\Api;

use App\Dto\Payload\TweetPayload;
use App\Entity\User;
use App\Repository\TweetRepository;
use App\Resolver\MediaUrlResolver;
use App\Resolver\PaginationResolver;
use App\Service\TweetApiFormatter;
use App\Service\TweetService;
use App\Service\TweetUploadService;
use App\Service\LikeService;
use App\Service\BlockService;
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
        private TweetUploadService $tweetUploadService,
        private MediaUrlResolver $mediaUrlResolver,
        private LikeService $likeService,
        private BlockService $blockService,
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
     * Create a new tweet with optional media uploads
     * POST /api/tweets
     * Supports multipart/form-data with 'content' and optional file uploads
     */
    #[Route('/tweets', name: 'api.tweets.create', methods: ['POST'])]
    public function create(
        #[CurrentUser] User $user,
        Request $request,
    ): JsonResponse
    {
        $contentType = $request->headers->get('Content-Type', '');
        $content = '';
        $medias = null;

        try {
            // Check if it's multipart (with files) or JSON
            if (str_starts_with($contentType, 'multipart/form-data')) {
                // Symfony automatically parses multipart/form-data for POST requests
                // Form fields are available via $request->request
                // Files are available via $request->files
                $content = trim($request->request->get('content', ''));

                // Get media files - they come as 'media[]'
                $mediaFiles = $request->files->get('media', []);
                if (!is_array($mediaFiles)) {
                    $mediaFiles = [$mediaFiles];
                }

                // Upload media files if present
                if (!empty($mediaFiles)) {
                    $medias = $this->tweetUploadService->uploadTweetMedias($mediaFiles);
                }
            } else {
                // Handle JSON request
                $payload = new TweetPayload();
                $payload->content = $request->getPayload()->get('content', '');
                $content = trim($payload->content);
            }

            // Validate content is not empty
            if (empty($content)) {
                return $this->errorJson('Le tweet ne peut pas être vide', 400);
            }

            // Validate content length
            if (strlen($content) > 280) {
                return $this->errorJson('Le tweet ne peut pas dépasser 280 caractères', 400);
            }

            // Create tweet with optional medias
            $tweet = $this->tweetService->createTweet($user, $content, $medias);

            $formattedTweet = $this->tweetApiFormatter->format($tweet, $user);
            return $this->json($formattedTweet, 201);
        } catch (\Exception $e) {
            error_log("ERROR in create tweet: " . $e->getMessage());
            return $this->errorJson('Erreur lors de la création du tweet: ' . $e->getMessage(), 400);
        }
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
     * Update a tweet (owner only)
     * PUT /api/tweets/{id}
     */
    #[Route('/tweets/{id}', name: 'api.tweets.update', methods: ['PUT'])]
    public function update(int $id, #[MapRequestPayload] TweetPayload $payload, #[CurrentUser] User $user): JsonResponse
    {
        $tweet = $this->tweetRepository->find($id);

        if (!$tweet) {
            return $this->errorJson('Tweet non trouvé', 404);
        }

        try {
            $tweet = $this->tweetService->updateTweet($user, $tweet, trim($payload->content), $payload->medias);
        } catch (\RuntimeException $e) {
            return $this->errorJson('Vous n\'êtes pas autorisé à modifier ce tweet', 403);
        }

        return $this->json($tweet, 200, [], ['groups' => 'default']);
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

        // Check if user is blocked by tweet author
        if ($this->blockService->isBlockedBy($user, $tweet->getAuthor())) {
            return $this->errorJson('Vous avez été bloqué par cet utilisateur', 403);
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

        // Check if user is blocked by tweet author
        if ($this->blockService->isBlockedBy($user, $tweet->getAuthor())) {
            return $this->errorJson('Vous avez été bloqué par cet utilisateur', 403);
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

