<?php

namespace App\Dto\Payload;

use Symfony\Component\Validator\Constraints as Assert;

class UpdateProfilePayload
{
    #[Assert\Length(
        min: 0,
        max: 500,
        maxMessage: 'La bio ne peut pas dépasser 500 caractères',
    )]
    public ?string $bio = null;

    #[Assert\Length(
        min: 0,
        max: 500,
        maxMessage: 'Le site web ne peut pas dépasser 500 caractères',
    )]
    #[Assert\Url(message: 'Le site web doit être une URL valide')]
    public ?string $website = null;

    #[Assert\Length(
        min: 0,
        max: 100,
        maxMessage: 'La localisation ne peut pas dépasser 100 caractères',
    )]
    public ?string $location = null;
}
