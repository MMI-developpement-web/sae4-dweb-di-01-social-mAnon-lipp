<?php

namespace App\Entity;

use App\Repository\RetweetRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;

#[ORM\Entity(repositoryClass: RetweetRepository::class)]
class Retweet
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['default'])]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'retweets')]
    #[ORM\JoinColumn(nullable: true, onDelete: 'SET NULL')]
    #[Groups(['default'])]
    private ?Tweet $originalTweet = null;

    #[ORM\ManyToOne(inversedBy: 'retweets')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['default'])]
    private ?User $author = null;

    #[ORM\Column(length: 280, nullable: true)]
    #[Groups(['default'])]
    private ?string $content = null;

    #[ORM\Column]
    #[Groups(['default'])]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column]
    #[Groups(['default'])]
    private ?bool $isCensored = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getOriginalTweet(): ?Tweet
    {
        return $this->originalTweet;
    }

    public function setOriginalTweet(?Tweet $originalTweet): static
    {
        $this->originalTweet = $originalTweet;

        return $this;
    }

    public function getAuthor(): ?User
    {
        return $this->author;
    }

    public function setAuthor(?User $author): static
    {
        $this->author = $author;

        return $this;
    }

    public function getContent(): ?string
    {
        return $this->content;
    }

    public function setContent(?string $content): static
    {
        $this->content = $content;

        return $this;
    }

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function setCreatedAt(\DateTimeImmutable $createdAt): static
    {
        $this->createdAt = $createdAt;

        return $this;
    }

    public function isCensored(): ?bool
    {
        return $this->isCensored;
    }

    public function setIsCensored(bool $isCensored): static
    {
        $this->isCensored = $isCensored;

        return $this;
    }
}
