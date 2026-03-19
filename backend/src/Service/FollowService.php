<?php

namespace App\Service;

use App\Entity\Follow;
use App\Entity\User;
use App\Repository\FollowRepository;
use Doctrine\ORM\EntityManagerInterface;

class FollowService
{
    public function __construct(
        private EntityManagerInterface $em,
        private FollowRepository $followRepository
    ) {
    }

    /**
     * Make a user follow another user
     */
    public function follow(User $follower, User $following): void
    {
        // Prevent self-following
        if ($follower->getId() === $following->getId()) {
            throw new \RuntimeException('Vous ne pouvez pas vous suivre vous-même');
        }

        // Check if already following
        if ($this->isFollowing($follower, $following)) {
            throw new \RuntimeException('Vous suivez déjà cet utilisateur');
        }

        $follow = new Follow();
        $follow->setFollower($follower);
        $follow->setFollowing($following);

        $this->em->persist($follow);
        $this->em->flush();
    }

    /**
     * Make a user unfollow another user
     */
    public function unfollow(User $follower, User $following): void
    {
        $follow = $this->followRepository->findOneBy([
            'follower' => $follower,
            'following' => $following,
        ]);

        if ($follow) {
            $this->em->remove($follow);
            $this->em->flush();
        }
    }

    /**
     * Check if a user is following another user
     */
    public function isFollowing(User $follower, User $following): bool
    {
        $followerId = $follower->getId();
        $followingId = $following->getId();

        if ($followerId === null || $followingId === null) {
            return false;
        }

        return $this->followRepository->existsFollow($followerId, $followingId);
    }

    /**
     * Get the count of users that are following a given user
     */
    public function getFollowerCount(User $user): int
    {
        return $this->followRepository->count(['following' => $user]);
    }

    /**
     * Get the count of users that a given user is following
     */
    public function getFollowingCount(User $user): int
    {
        return $this->followRepository->count(['follower' => $user]);
    }
}
