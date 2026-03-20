<?php

namespace App\Resolver;

use App\Entity\User;
use App\Repository\UserRepository;
use App\Service\BlockedAccountService;

class UserVisibilityResolver
{
    public function __construct(
        private UserRepository $userRepository,
        private BlockedAccountService $blockedAccountService,
    ) {
    }

    public function findVisibleById(int $id): ?User
    {
        $user = $this->userRepository->find($id);

        if ($user === null || $this->blockedAccountService->isUserBlocked($user)) {
            return null;
        }

        return $user;
    }
}
