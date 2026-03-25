<?php

namespace App\Service;

use App\Entity\Reply;
use App\Entity\Tweet;
use App\Entity\User;
use App\Repository\TweetRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class ReplyService
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private TweetRepository $tweetRepository,
    ) {}

    public function createReply(User $author, string $content, int $tweetId): Reply
    {
        $tweet = $this->tweetRepository->find($tweetId);
        if (!$tweet) {
            throw new NotFoundHttpException('Tweet not found');
        }

        $reply = new Reply();
        $reply->setContent(trim($content));
        $reply->setAuthor($author);
        $reply->setTweet($tweet);
        $reply->setCreatedAt(new \DateTimeImmutable());

        $this->entityManager->persist($reply);
        $this->entityManager->flush();

        return $reply;
    }
}
