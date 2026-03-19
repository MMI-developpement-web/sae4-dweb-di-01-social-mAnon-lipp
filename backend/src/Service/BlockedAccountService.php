<?php

namespace App\Service;

use App\Entity\Tweet;
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

    /**
     * Transform a tweet from a blocked user account
     * Replaces content with a blocked message
     */
    public function transformBlockedTweet(Tweet $tweet): Tweet
    {
        if ($this->isUserBlocked($tweet->getAuthor())) {
            $tweet->setContent('Ce compte a été bloqué pour non respect des conditions d\'utilisation');
        }
        return $tweet;
    }

    /**
     * Check if a tweet should be hidden because its author is blocked
     */
    public function shouldHideTweet(Tweet $tweet): bool
    {
        return $this->isUserBlocked($tweet->getAuthor());
    }
}
