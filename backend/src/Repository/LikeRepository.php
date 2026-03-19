<?php

namespace App\Repository;

use App\Entity\Like;
use App\Entity\Tweet;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Like>
 */
class LikeRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Like::class);
    }

    /**
     * Check if a user likes a tweet
     */
    public function hasUserLikedTweet(User $user, Tweet $tweet): bool
    {
        return null !== $this->findOneBy([
            'user' => $user,
            'tweet' => $tweet,
        ]);
    }

    /**
     * Get like count for a tweet
     */
    public function countLikesForTweet(Tweet $tweet): int
    {
        return $this->count(['tweet' => $tweet]);
    }

    /**
     * Get all likes for a tweet
     *
     * @return Like[]
     */
    public function findLikesForTweet(Tweet $tweet): array
    {
        return $this->findBy(['tweet' => $tweet], ['createdAt' => 'DESC']);
    }
}
