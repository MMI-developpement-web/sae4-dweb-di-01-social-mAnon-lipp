<?php

namespace App\Service;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;

class BlockService
{
    public function __construct(
        private EntityManagerInterface $em,
        private FollowService $followService,
    ) {
    }

    /**
     * Block a user from following and interacting
     */
    public function block(User $blocker, User $blocked): void
    {
        // Prevent self-blocking
        if ($blocker->getId() === $blocked->getId()) {
            throw new \RuntimeException('Vous ne pouvez pas vous bloquer vous-même');
        }

        // Check if already blocked
        if ($this->isBlocked($blocker, $blocked)) {
            throw new \RuntimeException('Cet utilisateur est déjà bloqué');
        }

        // Add the block relationship
        $blocker->addBlockedUser($blocked);

        // If blocked user was following the blocker, unfollow them
        if ($this->followService->isFollowing($blocked, $blocker)) {
            $this->followService->unfollow($blocked, $blocker);
        }

        $this->em->persist($blocker);
        $this->em->flush();
    }

    /**
     * Unblock a user
     */
    public function unblock(User $blocker, User $blocked): void
    {
        if ($this->isBlocked($blocker, $blocked)) {
            $blocker->removeBlockedUser($blocked);
            $this->em->persist($blocker);
            $this->em->flush();
        }
    }

    /**
     * Check if a user is blocked by another user
     */
    public function isBlocked(User $blocker, User $blocked): bool
    {
        return $blocker->getBlockedUsers()->contains($blocked);
    }

    /**
     * Check if a user is blocked by someone (i.e., user cannot follow them)
     */
    public function isBlockedBy(User $user, User $potentialBlocker): bool
    {
        return $potentialBlocker->getBlockedUsers()->contains($user);
    }

    /**
     * Get the count of users that a given user has blocked
     */
    public function getBlockedCount(User $user): int
    {
        return $user->getBlockedUsers()->count();
    }
}
