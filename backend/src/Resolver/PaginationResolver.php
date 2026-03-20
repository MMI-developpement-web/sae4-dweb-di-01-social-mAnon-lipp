<?php

namespace App\Resolver;

use Symfony\Component\HttpFoundation\Request;

class PaginationResolver
{
    /**
     * @return array{page: int, perPage: int, offset: int}
     */
    public function fromRequest(Request $request, int $defaultPerPage = 20, int $maxPerPage = 50): array
    {
        $page = max(1, (int) $request->query->get('page', 1));
        $perPage = min($maxPerPage, max(1, (int) $request->query->get('per_page', $defaultPerPage)));

        return [
            'page' => $page,
            'perPage' => $perPage,
            'offset' => ($page - 1) * $perPage,
        ];
    }
}
