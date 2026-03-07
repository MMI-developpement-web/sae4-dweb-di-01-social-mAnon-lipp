<?php

namespace App\Dto\Payload;

use Symfony\Component\Validator\Constraints as Assert;

class RegisterPayload
{
    #[Assert\NotBlank(message: "L'email est obligatoire")]
    #[Assert\Email(message: "L'email n'est pas valide")]
    public string $email;

    #[Assert\NotBlank(message: "Le nom d'utilisateur est obligatoire")]
    #[Assert\Length(
        min: 3,
        max: 180,
        minMessage: "Le nom d'utilisateur doit contenir au moins {{ limit }} caractères",
        maxMessage: "Le nom d'utilisateur ne peut pas dépasser {{ limit }} caractères"
    )]
    #[Assert\Regex(
        pattern: '/^[a-zA-Z0-9_-]+$/',
        message: "Le nom d'utilisateur ne peut contenir que des lettres, chiffres, tirets et underscores"
    )]
    public string $username;

    #[Assert\NotBlank(message: "Le mot de passe est obligatoire")]
    #[Assert\Length(
        min: 8,
        minMessage: "Le mot de passe doit contenir au moins {{ limit }} caractères"
    )]
    #[Assert\Regex(
        pattern: '/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/',
        message: "Le mot de passe doit contenir au moins une minuscule, une majuscule, un chiffre et un caractère spécial (@$!%*?&)"
    )]
    public string $password;
}
