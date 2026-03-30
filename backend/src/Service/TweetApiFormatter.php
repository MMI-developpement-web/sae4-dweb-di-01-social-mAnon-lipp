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
        $isCensored = $tweet->isCensored() ?? false;

        if ($isBlocked) {
            $content = 'Ce compte a été bloqué pour non respect des conditions d\'utilisation';
            $authorUsername = 'Utilisateur introuvable';
        }

        if ($isCensored) {
            $content = 'Ce message enfreint les conditions d\'utilisation de la plateforme';
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

        if (!$isBlocked && !$isCensored) {
            $tweetData['likeCount'] = $this->countVisibleLikes($tweet);
            $tweetData['isLiked'] = $currentUser instanceof User
                ? $currentUser->getLikedTweets()->contains($tweet)
                : false;
            
            // Add media URLs (always include, even if empty array)
            if (is_array($tweet->getMedias())) {
                $tweetData['medias'] = array_map(
                    fn (array $media): array => [
                        'url' => $media['url'] ?? null, // URL already has /uploads/ prefix from TweetUploadService
                        'type' => $media['type'] ?? 'image',
                        'mimeType' => $media['mimeType'] ?? '',
                    ],
                    $tweet->getMedias()
                );
            } else {
                // Explicitly set empty array if no medias
                $tweetData['medias'] = [];
            }

            // Add replies - filter censored ones
            $replies = $tweet->getReplies();
            if ($replies && count($replies) > 0) {
                $visibleReplies = $replies->filter(fn ($reply) => !($reply->isCensored() ?? false))->toArray();
                if (count($visibleReplies) > 0) {
                    $tweetData['replies'] = array_map(
                        fn ($reply): array => [
                            'id' => $reply->getId(),
                            'content' => $reply->getContent(),
                            'createdAt' => $reply->getCreatedAt(),
                            'author' => [
                                'id' => $reply->getAuthor()->getId(),
                                'username' => $reply->getAuthor()->getUsername(),
                                'profilePicture' => $this->mediaUrlResolver->resolveUploadPath($reply->getAuthor()->getProfilePicture()),
                            ],
                            'medias' => is_array($reply->getMedias()) ? array_map(
                                fn (array $media): array => [
                                    'url' => $media['url'] ?? null,
                                    'type' => $media['type'] ?? 'image',
                                    'mimeType' => $media['mimeType'] ?? '',
                                ],
                                $reply->getMedias()
                            ) : [],
                        ],
                        $visibleReplies
                    );
                }
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
