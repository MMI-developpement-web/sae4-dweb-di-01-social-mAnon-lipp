<?php

namespace App\Service;

use App\Entity\Retweet;
use App\Entity\Tweet;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;

class RetweetService
{
    public function __construct(private EntityManagerInterface $entityManager)
    {
    }

    /**
     * Create a retweet of an existing tweet
     * @throws \RuntimeException if the original tweet is censored
     */
    public function createRetweet(User $author, Tweet $originalTweet, ?string $content = null): Retweet
    {
        // Check if the original tweet is censored
        if ($originalTweet->isCensored()) {
            throw new \RuntimeException('Il n\'est pas possible de retweeter un message qui enfreint les conditions d\'utilisation de la plateforme.');
        }
        
        $retweet = new Retweet();
        $retweet->setAuthor($author);
        $retweet->setOriginalTweet($originalTweet);
        
        // Only set content if provided and not empty
        if ($content) {
            $retweet->setContent(trim($content));
        } else {
            $retweet->setContent(null);
        }
        
        $retweet->setCreatedAt(new \DateTimeImmutable());

        $this->entityManager->persist($retweet);
        $this->entityManager->flush();

        return $retweet;
    }

    /**
     * Delete a retweet
     */
    public function deleteRetweet(Retweet $retweet): void
    {
        $this->entityManager->remove($retweet);
        $this->entityManager->flush();
    }
}
