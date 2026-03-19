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
     * Get like count for a tweet (excluding likes from blocked users)
     */
    public function countLikesForTweet(Tweet $tweet): int
    {
        return (int) $this->createQueryBuilder('l')
            ->select('COUNT(l.id)')
            ->innerJoin('l.user', 'u')
            ->andWhere('l.tweet = :tweet')
            ->andWhere('u.isBlocked = false')
            ->setParameter('tweet', $tweet)
            ->getQuery()
            ->getSingleScalarResult();
    }

    /**
     * Get all likes for a tweet (excluding likes from blocked users)
     *
     * @return Like[]
     */
    public function findLikesForTweet(Tweet $tweet): array
    {
        return $this->createQueryBuilder('l')
            ->innerJoin('l.user', 'u')
            ->andWhere('l.tweet = :tweet')
            ->andWhere('u.isBlocked = false')
            ->setParameter('tweet', $tweet)
            ->orderBy('l.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }
}
