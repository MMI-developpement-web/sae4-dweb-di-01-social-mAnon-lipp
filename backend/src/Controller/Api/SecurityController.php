<?php

namespace App\Controller\Api;

use App\Dto\Payload\LoginPayload;
use App\Dto\Payload\RegisterPayload;
use App\Entity\User;
use App\Repository\UserRepository;
use App\Service\TokenManager;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api', format: 'json')]
class SecurityController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private UserRepository $userRepository,
        private UserPasswordHasherInterface $passwordHasher,
        private TokenManager $tokenManager
    ) {
    }

    /**
     * Register a new user
     * POST /api/register
     */
    #[Route('/register', name: 'api.register', methods: ['POST'])]
    public function register(
        #[MapRequestPayload] RegisterPayload $payload
    ): JsonResponse {
        // Check if email already exists
        if ($this->userRepository->findOneBy(['email' => $payload->email])) {
            return $this->json([
                'error' => 'Cet email est déjà utilisé'
            ], 409);
        }

        // Check if username already exists
        if ($this->userRepository->findOneBy(['username' => $payload->username])) {
            return $this->json([
                'error' => 'Ce nom d\'utilisateur est déjà pris'
            ], 409);
        }

        // Create new user
        $user = new User();
        $user->setEmail($payload->email);
        $user->setUsername($payload->username);
        
        // Hash password
        $hashedPassword = $this->passwordHasher->hashPassword($user, $payload->password);
        $user->setPassword($hashedPassword);
        
        // Set default role
        $user->setRoles(['ROLE_USER']);

        // Persist user
        $this->entityManager->persist($user);
        $this->entityManager->flush();

        // Generate access token
        $token = $this->tokenManager->generateForUser($user);

        return $this->json([
            'message' => 'Inscription réussie',
            'token' => $token,
            'user' => [
                'id' => $user->getId(),
                'email' => $user->getEmail(),
                'username' => $user->getUsername()
            ]
        ], 201);
    }

    /**
     * Login with email and password
     * POST /api/login
     */
    #[Route('/login', name: 'api.login', methods: ['POST'])]
    public function login(
        #[MapRequestPayload] LoginPayload $payload
    ): JsonResponse {
        // Find user by email
        $user = $this->userRepository->findOneBy(['email' => $payload->email]);

        // Check if user exists and password is valid
        if (!$user || !$this->passwordHasher->isPasswordValid($user, $payload->password)) {
            return $this->json([
                'error' => 'Email ou mot de passe incorrect'
            ], 401);
        }

        // Generate access token
        $token = $this->tokenManager->generateForUser($user);

        return $this->json([
            'message' => 'Connexion réussie',
            'token' => $token,
            'user' => [
                'id' => $user->getId(),
                'email' => $user->getEmail(),
                'username' => $user->getUsername()
            ]
        ], 200);
    }
}
