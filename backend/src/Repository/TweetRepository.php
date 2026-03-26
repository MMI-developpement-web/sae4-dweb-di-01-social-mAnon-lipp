<?php

namespace App\Repository;

use App\Entity\Tweet;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Tweet>
 */
class TweetRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Tweet::class);
    }

    /**
     * @return Tweet[]
     */
    public function findLatest(int $limit, int $offset): array
    {
        return $this->createQueryBuilder('t')
            ->orderBy('t.createdAt', 'DESC')
            ->setMaxResults($limit)
            ->setFirstResult($offset)
            ->getQuery()
            ->getResult();
    }

    /**
     * Feed tweets: current user's tweets + followed users' tweets.
     * Excludes tweets from users who have blocked the current user.
     *
     * @return Tweet[]
     */
    public function findFeedForUser(int $userId, int $limit, int $offset): array
    {
        $qb = $this->createQueryBuilder('t')
            ->leftJoin('t.author', 'author')
            ->leftJoin('author.followersUsers', 'follower')
            // Exclude tweets from users who have blocked current user
            ->leftJoin('author.blockedByUsers', 'blocker')
            ->andWhere('IDENTITY(t.author) = :userId OR follower.id = :userId')
            ->andWhere('blocker.id != :userId OR blocker.id IS NULL')
            ->setParameter('userId', $userId)
            ->orderBy('t.createdAt', 'DESC')
            ->setMaxResults($limit)
            ->setFirstResult($offset);

        return $qb->getQuery()->getResult();
    }

    public function countFeedForUser(int $userId): int
    {
        return (int) $this->createQueryBuilder('t')
            ->select('COUNT(DISTINCT t.id)')
            ->leftJoin('t.author', 'author')
            ->leftJoin('author.followersUsers', 'follower')
            // Exclude tweets from users who have blocked current user
            ->leftJoin('author.blockedByUsers', 'blocker')
            ->andWhere('IDENTITY(t.author) = :userId OR follower.id = :userId')
            ->andWhere('blocker.id != :userId OR blocker.id IS NULL')
            ->setParameter('userId', $userId)
            ->getQuery()
            ->getSingleScalarResult();
    }

    public function findPinnedByUser(int $userId): ?Tweet
    {
        return $this->createQueryBuilder('t')
            ->where('t.author = :userId')
            ->andWhere('t.isPinned = true')
            ->setParameter('userId', $userId)
            ->getQuery()
            ->getOneOrNullResult();
    }

    /**
     * Get user tweets with pinned tweet first
     * @return Tweet[]
     */
    public function findByUserWithPinnedFirst(int $userId, int $limit, int $offset): array
    {
        return $this->createQueryBuilder('t')
            ->where('t.author = :userId')
            ->setParameter('userId', $userId)
            ->orderBy('t.isPinned', 'DESC')
            ->addOrderBy('t.createdAt', 'DESC')
            ->setMaxResults($limit)
            ->setFirstResult($offset)
            ->getQuery()
            ->getResult();
    }

    public function countByUser(int $userId): int
    {
        return (int) $this->createQueryBuilder('t')
            ->select('COUNT(t.id)')
            ->where('t.author = :userId')
            ->setParameter('userId', $userId)
            ->getQuery()
            ->getSingleScalarResult();
    }

    public function save(Tweet $tweet, bool $flush = false): void
    {
        $this->getEntityManager()->persist($tweet);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }
}
