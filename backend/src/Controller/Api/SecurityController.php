<?php

namespace App\Controller\Api;

use App\Dto\Payload\RegisterPayload;
use App\Dto\Payload\LoginPayload;
use App\Entity\User;
use App\Resolver\MediaUrlResolver;
use App\Service\TokenManager;
use App\Service\UserRegistrationService;
use App\Service\LoginAuthenticationService;
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
        private LoginAuthenticationService $loginAuthService,
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
     */
    #[Route('/login', name: 'api.login', methods: ['POST'])]
    public function login(
        #[MapRequestPayload] LoginPayload $payload
    ): JsonResponse {
        try {
            // Authenticate and check if blocked
            $user = $this->loginAuthService->authenticateAndCheckBlocked(
                $payload->email,
                $payload->password
            );

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
        } catch (\RuntimeException $e) {
            // Distinguish between invalid credentials and blocked account
            if (str_contains($e->getMessage(), 'bloqué')) {
                return $this->errorJson($e->getMessage(), 403);
            }
            // Generic error for invalid credentials
            return $this->errorJson($e->getMessage(), 401);
        }
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
            'bannerPicture' => $this->mediaUrlResolver->resolveUploadPath($user->getBannerPicture()),
            'location' => $user->getLocation(),
            'website' => $user->getWebsite(),
            'readOnly' => $user->getReadOnly(),
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

