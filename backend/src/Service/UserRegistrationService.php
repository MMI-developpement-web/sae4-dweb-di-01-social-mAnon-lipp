<?php

namespace App\Service;

use App\Dto\Payload\RegisterPayload;
use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class UserRegistrationService
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private UserRepository $userRepository,
        private UserPasswordHasherInterface $passwordHasher
    ) {
    }

    /**
     * Check if an email is already registered
     */
    public function isEmailTaken(string $email): bool
    {
        return $this->userRepository->findOneBy(['email' => $email]) !== null;
    }

    /**
     * Check if a username is already taken
     */
    public function isUsernameTaken(string $username): bool
    {
        return $this->userRepository->findOneBy(['username' => $username]) !== null;
    }

    /**
     * Register a new user
     * 
     * @throws \RuntimeException if email or username is already taken
     */
    public function register(RegisterPayload $payload): User
    {
        // Validate uniqueness
        if ($this->isEmailTaken($payload->email)) {
            throw new \RuntimeException('Cet email est déjà utilisé');
        }

        if ($this->isUsernameTaken($payload->username)) {
            throw new \RuntimeException('Ce nom d\'utilisateur est déjà pris');
        }

        // Create user entity
        $user = new User();
        $user->setEmail($payload->email);
        $user->setUsername($payload->username);
        
        // Hash password
        $hashedPassword = $this->passwordHasher->hashPassword($user, $payload->password);
        $user->setPassword($hashedPassword);
        
        // Set default role
        $user->setRoles(['ROLE_USER']);

        // Persist
        $this->entityManager->persist($user);
        $this->entityManager->flush();

        return $user;
    }
}
