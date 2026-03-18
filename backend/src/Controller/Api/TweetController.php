<?php

namespace App\Controller\Api;

use App\Entity\Tweet;
use App\Entity\User;
use App\Repository\TweetRepository;
use App\Repository\UserRepository;
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
        private EntityManagerInterface $em,
        private ValidatorInterface $validator,
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

        $tweets = $this->tweetRepository->findLatest($perPage, $offset);
        $total = $this->tweetRepository->count([]);

        // Format tweets with author profile pictures
        $formattedTweets = array_map(function (Tweet $tweet) {
            return [
                'id' => $tweet->getId(),
                'content' => $tweet->getContent(),
                'createdAt' => $tweet->getCreatedAt(),
                'author' => [
                    'id' => $tweet->getAuthor()->getId(),
                    'username' => $tweet->getAuthor()->getUsername(),
                    'profilePicture' => $tweet->getAuthor()->getProfilePictureUrl(),
                ],
            ];
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
     * Get user profile with tweets
     * GET /api/users/{id}
     */
    #[Route('/users/{id}', name: 'api.users.profile', methods: ['GET'])]
    public function profile(int $id, Request $request): JsonResponse
    {
        $user = $this->userRepository->find($id);

        if (!$user) {
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
            'tweets' => $tweets,
            'pagination' => [
                'current_page' => $page,
                'per_page' => $perPage,
                'total_items' => $total,
            ],
        ], 200, [], ['groups' => 'default']);
    }
}

