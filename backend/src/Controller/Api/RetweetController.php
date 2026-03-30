<?php

namespace App\Controller\Api;

use App\Dto\Payload\RetweetPayload;
use App\Entity\User;
use App\Entity\Tweet;
use App\Entity\Retweet;
use App\Repository\TweetRepository;
use App\Repository\RetweetRepository;
use App\Service\RetweetService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

#[Route('/api', format: 'json')]
#[IsGranted('ROLE_USER')]
class RetweetController extends AbstractController
{
    use ApiJsonResponderTrait;

    public function __construct(
        private TweetRepository $tweetRepository,
        private RetweetRepository $retweetRepository,
        private RetweetService $retweetService,
    ) {
    }

    /**
     * Create a retweet of an existing tweet
     * POST /api/tweets/{tweetId}/retweet
     */
    #[Route('/tweets/{tweetId}/retweet', name: 'api.tweets.retweet', methods: ['POST'])]
    public function create(
        int $tweetId,
        #[MapRequestPayload] RetweetPayload $payload,
        #[CurrentUser] User $user,
    ): JsonResponse {
        $tweet = $this->tweetRepository->find($tweetId);
        if (!$tweet) {
            throw new NotFoundHttpException('Tweet not found.');
        }

        $retweet = $this->retweetService->createRetweet($user, $tweet, $payload->content);
        
        // Count retweets for the original tweet
        $retweetCount = $this->retweetRepository->countByTweet($tweetId);

        return $this->json([
            'retweet' => $retweet,
            'retweetCount' => $retweetCount,
        ], 201, [], ['groups' => 'default']);
    }

    /**
     * Delete a retweet
     * DELETE /api/retweets/{retweetId}
     */
    #[Route('/retweets/{retweetId}', name: 'api.retweets.delete', methods: ['DELETE'])]
    public function delete(
        int $retweetId,
        #[CurrentUser] User $user,
    ): JsonResponse {
        $retweet = $this->retweetRepository->find($retweetId);
        if (!$retweet) {
            throw new NotFoundHttpException('Retweet not found.');
        }

        // Only the author of the retweet can delete it
        if ($retweet->getAuthor()->getId() !== $user->getId()) {
            throw new AccessDeniedHttpException('You can only delete your own retweets.');
        }

        // Get the tweet ID before deleting
        $tweetId = $retweet->getOriginalTweet()->getId();
        
        $this->retweetService->deleteRetweet($retweet);
        
        // Count retweets after deletion
        $retweetCount = $this->retweetRepository->countByTweet($tweetId);

        return $this->json([
            'tweetId' => $tweetId,
            'retweetCount' => $retweetCount,
        ], 200, [], ['groups' => 'default']);
    }
}
