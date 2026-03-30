<?php

namespace App\Dto\Payload;

use Symfony\Component\Validator\Constraints as Assert;

class RetweetPayload
{
    #[Assert\Length(max: 280, maxMessage: 'Le commentaire du retweet ne peut pas dépasser 280 caractères.')]
    public ?string $content = null;
}
