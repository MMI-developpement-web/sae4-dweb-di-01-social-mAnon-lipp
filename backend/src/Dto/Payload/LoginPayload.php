<?php

namespace App\Dto\Payload;

use Symfony\Component\Validator\Constraints as Assert;

class LoginPayload
{
    #[Assert\NotBlank(message: "L'email est obligatoire")]
    #[Assert\Email(message: "L'email n'est pas valide")]
    public string $email;

    #[Assert\NotBlank(message: "Le mot de passe est obligatoire")]
    public string $password;
}
