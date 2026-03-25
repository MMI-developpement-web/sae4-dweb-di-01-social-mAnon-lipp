<?php

namespace App\Service;

use App\Repository\UserRepository;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class LoginAuthenticationService
{
    public function __construct(
        private UserRepository $userRepository,
        private UserPasswordHasherInterface $passwordHasher,
    ) {
    }

    /**
     * Authenticate user with email and password and check if account is blocked
     * 
     * @throws \RuntimeException with specific error messages
     * @return \App\Entity\User The authenticated user
     */
    public function authenticateAndCheckBlocked(string $email, string $password)
    {
        // Find user by email
        $user = $this->userRepository->findOneBy(['email' => $email]);

        // Invalid credentials
        if ($user === null || !$this->passwordHasher->isPasswordValid($user, $password)) {
            throw new \RuntimeException('Email ou mot de passe incorrect');
        }

        // User exists and password is correct - check if blocked
        if ($user->isBlocked()) {
            throw new \RuntimeException('Ce compte a été bloqué pour non respect des conditions d\'utilisation');
        }

        return $user;
    }
}
