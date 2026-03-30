<?php

namespace App\Repository;

use App\Entity\Retweet;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Retweet>
 */
class RetweetRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Retweet::class);
    }

    /**
     * Count the number of retweets for a specific tweet
     */
    public function countByTweet(int $tweetId): int
    {
        return (int) $this->createQueryBuilder('r')
            ->select('COUNT(r.id)')
            ->andWhere('r.originalTweet = :tweetId')
            ->setParameter('tweetId', $tweetId)
            ->getQuery()
            ->getSingleScalarResult();
    }

    /**
     * Feed retweets: current user's retweets + followed users' retweets.
     * Excludes retweets from users who have blocked the current user.
     *
     * @return Retweet[]
     */
    public function findFeedForUser(int $userId, int $limit, int $offset): array
    {
        $qb = $this->createQueryBuilder('r')
            ->join('r.author', 'author')
            ->leftJoin('author.followersUsers', 'follower')
            // Exclude retweets from users who have blocked current user
            ->leftJoin('author.blockedByUsers', 'blocker')
            ->andWhere('IDENTITY(r.author) = :userId OR follower.id = :userId')
            ->andWhere('blocker.id != :userId OR blocker.id IS NULL')
            ->setParameter('userId', $userId)
            ->orderBy('r.createdAt', 'DESC')
            ->setMaxResults($limit)
            ->setFirstResult($offset);

        return $qb->getQuery()->getResult();
    }

    public function countFeedForUser(int $userId): int
    {
        return (int) $this->createQueryBuilder('r')
            ->select('COUNT(DISTINCT r.id)')
            ->join('r.author', 'author')
            ->leftJoin('author.followersUsers', 'follower')
            // Exclude retweets from users who have blocked current user
            ->leftJoin('author.blockedByUsers', 'blocker')
            ->andWhere('IDENTITY(r.author) = :userId OR follower.id = :userId')
            ->andWhere('blocker.id != :userId OR blocker.id IS NULL')
            ->setParameter('userId', $userId)
            ->getQuery()
            ->getSingleScalarResult();
    }

    /**
     * Search retweets in user's feed by content or original tweet content
     * @return Retweet[]
     */
    public function searchFeedForUser(
        int $userId,
        int $limit,
        int $offset,
        string $query = '',
        string $username = '',
        ?\DateTime $startDate = null
    ): array
    {
        $qb = $this->createQueryBuilder('r')
            ->leftJoin('r.author', 'author')
            ->leftJoin('r.originalTweet', 'originalTweet')
            ->leftJoin('author.followersUsers', 'follower')
            ->leftJoin('author.blockedByUsers', 'blocker')
            ->andWhere('IDENTITY(r.author) = :userId OR follower.id = :userId')
            ->andWhere('blocker.id != :userId OR blocker.id IS NULL')
            ->setParameter('userId', $userId);

        // Filter by content - check both retweet content and original tweet content
        if ($query !== '') {
            $qb->andWhere('r.content LIKE :query OR originalTweet.content LIKE :query')
                ->setParameter('query', '%' . $query . '%');
        }

        // Filter by author username
        if ($username !== '') {
            $qb->andWhere('author.username LIKE :username')
                ->setParameter('username', '%' . $username . '%');
        }

        // Filter by start date
        if ($startDate !== null) {
            $qb->andWhere('r.createdAt >= :startDate')
                ->setParameter('startDate', $startDate);
        }

        return $qb->orderBy('r.createdAt', 'DESC')
            ->setMaxResults($limit)
            ->setFirstResult($offset)
            ->getQuery()
            ->getResult();
    }

    /**
     * Count search results for retweets
     */
    public function countSearchFeedForUser(
        int $userId,
        string $query = '',
        string $username = '',
        ?\DateTime $startDate = null
    ): int
    {
        $qb = $this->createQueryBuilder('r')
            ->select('COUNT(DISTINCT r.id)')
            ->leftJoin('r.author', 'author')
            ->leftJoin('r.originalTweet', 'originalTweet')
            ->leftJoin('author.followersUsers', 'follower')
            ->leftJoin('author.blockedByUsers', 'blocker')
            ->andWhere('IDENTITY(r.author) = :userId OR follower.id = :userId')
            ->andWhere('blocker.id != :userId OR blocker.id IS NULL')
            ->setParameter('userId', $userId);

        if ($query !== '') {
            $qb->andWhere('r.content LIKE :query OR originalTweet.content LIKE :query')
                ->setParameter('query', '%' . $query . '%');
        }

        if ($username !== '') {
            $qb->andWhere('author.username LIKE :username')
                ->setParameter('username', '%' . $username . '%');
        }

        if ($startDate !== null) {
            $qb->andWhere('r.createdAt >= :startDate')
                ->setParameter('startDate', $startDate);
        }

        return (int) $qb->getQuery()->getSingleScalarResult();
    }

//    /**
//     * @return Retweet[] Returns an array of Retweet objects
//     */
//    public function findByExampleField($value): array
//    {
//        return $this->createQueryBuilder('r')
//            ->andWhere('r.exampleField = :val')
//            ->setParameter('val', $value)
//            ->orderBy('r.id', 'ASC')
//            ->setMaxResults(10)
//            ->getQuery()
//            ->getResult()
//        ;
//    }

//    public function findOneBySomeField($value): ?Retweet
//    {
//        return $this->createQueryBuilder('r')
//            ->andWhere('r.exampleField = :val')
//            ->setParameter('val', $value)
//            ->getQuery()
//            ->getOneOrNullResult()
//        ;
//    }
}
