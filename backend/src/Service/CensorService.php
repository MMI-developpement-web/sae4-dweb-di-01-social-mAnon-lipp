<?php

namespace App\Service;

use App\Entity\Reply;
use App\Entity\Tweet;
use Doctrine\ORM\EntityManagerInterface;

class CensorService
{
    public function __construct(
        private EntityManagerInterface $entityManager,
    ) {
    }

    /**
     * Censor a tweet
     * - Replaces content with a standard message
     * - Keeps likes and replies in DB but they won't be visible
     *
     * @throws \RuntimeException
     */
    public function censorTweet(Tweet $tweet): void
    {
        $tweet->setIsCensored(true);
        $this->entityManager->flush();
    }

    /**
     * Uncensor a tweet (restore original content)
     *
     * @throws \RuntimeException
     */
    public function uncensorTweet(Tweet $tweet, string $originalContent): void
    {
        $tweet->setIsCensored(false);
        $tweet->setContent($originalContent);
        $this->entityManager->flush();
    }

    /**
     * Censor a reply
     *
     * @throws \RuntimeException
     */
    public function censorReply(Reply $reply): void
    {
        $reply->setIsCensored(true);
        $this->entityManager->flush();
    }

    /**
     * Uncensor a reply (restore original content)
     *
     * @throws \RuntimeException
     */
    public function uncensorReply(Reply $reply, string $originalContent): void
    {
        $reply->setIsCensored(false);
        $reply->setContent($originalContent);
        $this->entityManager->flush();
    }

    /**
     * Check if a tweet is censored
     */
    public function isTweetCensored(Tweet $tweet): bool
    {
        return $tweet->isCensored() ?? false;
    }

    /**
     * Check if a reply is censored
     */
    public function isReplyCensored(Reply $reply): bool
    {
        return $reply->isCensored() ?? false;
    }

    /**
     * Get the censorship message
     */
    public static function getCensorshipMessage(): string
    {
        return 'Ce message enfreint les conditions d\'utilisation de la plateforme';
    }
}
