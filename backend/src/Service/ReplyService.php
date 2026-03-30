<?php

namespace App\Service;

use App\Entity\Reply;
use App\Entity\Tweet;
use App\Entity\User;
use App\Repository\TweetRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use App\Service\TweetUploadService;

class ReplyService
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private TweetRepository $tweetRepository,
        private TweetUploadService $tweetUploadService,
    ) {}

    public function createReply(User $author, string $content, int $tweetId, ?array $mediaFiles = null): Reply
    {
        $tweet = $this->tweetRepository->find($tweetId);
        if (!$tweet) {
            throw new NotFoundHttpException('Tweet not found');
        }

        // Check if tweet author is in read-only mode
        if ($tweet->getAuthor()->getReadOnly()) {
            throw new \Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException(
                'This account is in read-only mode. No one can reply to their tweets.'
            );
        }

        $reply = new Reply();
        $reply->setContent(trim($content));
        $reply->setAuthor($author);
        $reply->setTweet($tweet);
        $reply->setCreatedAt(new \DateTimeImmutable());
        $reply->setIsCensored(false);

        // Handle media uploads if provided
        if ($mediaFiles !== null && !empty($mediaFiles)) {
            $uploadedMedias = $this->tweetUploadService->uploadTweetMedias($mediaFiles);
            $reply->setMedias($uploadedMedias);
        }

        $this->entityManager->persist($reply);
        $this->entityManager->flush();

        return $reply;
    }
}
