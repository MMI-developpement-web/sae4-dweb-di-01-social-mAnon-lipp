<?php

namespace App\Dto\Payload;

use Symfony\Component\Validator\Constraints as Assert;

class CreateReplyPayload
{
    #[Assert\NotBlank(message: 'Content cannot be empty')]
    #[Assert\Length(min: 1, max: 280, minMessage: 'Content must be at least 1 character', maxMessage: 'Content cannot exceed 280 characters')]
    public string $content = '';

    #[Assert\Positive]
    public int $tweetId = 0;
}
