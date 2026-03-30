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

    #[ORM\Column(nullable: true)]
    #[Groups(['default'])]
    private ?\DateTimeImmutable $updatedAt = null;

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

    /**
     * @var Collection<int, Reply>
     */
    #[ORM\OneToMany(targetEntity: Reply::class, mappedBy: 'tweet', cascade: ['remove'])]
    #[Groups(['default'])]
    private Collection $replies;

    #[ORM\Column]
    private ?bool $isCensored = null;

    #[ORM\Column]
    #[Groups(['default'])]
    private bool $isPinned = false;

    public function __construct()
    {
        $this->likedByUsers = new ArrayCollection();
        $this->replies = new ArrayCollection();
        $this->medias = [];
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

    public function getUpdatedAt(): ?\DateTimeImmutable
    {
        return $this->updatedAt;
    }

    public function setUpdatedAt(?\DateTimeImmutable $updatedAt): static
    {
        $this->updatedAt = $updatedAt;

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

    /**
     * @return Collection<int, Reply>
     */
    public function getReplies(): Collection
    {
        return $this->replies;
    }

    public function addReply(Reply $reply): static
    {
        if (!$this->replies->contains($reply)) {
            $this->replies->add($reply);
            $reply->setTweet($this);
        }

        return $this;
    }

    public function removeReply(Reply $reply): static
    {
        if ($this->replies->removeElement($reply)) {
            // set the owning side to null (unless already changed)
            if ($reply->getTweet() === $this) {
                $reply->setTweet(null);
            }
        }

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

    public function isPinned(): bool
    {
        return $this->isPinned;
    }

    public function setIsPinned(bool $isPinned): static
    {
        $this->isPinned = $isPinned;

        return $this;
    }
}
