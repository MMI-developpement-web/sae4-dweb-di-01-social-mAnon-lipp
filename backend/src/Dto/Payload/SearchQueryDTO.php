<?php

namespace App\Dto\Payload;

use Symfony\Component\Validator\Constraints as Assert;

class SearchQueryDTO
{
    #[Assert\Length(max: 200, maxMessage: 'Search query cannot exceed 200 characters')]
    public ?string $q = null;

    #[Assert\Length(max: 180, maxMessage: 'Username cannot exceed 180 characters')]
    #[Assert\Regex(pattern: '/^[a-zA-Z0-9_-]*$/', message: 'Username can only contain alphanumeric characters, hyphens, and underscores')]
    public ?string $user = null;

    #[Assert\DateTime(format: 'Y-m-d', message: 'Start date must be in format YYYY-MM-DD')]
    public ?string $startDate = null;

    #[Assert\Positive(message: 'Page must be a positive integer')]
    #[Assert\LessThanOrEqual(value: 1000, message: 'Page cannot exceed 1000')]
    public int $page = 1;

    #[Assert\Positive(message: 'Per page must be a positive integer')]
    #[Assert\LessThanOrEqual(value: 100, message: 'Per page cannot exceed 100')]
    public int $per_page = 20;
}
