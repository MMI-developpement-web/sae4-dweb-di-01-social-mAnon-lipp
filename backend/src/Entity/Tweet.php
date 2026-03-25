<?php

namespace App\Entity;

use App\Repository\TweetRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;

#[ORM\Entity(repositoryClass: TweetRepository::class)]
class Tweet
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['default'])]
    private ?int $id = null;

    #[ORM\Column(length: 280)]
    #[Groups(['default'])]
    private ?string $content = null;

    #[ORM\Column]
    #[Groups(['default'])]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\ManyToOne(inversedBy: 'tweets')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['default'])]
    private ?User $author = null;

    /**
     * @var Collection<int, User>
     */
    #[ORM\ManyToMany(targetEntity: User::class, mappedBy: 'likedTweets')]
    private Collection $likedByUsers;

    #[ORM\Column(type: 'json', nullable: true)]
    #[Groups(['default'])]
    private ?array $medias = null;

    public function __construct()
    {
        $this->likedByUsers = new ArrayCollection();
    }

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

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function setCreatedAt(\DateTimeImmutable $createdAt): static
    {
        $this->createdAt = $createdAt;

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

    /**
     * @return Collection<int, User>
     */
    public function getLikedByUsers(): Collection
    {
        return $this->likedByUsers;
    }

    public function addLikedByUser(User $likedByUser): static
    {
        if (!$this->likedByUsers->contains($likedByUser)) {
            $this->likedByUsers->add($likedByUser);
            $likedByUser->addLikedTweet($this);
        }

        return $this;
    }

    public function removeLikedByUser(User $likedByUser): static
    {
        if ($this->likedByUsers->removeElement($likedByUser)) {
            $likedByUser->removeLikedTweet($this);
        }

        return $this;
    }

    public function getMedias(): ?array
    {
        return $this->medias;
    }

    public function setMedias(?array $medias): static
    {
        $this->medias = $medias;

        return $this;
    }
}
