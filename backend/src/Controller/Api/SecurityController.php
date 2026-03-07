<?php

namespace App\Controller\Api;

use App\Dto\Payload\RegisterPayload;
use App\Entity\User;
use App\Service\TokenManager;
use App\Service\UserRegistrationService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api', format: 'json')]
class SecurityController extends AbstractController
{
    public function __construct(
        private UserRegistrationService $registrationService,
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
        try {
            // Use service to handle business logic
            $user = $this->registrationService->register($payload);
        } catch (\RuntimeException $e) {
            return $this->json(['error' => $e->getMessage()], 409);
        }

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
     * 
     * The authentication is handled by Symfony's json_login firewall.
     * If credentials are valid, the user is injected via #[CurrentUser].
     */
    #[Route('/login', name: 'api.login', methods: ['POST'])]
    public function login(
        #[CurrentUser] ?User $user
    ): JsonResponse {
        // If we reach here without a user, authentication failed
        if (!$user) {
            return $this->json([
                'error' => 'Email ou mot de passe incorrect'
            ], 401);
        }

        // Generate access token for the authenticated user
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

