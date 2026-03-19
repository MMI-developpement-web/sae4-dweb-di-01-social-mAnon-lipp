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
            ->leftJoin('App\\Entity\\Follow', 'f', 'WITH', 'f.following = t.author AND IDENTITY(f.follower) = :userId')
            ->andWhere('IDENTITY(t.author) = :userId OR f.id IS NOT NULL')
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
            ->select('COUNT(t.id)')
            ->leftJoin('App\\Entity\\Follow', 'f', 'WITH', 'f.following = t.author AND IDENTITY(f.follower) = :userId')
            ->andWhere('IDENTITY(t.author) = :userId OR f.id IS NOT NULL')
            ->setParameter('userId', $userId)
            ->getQuery()
            ->getSingleScalarResult();
    }

//    /**
//     * @return Tweet[] Returns an array of Tweet objects
//     */
//    public function findByExampleField($value): array
//    {
//        return $this->createQueryBuilder('t')
//            ->andWhere('t.exampleField = :val')
//            ->setParameter('val', $value)
//            ->orderBy('t.id', 'ASC')
//            ->setMaxResults(10)
//            ->getQuery()
//            ->getResult()
//        ;
//    }

//    public function findOneBySomeField($value): ?Tweet
//    {
//        return $this->createQueryBuilder('t')
//            ->andWhere('t.exampleField = :val')
//            ->setParameter('val', $value)
//            ->getQuery()
//            ->getOneOrNullResult()
//        ;
//    }
}
