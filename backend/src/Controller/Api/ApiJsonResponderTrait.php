<?php

namespace App\Controller\Api;

use Symfony\Component\HttpFoundation\JsonResponse;

trait ApiJsonResponderTrait
{
    protected function errorJson(string $message, int $status): JsonResponse
    {
        return $this->json(['error' => $message], $status);
    }
}
