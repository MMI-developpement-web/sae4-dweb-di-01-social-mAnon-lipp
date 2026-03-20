<?php

namespace App\Service;

use App\Entity\User;

class BlockedAccountService
{
    /**
     * Check if a user is blocked
     */
    public function isUserBlocked(User $user): bool
    {
        return $user->isBlocked();
    }
}
