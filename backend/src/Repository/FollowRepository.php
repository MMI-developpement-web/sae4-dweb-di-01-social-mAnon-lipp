<?php

namespace App\Repository;

use App\Entity\Follow;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Follow>
 */
class FollowRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Follow::class);
    }

    /**
     * Get all users that a given user is following
     *
     * @return Follow[] Returns an array of Follow objects
     */
    public function findFollowingByUser($user): array
    {
        return $this->createQueryBuilder('f')
            ->andWhere('f.follower = :user')
            ->setParameter('user', $user)
            ->orderBy('f.id', 'DESC')
            ->getQuery()
            ->getResult()
        ;
    }

    /**
     * Get all followers of a given user
     *
     * @return Follow[] Returns an array of Follow objects
     */
    public function findFollowersByUser($user): array
    {
        return $this->createQueryBuilder('f')
            ->andWhere('f.following = :user')
            ->setParameter('user', $user)
            ->orderBy('f.id', 'DESC')
            ->getQuery()
            ->getResult()
        ;
    }

    /**
     * Check whether a follow relation exists using raw IDs.
     */
    public function existsFollow(int $followerId, int $followingId): bool
    {
        $count = (int) $this->createQueryBuilder('f')
            ->select('COUNT(f.id)')
            ->andWhere('IDENTITY(f.follower) = :followerId')
            ->andWhere('IDENTITY(f.following) = :followingId')
            ->setParameter('followerId', $followerId)
            ->setParameter('followingId', $followingId)
            ->getQuery()
            ->getSingleScalarResult();

        return $count > 0;
    }
}
