<?php

namespace App\Controller\Api;

use App\Entity\Tweet;
use App\Repository\TweetRepository;
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

        return $this->json([
            'tweets' => $tweets,
            'pagination' => [
                'current_page' => $page,
                'per_page' => $perPage,
                'total_items' => $total,
            ],
        ], 200, [], ['groups' => 'default']);
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
}
