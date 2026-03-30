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
     */
    public function createRetweet(User $author, Tweet $originalTweet, ?string $content = null): Retweet
    {
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
