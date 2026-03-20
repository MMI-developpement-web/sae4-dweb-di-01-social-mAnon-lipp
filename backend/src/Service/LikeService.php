<?php

namespace App\Service;

use App\Entity\Tweet;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;

class LikeService
{
    public function __construct(
        private EntityManagerInterface $em,
    ) {
    }

    public function like(User $user, Tweet $tweet): void
    {
        if ($user->getLikedTweets()->contains($tweet)) {
            throw new \RuntimeException('Already liked');
        }

        $user->addLikedTweet($tweet);
        $tweet->addLikedByUser($user);

        $this->em->persist($user);
        $this->em->flush();
    }

    public function unlike(User $user, Tweet $tweet): void
    {
        if (!$user->getLikedTweets()->contains($tweet)) {
            throw new \RuntimeException('Like not found');
        }

        $user->removeLikedTweet($tweet);
        $tweet->removeLikedByUser($user);

        $this->em->persist($user);
        $this->em->flush();
    }
}
