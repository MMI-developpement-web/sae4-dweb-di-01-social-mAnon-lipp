<?php

namespace App\Service;

use App\Entity\Reply;
use App\Entity\Retweet;
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
     * - Automatically censors all associated retweets
     *
     * @throws \RuntimeException
     */
    public function censorTweet(Tweet $tweet): void
    {
        $tweet->setIsCensored(true);
        
        // Automatically censor all retweets of this tweet
        foreach ($tweet->getRetweets() as $retweet) {
            $retweet->setIsCensored(true);
        }
        
        $this->entityManager->flush();
    }

    /**
     * Uncensor a tweet (restore original content)
     * Also uncensors all associated retweets
     *
     * @throws \RuntimeException
     */
    public function uncensorTweet(Tweet $tweet, string $originalContent): void
    {
        $tweet->setIsCensored(false);
        $tweet->setContent($originalContent);
        
        // Automatically uncensor all retweets of this tweet
        foreach ($tweet->getRetweets() as $retweet) {
            $retweet->setIsCensored(false);
        }
        
        $this->entityManager->flush();
    }

    /**
     * Censor a reply
     * Note: Retweets are only supported on tweets, not replies
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
