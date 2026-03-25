<?php

namespace App\Service;

use App\Entity\Tweet;
use App\Entity\User;
use App\Repository\TweetRepository;
use Doctrine\ORM\EntityManagerInterface;

class TweetService
{
    public function __construct(
        private EntityManagerInterface $em,
        private TweetRepository $tweetRepository
    ) {
    }

    public function createTweet(User $author, string $content, ?array $medias = null): Tweet
    {
        $tweet = new Tweet();
        $tweet->setContent($content);
        $tweet->setCreatedAt(new \DateTimeImmutable());
        $tweet->setAuthor($author);
        
        if ($medias !== null) {
            $tweet->setMedias($medias);
        }

        $this->em->persist($tweet);
        $this->em->flush();

        return $tweet;
    }

    /**
     * Update tweet if user is the author, otherwise throw
     */
    public function updateTweet(User $user, Tweet $tweet, string $content, ?array $medias = null): Tweet
    {
        if ($tweet->getAuthor()->getId() !== $user->getId()) {
            throw new \RuntimeException('Not authorized');
        }

        $tweet->setContent($content);
        $tweet->setUpdatedAt(new \DateTimeImmutable());
        
        if ($medias !== null) {
            $tweet->setMedias($medias);
        }

        $this->em->flush();

        return $tweet;
    }

    /**
     * Delete tweet if user is the author, otherwise throw
     */
    public function deleteTweet(User $user, Tweet $tweet): void
    {
        if ($tweet->getAuthor()->getId() !== $user->getId()) {
            throw new \RuntimeException('Not authorized');
        }

        $this->em->remove($tweet);
        $this->em->flush();
    }
}
