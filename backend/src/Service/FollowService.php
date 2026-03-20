<?php

namespace App\Service;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;

class FollowService
{
    public function __construct(
        private EntityManagerInterface $em,
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

        $follower->addFollowingUser($following);
        $following->addFollowersUser($follower);

        $this->em->persist($follower);
        $this->em->flush();
    }

    /**
     * Make a user unfollow another user
     */
    public function unfollow(User $follower, User $following): void
    {
        if ($this->isFollowing($follower, $following)) {
            $follower->removeFollowingUser($following);
            $following->removeFollowersUser($follower);
            $this->em->persist($follower);
            $this->em->flush();
        }
    }

    /**
     * Check if a user is following another user
     */
    public function isFollowing(User $follower, User $following): bool
    {
        return $follower->getFollowingUsers()->contains($following);
    }

    /**
     * Get the count of users that are following a given user
     */
    public function getFollowerCount(User $user): int
    {
        return $user->getFollowersUsers()->count();
    }

    /**
     * Get the count of users that a given user is following
     */
    public function getFollowingCount(User $user): int
    {
        return $user->getFollowingUsers()->count();
    }
}
