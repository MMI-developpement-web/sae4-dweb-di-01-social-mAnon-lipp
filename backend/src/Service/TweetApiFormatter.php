<?php

namespace App\Service;

use App\Entity\Tweet;
use App\Entity\User;
use App\Resolver\MediaUrlResolver;

class TweetApiFormatter
{
    public function __construct(
        private BlockedAccountService $blockedAccountService,
        private MediaUrlResolver $mediaUrlResolver,
    ) {
    }

    /**
     * @return array<string, mixed>
     */
    public function format(Tweet $tweet, ?User $currentUser): array
    {
        $content = $tweet->getContent();
        $authorUsername = $tweet->getAuthor()->getUsername();
        $isBlocked = $this->blockedAccountService->isUserBlocked($tweet->getAuthor());

        if ($isBlocked) {
            $content = 'Ce compte a été bloqué pour non respect des conditions d\'utilisation';
            $authorUsername = 'Utilisateur introuvable';
        }

        $tweetData = [
            'id' => $tweet->getId(),
            'content' => $content,
            'createdAt' => $tweet->getCreatedAt(),
            'author' => [
                'id' => $tweet->getAuthor()->getId(),
                'username' => $authorUsername,
                'profilePicture' => $this->mediaUrlResolver->resolveUploadPath($tweet->getAuthor()->getProfilePicture()),
            ],
        ];

        if (!$isBlocked) {
            $tweetData['likeCount'] = $this->countVisibleLikes($tweet);
            $tweetData['isLiked'] = $currentUser instanceof User
                ? $currentUser->getLikedTweets()->contains($tweet)
                : false;
            
            // Add media URLs if present
            if ($tweet->getMedias() && is_array($tweet->getMedias())) {
                $tweetData['medias'] = array_map(
                    fn (array $media): array => [
                        'url' => $media['url'] ?? null, // URL already has /uploads/ prefix from TweetUploadService
                        'type' => $media['type'] ?? 'image',
                        'mimeType' => $media['mimeType'] ?? '',
                    ],
                    $tweet->getMedias()
                );
            }
        }

        return $tweetData;
    }

    /**
     * @param Tweet[] $tweets
     *
     * @return array<int, array<string, mixed>>
     */
    public function formatCollection(array $tweets, ?User $currentUser): array
    {
        return array_map(
            fn (Tweet $tweet): array => $this->format($tweet, $currentUser),
            $tweets
        );
    }

    private function countVisibleLikes(Tweet $tweet): int
    {
        $count = 0;

        foreach ($tweet->getLikedByUsers() as $user) {
            if (!$user->isBlocked()) {
                ++$count;
            }
        }

        return $count;
    }
}
