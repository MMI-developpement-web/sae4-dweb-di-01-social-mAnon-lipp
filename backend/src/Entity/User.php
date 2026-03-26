<?php

namespace App\Entity;

use App\Repository\UserRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Serializer\Attribute\Groups;

#[ORM\Entity(repositoryClass: UserRepository::class)]
#[ORM\Table(name: '`user`')]
#[ORM\UniqueConstraint(name: 'UNIQ_IDENTIFIER_EMAIL', fields: ['email'])]
class User implements UserInterface, PasswordAuthenticatedUserInterface
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['default'])]
    private ?int $id = null;

    #[ORM\Column(length: 180)]
    private ?string $email = null;

    /**
     * @var list<string> The user roles
     */
    #[ORM\Column]
    private array $roles = [];

    /**
     * @var string The hashed password
     */
    #[ORM\Column]
    private ?string $password = null;

    #[ORM\Column(length: 180)]
    #[Groups(['default'])]
    private ?string $username = null;

    /**
     * @var Collection<int, Token>
     */
    #[ORM\OneToMany(targetEntity: Token::class, mappedBy: 'user')]
    private Collection $tokens;

    /**
     * @var Collection<int, Tweet>
     */
    #[ORM\OneToMany(targetEntity: Tweet::class, mappedBy: 'author')]
    private Collection $tweets;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $bio = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['default'])]
    private ?string $profilePicture = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $bannerPicture = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $location = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $website = null;

    #[ORM\Column(nullable: false)]
    private bool $isBlocked = false;

    /**
     * @var Collection<int, self>
     */
    #[ORM\ManyToMany(targetEntity: self::class, inversedBy: 'followersUsers')]
    private Collection $followingUsers;

    /**
     * @var Collection<int, self>
     */
    #[ORM\ManyToMany(targetEntity: self::class, mappedBy: 'followingUsers')]
    private Collection $followersUsers;

    /**
     * @var Collection<int, Tweet>
     */
    #[ORM\ManyToMany(targetEntity: Tweet::class, inversedBy: 'likedByUsers')]
    private Collection $likedTweets;

    /**
     * @var Collection<int, Reply>
     */
    #[ORM\OneToMany(targetEntity: Reply::class, mappedBy: 'author')]
    private Collection $replies;

    /**
     * @var Collection<int, self>
     */
    #[ORM\ManyToMany(targetEntity: self::class, inversedBy: 'blockedByUsers')]
    #[ORM\JoinTable(name: 'user_blocked_users')]
    private Collection $blockedUsers;

    /**
     * @var Collection<int, self>
     */
    #[ORM\ManyToMany(targetEntity: self::class, mappedBy: 'blockedUsers')]
    private Collection $blockedByUsers;

    #[ORM\Column]
    #[Groups(['default'])]
    private bool $readOnly = false;

    public function __construct()
    {
        $this->tokens = new ArrayCollection();
        $this->tweets = new ArrayCollection();
        $this->isBlocked = false;
        $this->readOnly = false;
        $this->followingUsers = new ArrayCollection();
        $this->followersUsers = new ArrayCollection();
        $this->likedTweets = new ArrayCollection();
        $this->replies = new ArrayCollection();
        $this->blockedUsers = new ArrayCollection();
        $this->blockedByUsers = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getEmail(): ?string
    {
        return $this->email;
    }

    public function setEmail(string $email): static
    {
        $this->email = $email;

        return $this;
    }

    /**
     * A visual identifier that represents this user.
     *
     * @see UserInterface
     */
    public function getUserIdentifier(): string
    {
        return (string) $this->email;
    }

    /**
     * @see UserInterface
     */
    public function getRoles(): array
    {
        $roles = $this->roles;
        // guarantee every user at least has ROLE_USER
        $roles[] = 'ROLE_USER';

        return array_unique($roles);
    }

    /**
     * @param list<string> $roles
     */
    public function setRoles(array $roles): static
    {
        $this->roles = $roles;

        return $this;
    }

    /**
     * @see PasswordAuthenticatedUserInterface
     */
    public function getPassword(): ?string
    {
        return $this->password;
    }

    public function setPassword(string $password): static
    {
        $this->password = $password;

        return $this;
    }

    /**
     * Ensure the session doesn't contain actual password hashes by CRC32C-hashing them, as supported since Symfony 7.3.
     */
    public function __serialize(): array
    {
        $data = (array) $this;
        $data["\0".self::class."\0password"] = hash('crc32c', $this->password);

        return $data;
    }

    #[\Deprecated]
    public function eraseCredentials(): void
    {
        // @deprecated, to be removed when upgrading to Symfony 8
    }

    public function getUsername(): ?string
    {
        return $this->username;
    }

    public function setUsername(string $username): static
    {
        $this->username = $username;

        return $this;
    }

    /**
     * @return Collection<int, Token>
     */
    public function getTokens(): Collection
    {
        return $this->tokens;
    }

    public function addToken(Token $token): static
    {
        if (!$this->tokens->contains($token)) {
            $this->tokens->add($token);
            $token->setUser($this);
        }

        return $this;
    }

    public function removeToken(Token $token): static
    {
        if ($this->tokens->removeElement($token)) {
            // set the owning side to null (unless already changed)
            if ($token->getUser() === $this) {
                $token->setUser(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, Tweet>
     */
    public function getTweets(): Collection
    {
        return $this->tweets;
    }

    public function addTweet(Tweet $tweet): static
    {
        if (!$this->tweets->contains($tweet)) {
            $this->tweets->add($tweet);
            $tweet->setAuthor($this);
        }

        return $this;
    }

    public function removeTweet(Tweet $tweet): static
    {
        if ($this->tweets->removeElement($tweet)) {
            // set the owning side to null (unless already changed)
            if ($tweet->getAuthor() === $this) {
                $tweet->setAuthor(null);
            }
        }

        return $this;
    }

    public function getBio(): ?string
    {
        return $this->bio;
    }

    public function setBio(?string $bio): static
    {
        $this->bio = $bio;

        return $this;
    }

    public function getProfilePicture(): ?string
    {
        return $this->profilePicture;
    }

    public function setProfilePicture(?string $profilePicture): static
    {
        $this->profilePicture = $profilePicture;

        return $this;
    }

    public function getBannerPicture(): ?string
    {
        return $this->bannerPicture;
    }

    public function setBannerPicture(?string $bannerPicture): static
    {
        $this->bannerPicture = $bannerPicture;

        return $this;
    }

    public function getProfilePictureUrl(): ?string
    {
        return $this->profilePicture ? '/uploads/' . $this->profilePicture : null;
    }

    public function getBannerPictureUrl(): ?string
    {
        return $this->bannerPicture ? '/uploads/' . $this->bannerPicture : null;
    }

    public function getLocation(): ?string
    {
        return $this->location;
    }

    public function setLocation(?string $location): static
    {
        $this->location = $location;

        return $this;
    }

    public function getWebsite(): ?string
    {
        return $this->website;
    }

    public function setWebsite(?string $website): static
    {
        $this->website = $website;

        return $this;
    }

    public function isBlocked(): bool
    {
        return $this->isBlocked;
    }

    public function setIsBlocked(bool $isBlocked): static
    {
        $this->isBlocked = $isBlocked;

        return $this;
    }

    /**
     * @return Collection<int, self>
     */
    public function getFollowingUsers(): Collection
    {
        return $this->followingUsers;
    }

    public function addFollowingUser(self $followingUser): static
    {
        if (!$this->followingUsers->contains($followingUser)) {
            $this->followingUsers->add($followingUser);
        }

        return $this;
    }

    public function removeFollowingUser(self $followingUser): static
    {
        $this->followingUsers->removeElement($followingUser);

        return $this;
    }

    /**
     * @return Collection<int, self>
     */
    public function getFollowersUsers(): Collection
    {
        return $this->followersUsers;
    }

    public function addFollowersUser(self $followersUser): static
    {
        if (!$this->followersUsers->contains($followersUser)) {
            $this->followersUsers->add($followersUser);
            $followersUser->addFollowingUser($this);
        }

        return $this;
    }

    public function removeFollowersUser(self $followersUser): static
    {
        if ($this->followersUsers->removeElement($followersUser)) {
            $followersUser->removeFollowingUser($this);
        }

        return $this;
    }

    /**
     * @return Collection<int, Tweet>
     */
    public function getLikedTweets(): Collection
    {
        return $this->likedTweets;
    }

    public function addLikedTweet(Tweet $likedTweet): static
    {
        if (!$this->likedTweets->contains($likedTweet)) {
            $this->likedTweets->add($likedTweet);
        }

        return $this;
    }

    public function removeLikedTweet(Tweet $likedTweet): static
    {
        $this->likedTweets->removeElement($likedTweet);

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
            $reply->setAuthor($this);
        }

        return $this;
    }

    public function removeReply(Reply $reply): static
    {
        if ($this->replies->removeElement($reply)) {
            // set the owning side to null (unless already changed)
            if ($reply->getAuthor() === $this) {
                $reply->setAuthor(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, self>
     */
    public function getBlockedUsers(): Collection
    {
        return $this->blockedUsers;
    }

    public function addBlockedUser(self $blockedUser): static
    {
        if (!$this->blockedUsers->contains($blockedUser)) {
            $this->blockedUsers->add($blockedUser);
        }

        return $this;
    }

    public function removeBlockedUser(self $blockedUser): static
    {
        $this->blockedUsers->removeElement($blockedUser);

        return $this;
    }

    /**
     * @return Collection<int, self>
     */
    public function getBlockedByUsers(): Collection
    {
        return $this->blockedByUsers;
    }

    public function addBlockedByUser(self $blockedByUser): static
    {
        if (!$this->blockedByUsers->contains($blockedByUser)) {
            $this->blockedByUsers->add($blockedByUser);
            $blockedByUser->addBlockedUser($this);
        }

        return $this;
    }

    public function removeBlockedByUser(self $blockedByUser): static
    {
        if ($this->blockedByUsers->removeElement($blockedByUser)) {
            $blockedByUser->removeBlockedUser($this);
        }

        return $this;
    }

    public function getReadOnly(): bool
    {
        return $this->readOnly;
    }

    public function setReadOnly(bool $readOnly): static
    {
        $this->readOnly = $readOnly;

        return $this;
    }
}
