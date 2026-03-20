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
     *
     * @return Tweet[]
     */
    public function findFeedForUser(int $userId, int $limit, int $offset): array
    {
        return $this->createQueryBuilder('t')
            ->leftJoin('t.author', 'author')
            ->leftJoin('author.followersUsers', 'follower')
            ->andWhere('IDENTITY(t.author) = :userId OR follower.id = :userId')
            ->setParameter('userId', $userId)
            ->orderBy('t.createdAt', 'DESC')
            ->setMaxResults($limit)
            ->setFirstResult($offset)
            ->getQuery()
            ->getResult();
    }

    public function countFeedForUser(int $userId): int
    {
        return (int) $this->createQueryBuilder('t')
            ->select('COUNT(DISTINCT t.id)')
            ->leftJoin('t.author', 'author')
            ->leftJoin('author.followersUsers', 'follower')
            ->andWhere('IDENTITY(t.author) = :userId OR follower.id = :userId')
            ->setParameter('userId', $userId)
            ->getQuery()
            ->getSingleScalarResult();
    }
}
