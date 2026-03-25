<?php

namespace App\Controller\Api;

use App\Dto\Payload\CreateReplyPayload;
use App\Entity\User;
use App\Repository\ReplyRepository;
use App\Repository\TweetRepository;
use App\Service\ReplyService;
use App\Service\BlockService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api', format: 'json')]
#[IsGranted('ROLE_USER')]
class ReplyController extends AbstractController
{
    use ApiJsonResponderTrait;

    public function __construct(
        private ReplyService $replyService,
        private ReplyRepository $replyRepository,
        private TweetRepository $tweetRepository,
        private BlockService $blockService,
    ) {
    }

    /**
     * Create a reply to a tweet
     * POST /api/tweets/{tweetId}/replies
     */
    #[Route('/tweets/{tweetId}/replies', name: 'api.replies.create', methods: ['POST'])]
    public function create(
        int $tweetId,
        #[MapRequestPayload] CreateReplyPayload $payload,
        #[CurrentUser] User $user,
    ): JsonResponse
    {
        $tweet = $this->tweetRepository->find($tweetId);
        if (!$tweet) {
            return $this->errorJson('Tweet non trouvé', 404);
        }

        // Check if user is blocked by tweet author
        if ($this->blockService->isBlockedBy($user, $tweet->getAuthor())) {
            return $this->errorJson('Vous avez été bloqué par cet utilisateur', 403);
        }

        try {
            $reply = $this->replyService->createReply($user, $payload->content, $tweetId);
            return $this->json($reply, 201, [], ['groups' => 'default']);
        } catch (\Symfony\Component\HttpKernel\Exception\NotFoundHttpException $e) {
            return $this->errorJson('Tweet not found', 404);
        } catch (\Exception $e) {
            return $this->errorJson('Failed to create reply', 500);
        }
    }

    /**
     * Delete a reply
     * DELETE /api/replies/{replyId}
     */
    #[Route('/replies/{replyId}', name: 'api.replies.delete', methods: ['DELETE'])]
    public function delete(
        int $replyId,
        #[CurrentUser] User $user,
    ): JsonResponse
    {
        $reply = $this->replyRepository->find($replyId);

        if (!$reply) {
            return $this->errorJson('Reply not found', 404);
        }

        if ($reply->getAuthor()->getId() !== $user->getId()) {
            return $this->errorJson('Unauthorized', 403);
        }

        $this->replyRepository->remove($reply, true);

        return $this->json(['success' => true], 200);
    }
}
