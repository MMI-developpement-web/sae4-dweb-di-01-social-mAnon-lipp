<?php

namespace App\Controller\Api;

use App\Dto\Payload\RegisterPayload;
use App\Entity\User;
use App\Resolver\MediaUrlResolver;
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
    use ApiJsonResponderTrait;

    public function __construct(
        private UserRegistrationService $registrationService,
        private TokenManager $tokenManager,
        private MediaUrlResolver $mediaUrlResolver,
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
            return $this->errorJson($e->getMessage(), 409);
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
            return $this->errorJson('Email ou mot de passe incorrect', 401);
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
            return $this->errorJson('Non authentifié', 401);
        }

        $rawToken = $this->extractBearerToken($request->headers->get('Authorization'));
        if ($rawToken === null) {
            return $this->errorJson('Token invalide', 401);
        }

        $token = $this->tokenManager->findValidToken($rawToken);
        if ($token === null) {
            return $this->errorJson('Token invalide', 401);
        }

        $this->tokenManager->revokeToken($token);

        return $this->json([
            'message' => 'Déconnexion réussie'
        ], 200);
    }

    /**
     * Get current user profile
     * GET /api/me
     */
    #[Route('/me', name: 'api.me', methods: ['GET'])]
    #[\Symfony\Component\Security\Http\Attribute\IsGranted('ROLE_USER')]
    public function me(
        #[CurrentUser] ?User $user
    ): JsonResponse {
        if (!$user) {
            return $this->errorJson('Non authentifié', 401);
        }

        return $this->json([
            'id' => $user->getId(),
            'username' => $user->getUsername(),
            'email' => $user->getEmail(),
            'bio' => $user->getBio(),
            'profilePicture' => $this->mediaUrlResolver->resolveUploadPath($user->getProfilePicture()),
            'banner' => $this->mediaUrlResolver->resolveUploadPath($user->getBannerPicture()),
            'location' => $user->getLocation(),
            'website' => $user->getWebsite(),
        ], 200, [], ['groups' => 'default']);
    }

    private function extractBearerToken(?string $authHeader): ?string
    {
        if ($authHeader === null || !str_starts_with($authHeader, 'Bearer ')) {
            return null;
        }

        $token = trim(substr($authHeader, 7));

        return $token !== '' ? $token : null;
    }
}

