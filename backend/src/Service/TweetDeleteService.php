<?php

namespace App\Service;

use App\Entity\Tweet;
use App\Entity\Reply;
use Doctrine\ORM\EntityManagerInterface;

class TweetDeleteService
{
    public function __construct(
        private EntityManagerInterface $em,
    ) {
    }

    /**
     * Delete a tweet and all its associated likes and replies.
     * Retweets are NOT deleted, they remain with their reference to the deleted tweet.
     */
    public function deleteTweet(Tweet $tweet): void
    {
        // Remove all likes (ManyToMany relationship)
        foreach ($tweet->getLikedByUsers() as $user) {
            $user->removeLikedTweet($tweet);
            $tweet->removeLikedByUser($user);
        }

        // Replies will cascade delete due to Doctrine config: cascade: ['remove']
        // Retweets will NOT be deleted (no cascade configured)

        $this->em->remove($tweet);
        $this->em->flush();
    }

    /**
     * Delete a reply and its associated likes (if any).
     */
    public function deleteReply(Reply $reply): void
    {
        // Reply doesn't have direct likes, so we just remove it
        // The tweet's replies collection will automatically update due to Doctrine's bidirectional relationship

        $this->em->remove($reply);
        $this->em->flush();
    }
}
