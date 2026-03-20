<?php

namespace App\Dto\Payload;

use Symfony\Component\Validator\Constraints as Assert;

class TweetPayload
{
    #[Assert\NotBlank(message: 'Le tweet ne peut pas être vide.', normalizer: 'trim')]
    #[Assert\Length(max: 280, maxMessage: 'Le tweet ne peut pas dépasser 280 caractères.')]
    public string $content;
}
