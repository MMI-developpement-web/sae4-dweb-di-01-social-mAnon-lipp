<?php

namespace App\Entity;

use App\Repository\ReplyRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;

#[ORM\Entity(repositoryClass: ReplyRepository::class)]
class Reply
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['default'])]
    private ?int $id = null;

    #[ORM\Column(length: 280)]
    #[Groups(['default'])]
    private ?string $content = null;

    #[ORM\ManyToOne(inversedBy: 'replies')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['default'])]
    private ?User $author = null;

    #[ORM\ManyToOne(inversedBy: 'replies')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Tweet $tweet = null;

    #[ORM\Column]
    #[Groups(['default'])]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column]
    private ?bool $isCensored = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getContent(): ?string
    {
        return $this->content;
    }

    public function setContent(string $content): static
    {
        $this->content = $content;

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

    public function getTweet(): ?Tweet
    {
        return $this->tweet;
    }

    public function setTweet(?Tweet $tweet): static
    {
        $this->tweet = $tweet;

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
