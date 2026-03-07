<?php

namespace App\Security;

use App\Repository\TokenRepository;
use Symfony\Component\Security\Core\Exception\BadCredentialsException;
use Symfony\Component\Security\Http\AccessToken\AccessTokenHandlerInterface;
use Symfony\Component\Security\Http\Authenticator\Passport\Badge\UserBadge;

class AccessTokenHandler implements AccessTokenHandlerInterface
{
    public function __construct(
        private TokenRepository $tokenRepository
    ) {
    }

    public function getUserBadgeFrom(string $accessToken): UserBadge
    {
        // Hash the incoming token
        $hashedToken = hash('sha256', $accessToken);
        
        // Find token in database using dedicated repository method
        $token = $this->tokenRepository->findOneByValue($hashedToken);
        
        // Validate token existence and expiration
        if ($token === null || !$token->isValid()) {
            throw new BadCredentialsException('Invalid or expired token');
        }
        
        // Return UserBadge with the user's email (identifier)
        return new UserBadge($token->getUser()->getUserIdentifier());
    }
}
