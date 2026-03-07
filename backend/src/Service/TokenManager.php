<?php

namespace App\Service;

use App\Entity\Token;
use App\Entity\User;
use App\Repository\TokenRepository;
use Doctrine\ORM\EntityManagerInterface;

class TokenManager
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private TokenRepository $tokenRepository
    ) {
    }

    /**
     * Generate a new access token for a user
     * Returns the raw (unhashed) token - this is the only time it can be retrieved
     */
    public function generateForUser(User $user): string
    {
        // Generate a random token (64 characters)
        $rawToken = bin2hex(random_bytes(32));
        
        // Hash the token before storing (SHA-256)
        $hashedToken = hash('sha256', $rawToken);
        
        // Create token entity
        $token = new Token();
        $token->setValue($hashedToken);
        $token->setUser($user);
        $token->setCreatedAt(new \DateTimeImmutable());
        // Token expires in 30 days
        $token->setExpiresAt(new \DateTimeImmutable('+30 days'));
        
        $this->entityManager->persist($token);
        $this->entityManager->flush();
        
        // Return the raw token (client will use this)
        return $rawToken;
    }

    /**
     * Find a valid token by its raw value
     */
    public function findValidToken(string $rawToken): ?Token
    {
        $hashedToken = hash('sha256', $rawToken);
        $token = $this->tokenRepository->findOneBy(['value' => $hashedToken]);
        
        if ($token === null || !$token->isValid()) {
            return null;
        }
        
        return $token;
    }

    /**
     * Delete expired tokens (can be run via cron job)
     */
    public function deleteExpiredTokens(): int
    {
        $qb = $this->entityManager->createQueryBuilder();
        $qb->delete(Token::class, 't')
            ->where('t.expiresAt < :now')
            ->setParameter('now', new \DateTimeImmutable());
        
        return $qb->getQuery()->execute();
    }
}
