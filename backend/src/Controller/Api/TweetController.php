<?php

namespace App\Controller\Api;

use App\Entity\Tweet;
use App\Entity\User;
use App\Repository\TweetRepository;
use App\Repository\UserRepository;
use App\Repository\LikeRepository;
use App\Entity\Like;
use App\Service\BlockedAccountService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Component\Validator\Constraints as Assert;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api', format: 'json')]
#[IsGranted('ROLE_USER')]
class TweetController extends AbstractController
{
    public function __construct(
        private TweetRepository $tweetRepository,
        private UserRepository $userRepository,
        private LikeRepository $likeRepository,
        private EntityManagerInterface $em,
        private ValidatorInterface $validator,
        private BlockedAccountService $blockedAccountService,
    ) {
    }

    /**
     * List all tweets in reverse chronological order (paginated)
     * GET /api/tweets?page=1&per_page=20
     */
    #[Route('/tweets', name: 'api.tweets.all', methods: ['GET'])]
    public function all(Request $request): JsonResponse
    {
        $page = max(1, (int) $request->query->get('page', 1));
        $perPage = min(50, max(1, (int) $request->query->get('per_page', 20)));
        $offset = ($page - 1) * $perPage;

        $currentUser = $this->getUser();
        if (!$currentUser instanceof User) {
            return $this->json(['error' => 'Non authentifie'], 401);
        }

        $tweets = $this->tweetRepository->findFeedForUser($currentUser->getId(), $perPage, $offset);
        $total = $this->tweetRepository->countFeedForUser($currentUser->getId());

        // Format tweets with author profile pictures and like info
        $formattedTweets = array_map(function (Tweet $tweet) use ($currentUser) {
            // Check if author is blocked and transform content and author name
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
                    'profilePicture' => $tweet->getAuthor()->getProfilePictureUrl(),
                ],
            ];
            
            // Don't add like info for blocked accounts
            if (!$isBlocked) {
                $tweetData['likeCount'] = $this->likeRepository->countLikesForTweet($tweet);
                $tweetData['isLiked'] = $this->likeRepository->hasUserLikedTweet($currentUser, $tweet);
            }
            
            return $tweetData;
        }, $tweets);

        return $this->json([
            'tweets' => $formattedTweets,
            'pagination' => [
                'current_page' => $page,
                'per_page' => $perPage,
                'total_items' => $total,
            ],
        ], 200);
    }

    /**
     * Create a new tweet
     * POST /api/tweets
     */
    #[Route('/tweets', name: 'api.tweets.create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $content = trim((string) ($data['content'] ?? ''));

        $violations = $this->validator->validate($content, [
            new Assert\NotBlank(message: 'Le tweet ne peut pas être vide.'),
            new Assert\Length(max: 280, maxMessage: 'Le tweet ne peut pas dépasser 280 caractères.'),
        ]);

        if (count($violations) > 0) {
            return $this->json(['error' => $violations[0]->getMessage()], 422);
        }

        $tweet = new Tweet();
        $tweet->setContent($content);
        $tweet->setCreatedAt(new \DateTimeImmutable());
        $tweet->setAuthor($this->getUser());

        $this->em->persist($tweet);
        $this->em->flush();

        return $this->json($tweet, 201, [], ['groups' => 'default']);
    }

    /**
     * Delete a tweet (owner only)
     * DELETE /api/tweets/{id}
     */
    #[Route('/tweets/{id}', name: 'api.tweets.delete', methods: ['DELETE'])]
    public function delete(int $id): JsonResponse
    {
        $tweet = $this->tweetRepository->find($id);

        if (!$tweet) {
            return $this->json(['error' => 'Tweet non trouvé'], 404);
        }

        // Check if the current user is the tweet author
        if ($tweet->getAuthor()->getId() !== $this->getUser()->getId()) {
            return $this->json(['error' => 'Vous n\'êtes pas autorisé à supprimer ce tweet'], 403);
        }

        $this->em->remove($tweet);
        $this->em->flush();

        return $this->json(['message' => 'Tweet supprimé avec succès'], 200);
    }

    /**
     * Legacy endpoint kept for compatibility.
     * Prefer /api/users/{id} in UserController and /api/users/{id}/tweets.
     * GET /api/users/{id}/profile
     */
    #[Route('/users/{id}/profile', name: 'api.users.profile', methods: ['GET'])]
    public function profile(int $id, Request $request): JsonResponse
    {
        $user = $this->userRepository->find($id);

        if (!$user) {
            return $this->json(['error' => 'Utilisateur non trouvé'], 404);
        }

        // If user is blocked, return 404
        if ($this->blockedAccountService->isUserBlocked($user)) {
            return $this->json(['error' => 'Utilisateur non trouvé'], 404);
        }

        $page = max(1, (int) $request->query->get('page', 1));
        $perPage = min(50, max(1, (int) $request->query->get('per_page', 20)));
        $offset = ($page - 1) * $perPage;

        // Get tweets for this user
        $tweets = $this->tweetRepository->findBy(
            ['author' => $user],
            ['createdAt' => 'DESC'],
            $perPage,
            $offset
        );

        $total = $this->tweetRepository->count(['author' => $user]);

        // Format tweets and apply blocked account transformation if needed
        $formattedTweets = array_map(function ($tweet) {
            $content = $tweet->getContent();
            $authorUsername = $tweet->getAuthor()->getUsername();
            $likeCount = $this->likeRepository->countLikesForTweet($tweet);
            $isBlocked = $this->blockedAccountService->isUserBlocked($tweet->getAuthor());
            
            if ($isBlocked) {
                $content = 'Ce compte a été bloqué pour non respect des conditions d\'utilisation';
                $authorUsername = 'Utilisateur introuvable';
                $likeCount = 0;
            }
            
            return [
                'id' => $tweet->getId(),
                'content' => $content,
                'createdAt' => $tweet->getCreatedAt(),
                'author' => [
                    'username' => $authorUsername,
                ],
                'likeCount' => $likeCount,
            ];
        }, $tweets);

        return $this->json([
            'user' => [
                'id' => $user->getId(),
                'username' => $user->getUsername(),
                'email' => $user->getEmail(),
                'bio' => $user->getBio(),
                'profilePicture' => $user->getProfilePictureUrl(),
                'banner' => $user->getBannerPictureUrl(),
                'location' => $user->getLocation(),
                'website' => $user->getWebsite(),
            ],
            'tweets' => $formattedTweets,
            'pagination' => [
                'current_page' => $page,
                'per_page' => $perPage,
                'total_items' => $total,
            ],
        ], 200, [], ['groups' => 'default']);
    }

    /**
     * Like a tweet
     * POST /api/tweets/{id}/like
     */
    #[Route('/tweets/{id}/like', name: 'api.tweets.like', methods: ['POST'])]
    public function like(int $id): JsonResponse
    {
        $tweet = $this->tweetRepository->find($id);

        if (!$tweet) {
            return $this->json(['error' => 'Tweet non trouvé'], 404);
        }

        $user = $this->getUser();

        // Check if user already likes this tweet
        if ($this->likeRepository->hasUserLikedTweet($user, $tweet)) {
            return $this->json(['error' => 'Vous avez déjà liké ce tweet'], 409);
        }

        $like = new Like();
        $like->setUser($user);
        $like->setTweet($tweet);
        $like->setCreatedAt(new \DateTimeImmutable());

        $this->em->persist($like);
        $this->em->flush();

        return $this->json([
            'message' => 'Tweet liké avec succès',
            'likeCount' => $this->likeRepository->countLikesForTweet($tweet),
        ], 201);
    }

    /**
     * Unlike a tweet
     * DELETE /api/tweets/{id}/like
     */
    #[Route('/tweets/{id}/like', name: 'api.tweets.unlike', methods: ['DELETE'])]
    public function unlike(int $id): JsonResponse
    {
        $tweet = $this->tweetRepository->find($id);

        if (!$tweet) {
            return $this->json(['error' => 'Tweet non trouvé'], 404);
        }

        $user = $this->getUser();
        $like = $this->likeRepository->findOneBy([
            'user' => $user,
            'tweet' => $tweet,
        ]);

        if (!$like) {
            return $this->json(['error' => 'Vous n\'avez pas liké ce tweet'], 404);
        }

        $this->em->remove($like);
        $this->em->flush();

        return $this->json([
            'message' => 'Like retiré avec succès',
            'likeCount' => $this->likeRepository->countLikesForTweet($tweet),
        ], 200);
    }
}

