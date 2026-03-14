<?php

namespace App\Controller\Api;

use App\Dto\Payload\RegisterPayload;
use App\Entity\User;
use App\Service\TokenManager;
use App\Service\UserRegistrationService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
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

    /**
     * Logout the current user
     * POST /api/logout
     */
    #[Route('/logout', name: 'api.logout', methods: ['POST'])]
    public function logout(
        #[CurrentUser] ?User $user,
        Request $request
    ): JsonResponse {
        // If no user is authenticated, return error
        if (!$user) {
            return $this->json([
                'error' => 'Non authentifié'
            ], 401);
        }

        // Extract the token from the Authorization header
        $authHeader = $request->headers->get('Authorization');
        if (!$authHeader || !str_starts_with($authHeader, 'Bearer ')) {
            return $this->json([
                'error' => 'Token invalide'
            ], 401);
        }

        // The token will be automatically invalidated on the client side
        // by removing it from localStorage. For security, you could also
        // invalidate it on the server by revoking it from the database.
        // For now, we just confirm the logout was successful.

        return $this->json([
            'message' => 'Déconnexion réussie'
        ], 200);
    }
}

