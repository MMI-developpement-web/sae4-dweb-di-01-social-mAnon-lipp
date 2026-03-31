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
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;

use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use App\Trait\ParseMultipartTrait;

#[Route('/api', format: 'json')]
#[IsGranted('ROLE_USER')]
class ReplyController extends AbstractController
{
    use ApiJsonResponderTrait;
    use ParseMultipartTrait;

    public function __construct(
        private ReplyService $replyService,
        private ReplyRepository $replyRepository,
        private TweetRepository $tweetRepository,
        private BlockService $blockService,
    ) {
    }

    /**
     * Create a reply to a tweet with optional media
     * POST /api/tweets/{tweetId}/replies
     * Supports multipart/form-data with 'content' and optional file uploads
     */
    #[Route('/tweets/{tweetId}/replies', name: 'api.replies.create', methods: ['POST'])]
    public function create(
        int $tweetId,
        Request $request,
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
            $contentType = strtolower((string) $request->headers->get('Content-Type', ''));
            
            // Parse multipart content into $request->files / $request->request when needed
            if (str_starts_with($contentType, 'multipart/form-data')) {
                $this->parseMultipartRequest($request);
            }

            // Get content from request (JSON or form data)
            if (str_starts_with($contentType, 'application/json')) {
                $data = $request->toArray();
                $content = $data['content'] ?? '';
            } else {
                $content = $request->request->get('content', '');
            }
            
            if (!is_string($content)) {
                $content = '';
            }

            $mediaFiles = [];

            // Extract media files if multipart
            if (str_starts_with($contentType, 'multipart/form-data')) {
                $mediaFiles = $this->extractMediaFiles($request);
            }

            // At least text or one media file is required
            if ($content === '' && $mediaFiles === []) {
                return $this->errorJson('La réponse ne peut pas être vide', 400);
            }

            // Validate content length
            if (mb_strlen($content) > 280) {
                return $this->errorJson('La réponse ne peut pas dépasser 280 caractères', 400);
            }

            // Create reply with optional medias
            $reply = $this->replyService->createReply($user, $content, $tweetId, empty($mediaFiles) ? null : $mediaFiles);
            return $this->json($reply, 201, [], ['groups' => 'default']);
        } catch (\Symfony\Component\HttpKernel\Exception\NotFoundHttpException $e) {
            return $this->errorJson('Tweet not found', 404);
        } catch (\Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException $e) {
            return $this->errorJson($e->getMessage(), 403);
        } catch (\Exception $e) {
            return $this->errorJson('Erreur lors de la création de la réponse', 500);
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
