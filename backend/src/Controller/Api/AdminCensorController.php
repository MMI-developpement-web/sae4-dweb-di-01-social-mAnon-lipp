<?php

namespace App\Controller\Api;

use App\Entity\Tweet;
use App\Entity\Reply;
use App\Entity\Retweet;
use App\Repository\TweetRepository;
use App\Repository\ReplyRepository;
use App\Repository\RetweetRepository;
use App\Service\CensorService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/admin', format: 'json')]
#[IsGranted('ROLE_ADMIN')]
class AdminCensorController extends AbstractController
{
    use ApiJsonResponderTrait;

    public function __construct(
        private TweetRepository $tweetRepository,
        private ReplyRepository $replyRepository,
        private RetweetRepository $retweetRepository,
        private CensorService $censorService,
    ) {
    }

    /**
     * Censor a tweet
     * POST /api/admin/tweets/{id}/censor
     */
    #[Route('/tweets/{id}/censor', name: 'api.admin.tweets.censor', methods: ['POST'])]
    public function censorTweet(int $id): JsonResponse
    {
        $tweet = $this->tweetRepository->find($id);

        if (!$tweet) {
            return $this->errorJson('Tweet non trouvé', 404);
        }

        $this->censorService->censorTweet($tweet);

        return $this->json([
            'message' => 'Tweet censuré avec succès',
            'tweet' => ['id' => $tweet->getId(), 'isCensored' => $tweet->isCensored()],
        ], 200);
    }

    /**
     * Uncensor a tweet
     * POST /api/admin/tweets/{id}/uncensor
     */
    #[Route('/tweets/{id}/uncensor', name: 'api.admin.tweets.uncensor', methods: ['POST'])]
    public function uncensorTweet(int $id): JsonResponse
    {
        $tweet = $this->tweetRepository->find($id);

        if (!$tweet) {
            return $this->errorJson('Tweet non trouvé', 404);
        }

        $originalContent = $tweet->getContent(); // Stored before censorship
        $this->censorService->uncensorTweet($tweet, $originalContent);

        return $this->json([
            'message' => 'Tweet décensuré avec succès',
            'tweet' => ['id' => $tweet->getId(), 'isCensored' => $tweet->isCensored()],
        ], 200);
    }

    /**
     * Censor a reply
     * POST /api/admin/replies/{id}/censor
     */
    #[Route('/replies/{id}/censor', name: 'api.admin.replies.censor', methods: ['POST'])]
    public function censorReply(int $id): JsonResponse
    {
        $reply = $this->replyRepository->find($id);

        if (!$reply) {
            return $this->errorJson('Réponse non trouvée', 404);
        }

        $this->censorService->censorReply($reply);

        return $this->json([
            'message' => 'Réponse censurée avec succès',
            'reply' => ['id' => $reply->getId(), 'isCensored' => $reply->isCensored()],
        ], 200);
    }

    /**
     * Uncensor a reply
     * POST /api/admin/replies/{id}/uncensor
     */
    #[Route('/replies/{id}/uncensor', name: 'api.admin.replies.uncensor', methods: ['POST'])]
    public function uncensorReply(int $id): JsonResponse
    {
        $reply = $this->replyRepository->find($id);

        if (!$reply) {
            return $this->errorJson('Réponse non trouvée', 404);
        }

        $originalContent = $reply->getContent(); // Stored before censorship
        $this->censorService->uncensorReply($reply, $originalContent);

        return $this->json([
            'message' => 'Réponse décensurée avec succès',
            'reply' => ['id' => $reply->getId(), 'isCensored' => $reply->isCensored()],
        ], 200);
    }

    /**
     * Censor a retweet
     * POST /api/admin/retweets/{id}/censor
     */
    #[Route('/retweets/{id}/censor', name: 'api.admin.retweets.censor', methods: ['POST'])]
    public function censorRetweet(int $id): JsonResponse
    {
        $retweet = $this->retweetRepository->find($id);

        if (!$retweet) {
            return $this->errorJson('Retweet non trouvé', 404);
        }

        $retweet->setIsCensored(true);
        $this->retweetRepository->save($retweet, true);

        return $this->json([
            'message' => 'Retweet censuré avec succès',
            'retweet' => ['id' => $retweet->getId(), 'isCensored' => $retweet->isCensored()],
        ], 200);
    }

    /**
     * Uncensor a retweet
     * POST /api/admin/retweets/{id}/uncensor
     */
    #[Route('/retweets/{id}/uncensor', name: 'api.admin.retweets.uncensor', methods: ['POST'])]
    public function uncensorRetweet(int $id): JsonResponse
    {
        $retweet = $this->retweetRepository->find($id);

        if (!$retweet) {
            return $this->errorJson('Retweet non trouvé', 404);
        }

        $retweet->setIsCensored(false);
        $this->retweetRepository->save($retweet, true);

        return $this->json([
            'message' => 'Retweet décensuré avec succès',
            'retweet' => ['id' => $retweet->getId(), 'isCensored' => $retweet->isCensored()],
        ], 200);
    }
}
