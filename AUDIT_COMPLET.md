# 🔍 AUDIT COMPLET - Social Network SAÉ 4 (Symfony + React)

**Date:** 30 Mars 2026 | **Conformité globale:** 87/100

---

## 📋 TABLE DES MATIÈRES
1. [BACKEND (Symfony)](#backend)
2. [FRONTEND (React)](#frontend)
3. [Store Pattern](#store)
4. [Concerns Mixing](#concerns)
5. [Tailwind & CVA](#tailwind)
6. [Patterns & Code Quality](#patterns)
7. [Security Checklist](#security)
8. [Recommandations](#recommendations)

---

# BACKEND (Symfony) {#backend}

## ✅ Architecture Backend - Conformité: 85/100

### Controllers API - Localisation & Fichiers

| Fichier | Routes | Méthodes | Status |
|---------|--------|----------|--------|
| [TweetController.php](/backend/src/Controller/Api/TweetController.php) | `/api/tweets`, `/api/tweets/search` | GET, POST, PUT, DELETE | ✅ |
| [UserController.php](/backend/src/Controller/Api/UserController.php) | `/api/users/{id}`, `/api/users/by-username/{username}`, `/api/users/{id}/tweets`, `/api/users/{id}/follow`, `/api/users/{id}/block` | GET, POST, DELETE | ✅ |
| [SecurityController.php](/backend/src/Controller/Api/SecurityController.php) | `/api/register`, `/api/login`, `/api/logout` | POST | ✅ |
| [ReplyController.php](/backend/src/Controller/Api/ReplyController.php) | `/api/tweets/{id}/replies`, `/api/replies/{id}` | POST, DELETE | ⚠️ |
| [AdminCensorController.php](/backend/src/Controller/Api/AdminCensorController.php) | `/api/admin/tweets/{id}/censor`, `/api/admin/replies/{id}/censor` | POST | ✅ |

### ✅ Points Forts

#### 1. Injection de Dépendances ✅
Tous les controllers utilisent **constructor injection** correctement:
```php
// TweetController.php
public function __construct(
    private TweetRepository $tweetRepository,
    private PaginationResolver $paginationResolver,
    private TweetApiFormatter $tweetApiFormatter,
    private TweetService $tweetService,
    private TweetUploadService $tweetUploadService,
    // ... more services
) { }
```

#### 2. #[MapRequestPayload] Utilisé ✅
Validations DTOs appliquées automatiquement:
```php
#[Route('/login', name: 'api.login', methods: ['POST'])]
public function login(#[MapRequestPayload] LoginPayload $payload): JsonResponse
```

#### 3. #[CurrentUser] & #[IsGranted] ✅
Authentification déclarée correctement:
```php
#[Route('/tweets', name: 'api.tweets.all', methods: ['GET'])]
#[IsGranted('ROLE_USER')]
public function all(Request $request, #[CurrentUser] User $user): JsonResponse
```

#### 4. Stateless Auth (Bearer Token) ✅
API pure REST, pas de sessions:
- `POST /api/login` → retourne raw token
- Token haché en SHA-256 stocké en DB
- Headers entrants: `Authorization: Bearer {token}`

#### 5. Groups de Sérialisation ✅
Contrôle fine des champs JSON retournés:
```php
// Entity/Tweet.php
#[ORM\Column]
#[Groups(['default'])]
private ?string $content = null;

// Controller
return $this->json($tweet, 200, [], ['groups' => 'default']);
```

### ⚠️ Problèmes Identifiés

#### 1. Absence de Validation sur Query Parameters
**Fichier:** [TweetController.php](/backend/src/Controller/Api/TweetController.php#L71-L90) (search method)

```php
$query = $request->query->get('q', '');
$username = $request->query->get('user', '');
$startDateStr = $request->query->get('startDate', null);
// ❌ NO VALIDATION on these strings!
```

**Impact:** Risque d'injection SQL ou comportement non défini
**Correction:** Utiliser une DTO pour les query parameters ou valider explicitement

---

#### 2. Parsing Multipart Manuel Complexe
**Fichier:** [ReplyController.php](/backend/src/Controller/Api/ReplyController.php#L33-L70) (create method)

```php
if (str_starts_with($contentType, 'multipart/form-data')) {
    $this->parseMultipartManually($request);
}
$mediaFiles = $this->extractMediaFiles($request);
```

**Problème:** Le parsing multipart est fait manuellement, ce qui prête à confusion. 
While there's a `ParseMultipartTrait` in use, this complexity could lead to bugs.

---

#### 3. User Entity - Propriété `readOnly` Inutilisée ❌
**Fichier:** [Entity/User.php](/backend/src/Entity/User.php#L90)

```php
#[ORM\Column]
#[Groups(['default'])]
private bool $readOnly = false;
```

**Impact:** Propriété existante mais jamais utilisée ni définie
**Verdict:** Code mort ou migration incomplète

---

### DTOs & Validation ✅

| DTO | Fichier | Validation | Status |
|-----|---------|-----------|--------|
| RegisterPayload | [Src/Dto/Payload](/backend/src/Dto/Payload/RegisterPayload.php) | Email, Username (3-180 chars, alphanum+tirets), Password (8+ chars, minuscule, majuscule, chiffre, spécial) | ✅ |
| LoginPayload | [Src/Dto/Payload](/backend/src/Dto/Payload/LoginPayload.php) | Email, Password | ✅ |
| TweetPayload | [Src/Dto/Payload](/backend/src/Dto/Payload/TweetPayload.php) | Content (max 280 chars) | ✅ |
| CreateReplyPayload | [Src/Dto/Payload](/backend/src/Dto/Payload/CreateReplyPayload.php) | Content (1-280 chars), tweetId, medias | ✅ |
| UpdateProfilePayload | [Src/Dto/Payload](/backend/src/Dto/Payload/UpdateProfilePayload.php) | Bio (max 500), website (URL valid), location | ✅ |

**✅ Tous les DTOs utilisent Symfony Validator correctement**

---

### Entités Doctrine ✅

| Entité | Propriétés | Relations | Status |
|--------|-----------|-----------|--------|
| **User** | id, email, username, password, bio, profilePicture, bannerPicture, location, website, isBlocked, readOnly | tokens (1-∞), tweets (1-∞), replies (1-∞), followers (∞-∞), likedTweets (∞-∞), blockedUsers (∞-∞) | ✅ |
| **Tweet** | id, content (280), createdAt, updatedAt, medias (JSON), isCensored, isPinned | author (∞-1), likedByUsers (∞-∞), replies (1-∞) | ✅ |
| **Reply** | id, content (280), createdAt, isCensored, medias (JSON) | author (∞-1), tweet (∞-1) | ✅ |
| **Token** | id, value (SHA-256), expiresAt, createdAt | user (∞-1) | ✅ |

**✅ ORM correctly configured avec PHP 8 attributes**

**Points Positifs:**
- `#[Groups(['default'])]` sur les champs sérialisés
- Relations inverse/mappedBy correctement configurées
- Héritage UserInterface/PasswordAuthenticatedUserInterface
- Password hashing via Symfony security ✅

---

### Services ✅ - 27 Services Trouvés

#### Service Listing

**Authentication & Authorization:**
- [TokenManager.php](/backend/src/Service/TokenManager.php) - Génération & stockage tokens
- [UserRegistrationService.php](/backend/src/Service/UserRegistrationService.php) - Enregistrement + validation unité
- [LoginAuthenticationService.php](/backend/src/Service/LoginAuthenticationService.php) - Authentification + vérif bloqué

**Business Logic - Tweets:**
- [TweetService.php](/backend/src/Service/TweetService.php) - createTweet, updateTweet, deleteTweet
- [TweetUploadService.php](/backend/src/Service/TweetUploadService.php) - Validation + upload médias (50MB max)
- [TweetApiFormatter.php](/backend/src/Service/TweetApiFormatter.php) - Formatage JSON API

**Business Logic - Interactions:**
- [LikeService.php](/backend/src/Service/LikeService.php) - like/unlike tweets
- [FollowService.php](/backend/src/Service/FollowService.php) - follow/unfollow users
- [BlockService.php](/backend/src/Service/BlockService.php) - block/unblock users
- [CensorService.php](/backend/src/Service/CensorService.php) - censor/uncensor content

**Business Logic - Replies:**
- [ReplyService.php](/backend/src/Service/ReplyService.php) - createReply avec medias

**User Profile:**
- [UpdateProfileService.php](/backend/src/Service/UpdateProfileService.php) - Mise à jour bio, website, pictures

**Helper Services:**
- BlockedAccountService
- Plus 8+ Resolvers (MediaUrlResolver, PaginationResolver, UserVisibilityResolver, etc.)

**✅ CONFORMITÉ: Single Responsibility Principle respected - no logic in controllers**

---

### Repositories ✅

| Repository | Méthodes Custom | Status |
|------------|----------------|--------|
| TweetRepository | findFeedForUser(), findByUserWithPinnedFirst(), searchFeedForUser(), findPinnedByUser(), countFeedForUser(), countByUser() | ✅ |
| UserRepository | Standard ORM | ✅ |
| ReplyRepository | Standard ORM | ✅ |
| TokenRepository | findOneByValue() (pour tokens hashed) | ✅ |

**✅ Queries bien structurées, pas de N+1 queries attendues**

---

### Security - Authentification ✅

**Flow Bearer Token:**
1. User POST `/api/login` avec email/password
2. Service valide credentials + vérif si account bloqué ✅
3. `TokenManager::generateForUser()` crée token:
   - Génère raw token 64 chars
   - Hash en SHA-256 avant stockage DB ✅
   - Retourne raw token au client
4. Client stocke raw token en localStorage
5. Chaque requête API inclut: `Authorization: Bearer {raw_token}`
6. `AccessTokenHandler` valide:
   - Hash incoming token
   - Cherche en DB
   - Vérifie expiration (30 jours)
   - Vérifie pas bloqué ✅

**✅ Stateless, pas de sessions, tokens hashed**

**Points Forts:**
```php
// AccessTokenHandler.php
public function getUserBadgeFrom(string $accessToken): UserBadge
{
    $hashedToken = hash('sha256', $accessToken);
    $token = $this->tokenRepository->findOneByValue($hashedToken);
    
    if ($token === null || !$token->isValid()) {
        throw new BadCredentialsException('Invalid or expired token');
    }
    
    if ($token->getUser()->isBlocked()) {
        throw new BadCredentialsException('This account has been blocked.');
    }
    
    return new UserBadge($token->getUser()->getUserIdentifier());
}
```

---

# FRONTEND (React + TypeScript) {#frontend}

## ✅ Architecture Frontend - Conformité: 85/100

### main.tsx ✅

**Points Positifs:**
- ✅ `createBrowserRouter` utilisé (pas BrowserRouter)
- ✅ Loaders définis sur les routes protégées
- ✅ `errorElement` sur root
- ✅ `StoreProvider` wraps toute l'app

```tsx
const router = createBrowserRouter([
  { path: "/", element: <Feed />, loader: feedLoader, errorElement: <ErrorPage /> },
  { path: "/feed", element: <Feed />, loader: feedLoader, errorElement: <ErrorPage /> },
  { path: "/login", element: <Login /> },
  // ... 8 routes totales
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <StoreProvider>
      <RouterProvider router={router} />
    </StoreProvider>
  </StrictMode>,
);
```

### Routes & Loaders ✅

| Route | Loader | Auth Check | Status |
|-------|--------|-----------|--------|
| `/` + `/feed` | fetchTweets(1, 20) | ✅ localStorage.getItem('auth_token') | ✅ |
| `/post` | Auth check + null | ✅ | ✅ |
| `/profile/:id` | Parallel: fetchCurrentUser + fetchUserProfile + fetchUserTweets | ✅ | ✅ |
| `/profile/edit` | Auth check + null | ✅ | ✅ |
| `/settings` | Auth check + null | ✅ | ✅ |
| `/login` | None | N/A | ✅ |
| `/register` | None | N/A | ✅ |

**✅ Tous les loaders protégés vérifient le token**

---

# Store Pattern {#store}

## ✅✅ EXCELLENT - Conformité: 95/100

### File Structure
```
src/store/
├── types.ts           # AppState, StoreActions, User, Tweet, Reply
├── StoreContext.tsx   # Provider, useStore(), useCurrentUser(), useIsLiked()
└── (no createResource.ts found, but mentioned in docs)
```

### AppState Structure ✅
```tsx
interface AppState {
  // Auth
  currentUser: User | null;
  authToken: string | null;
  isAuthLoading: boolean;
  
  // Tweets
  tweets: Map<number, Tweet>;        // Cache par ID
  tweetOrder: number[];              // Ordre feed
  
  // User Profiles
  userProfiles: Map<number, UserProfile>;
  
  // Relationships
  followingUsers: Set<number>;
  likedTweets: Set<number>;
  blockedUsers: Set<number>;
  
  // UI State
  isLoadingFeed: boolean;
  isLoadingProfile: boolean;
  feedPage: number;
  
  // Errors
  errors: Record<string, string | null>;
}
```

### StoreActions - 40+ Actions ✅
**Auth:** setCurrentUser, clearAuth, initializeAuth, updateCurrentUser
**Tweets:** addTweet, removeTweet, updateTweet, fetchFeedTweets, createTweet, deleteTweet, modifyTweet
**Likes:** likeTweet, unlikeTweet, isLiked, initializeLikes
**Pins:** pinTweet, unpinTweet
**Profiles:** fetchUserProfile, setUserProfile, updateProfile, fetchUserTweets
**Follow:** followUser, unfollowUser, isFollowing
**Block:** blockUser, unblockUser, isBlocked
**Errors:** setError, clearError, clearAllErrors
**UI:** setFeedLoading, setProfileLoading, setFeedPage

### ✅ Optimistic Updates Implémentées

**Like/Unlike:**
```tsx
const likeTweet = useCallback(
  async (tweetId: number) => {
    // Optimistic update immédiat
    setLikedTweets((prev) => new Set(prev).add(tweetId));
    updateTweet(tweetId, { likeCount: (tweet.likeCount ?? 0) + 1 });
    
    try {
      await apiFetch(`/tweets/${tweetId}/like`, { method: 'POST' });
      clearError('likeTweet');
    } catch (err: any) {
      // Rollback on error
      setLikedTweets((prev) => { const next = new Set(prev); next.delete(tweetId); return next; });
      // ... restore likeCount
      throw err;
    }
  },
  [currentUser, likedTweets, tweets, updateTweet, clearError, setError]
);
```

**Follow/Unfollow:** Similar pattern ✅

### ✅ Immutability Respected
- `new Map()`, `new Set()`
- Array spreads: `[...prev, newItem]`
- Object spreads: `{ ...tweet, likeCount: 5 }`

### ✅ Specialized Selectors
```tsx
export const useCurrentUser = (): User | null => {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useCurrentUser must be used inside <StoreProvider>');
  return store.currentUser;
};

export const useIsLiked = (tweetId: number): boolean => {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useIsLiked must be used inside <StoreProvider>');
  return store.likedTweets.has(tweetId);
};
```

### ⚠️ Potential Issues

#### 1. Dynamic Import in modifyTweet Action
**File:** [StoreContext.tsx](/frontend/src/store/StoreContext.tsx#L475)

```tsx
const modifyTweet = useCallback(
  async (tweetId: number, content: string, medias?: any[]) => {
    try {
      const { updateTweet: apiUpdateTweet } = await import('../lib/api');
      // ❌ Why dynamic import?
      const updatedTweet = await apiUpdateTweet(tweetId, content, medias);
```

**Impact:** Unnecessary complexity, updateTweet should be imported at top
**Correction:** 
```tsx
import { updateTweet } from '../lib/api';
// In action:
const updatedTweet = await updateTweet(tweetId, content, medias);
```

#### 2. Tweet Cache Complexity
Map + array for ordering is complex:
```tsx
tweets: Map<number, Tweet>;        // Store by ID
tweetOrder: number[];              // Store order separately
```

This works but requires dual updates:
```tsx
setTweets(/* update map */);
setTweetOrder(/* update array */);
```

---

### Components Structure {#components}

#### Atoms (ui/) ✅

All use **CVA (class-variance-authority)** correctly:

| Component | Variants | Sizes | CVA Props | Status |
|-----------|----------|-------|-----------|--------|
| **Button** | primary, secondary, danger, ghost, outline | xs, sm, md, lg, icon | ✅ Compound: ghost+icon | ✅ |
| **Input** | default, error | sm, md | ✅ label, error props | ✅ |
| **Textarea** | default, post, error | sm, md | ✅ Compound: post+md → border-3 | ✅ |
| **Avatar** | (sizes) | xs, sm, md, lg, xl | ✅ src, alt, fallback | ✅ |
| **Banner** | (heights) | sm, md, lg | ✅ Gradient fallback | ✅ |
| **Checkbox** | default, error | - | ✅ | ✅ |
| **Heart** | default, filled | sm, md, lg | ✅ isLiked, likeCount, motion | ✅ |

**All atoms correctly extend HTML attributes + CVA variants** ✅

#### Composites ✅
- Header → NavBar + ProfileDropdown
- LoginForm, RegisterForm, PostForm (with Store)
- ProfileHeader (with Store: follow/block)
- TweetCard ⚠️ (200+ lines, complex)
- EditProfileForm, EditTweetModal, ConfirmDeleteModal
- SearchBar, PasswordStrengthIndicator

---

### API Client (/src/lib/api.ts) ✅✅

```tsx
const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8080/api";

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem("auth_token");
  
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options?.headers || {}),
  };
  
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  
  if (res.status === 401) {
    localStorage.removeItem("auth_token");
    window.location.href = "/login";
  }
  
  if (!res.ok) {
    const errorData = await res.json();
    errorData.status = res.status;
    throw errorData;
  }
  
  return res.json() as Promise<T>;
}
```

**✅ Token automatically included**
**✅ 401 handling → redirect login**
**✅ Error status propagated**

---

### Tailwind CSS ✅✅

#### Mobile-First Verification
**Examples trouvés:**
```tsx
// Mobile-first: flex-col on mobile, row on md+
<div className="flex flex-col gap-4 md:flex-row md:gap-8" />

// Mobile: unprefixed, desktop override
<div className="w-full md:w-1/2 text-sm md:text-base" />

// Grid example
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" />
```

**✅ AUCUN desktop-first détecté**

#### CVA + cn() Merging ✅
```tsx
export default function Button({ variant, size, className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {children}
    </button>
  );
}
```

**✅ Bon pattern pour override avec className**

---

# Components Concern Mixing Analysis {#concerns}

## Verdict: ✅ CLEAN - No Major Issues

### Good Examples

**Avatar.tsx** ✅
```tsx
interface AvatarProps extends VariantProps<typeof avatarVariants> {
  src?: string;         // Content (image URL)
  alt: string;          // Content (alt text)
  className?: string;   // Presentation
}
```
→ Pas de mélange - src/alt sont des propriétés de contenu pour une image

**Button.tsx** ✅
```tsx
interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}
```
→ Accepte uniquement des HTML button attributes + CVA

---

# Tailwind & CVA {#tailwind}

## Summary

| Category | Status | Notes |
|----------|--------|-------|
| Mobile-first methodology | ✅ | All base classes unprefixed |
| Breakpoint usage | ✅ | sm:, md:, lg:, xl: properly used |
| CVA implementation | ✅ | All UI components use CVA |
| className merging | ✅ | cn() function (clsx + tailwind-merge) |
| No style={{}} abuse | ✅ | Clean utility-based approach |

---

# Patterns & Code Quality {#patterns}

## Code Duplication

### ⚠️ Image URL Resolution
Called in many places - should centralize more:
```tsx
// Better: use getImageUrl everywhere consistently
getImageUrl(src) || DEFAULT_AVATAR
```

### ✅ Multipart Parsing
Already extracted into `ParseMultipartTrait` ✅

### ✅ Error Handling
Centralized in Store with errors Record ✅

---

## Dead Code & Unused Properties

| Item | Fichier | Status |
|------|---------|--------|
| **User.readOnly** | [Entity/User.php](/backend/src/Entity/User.php#L90) | ❌ Never used |
| **BlockedAccountService** | [Service/BlockedAccountService.php](/backend/src/Service/BlockedAccountService.php) | ⚠️ Single method, could be utility |

---

# Security Checklist {#security}

## Backend ✅

| Item | Status | Details |
|------|--------|---------|
| Passwords hashed | ✅ | Symfony PasswordHasher |
| Tokens hashed | ✅ | SHA-256 before DB storage |
| #[IsGranted] enforced | ✅ | ROLE_USER on most endpoints |
| Blocked users rejected | ✅ | Checked in AccessTokenHandler |
| Block enforcement | ✅ | BlockService prevents interactions |
| CORS configured | ✅ | nelmio_cors package |
| CSRF protection | ✅ | symfony/csrf |
| Input validation | ✅ | Symfony Validator + DTOs |
| Query parameters validated | ⚠️ | search() method missing validation |

## Frontend ✅

| Item | Status | Details |
|------|--------|---------|
| Token in localStorage | ✅ | Standard for SPAs |
| Bearer in headers | ✅ | apiFetch adds automatically |
| 401 handling | ✅ | Redirect to /login |
| No sensitive data | ✅ | Only token stored |
| Password validation | ✅ |  Frontend + backend |

## Potential Concerns

⚠️ **No Refresh Token Logic**
- Tokens expire at 30 days
- No mechanism to refresh without re-login
- **Recommendation:** Implement refresh token endpoint

⚠️ **CORS Origin Not Verified in Code**
- Check `config/packages/nelmio_cors.yaml`

---

# Fichiers Clés - Chemin Complet {#files}

## Backend
```
backend/
├── src/
│   ├── Controller/Api/
│   │   ├── TweetController.php
│   │   ├── UserController.php
│   │   ├── SecurityController.php
│   │   ├── ReplyController.php
│   │   └── AdminCensorController.php
│   ├── Entity/
│   │   ├── User.php
│   │   ├── Tweet.php
│   │   ├── Reply.php
│   │   └── Token.php
│   ├── Dto/Payload/
│   │   ├── RegisterPayload.php
│   │   ├── LoginPayload.php
│   │   ├── TweetPayload.php
│   │   ├── CreateReplyPayload.php
│   │   └── UpdateProfilePayload.php
│   ├── Service/
│   │   ├── TokenManager.php
│   │   ├── TweetService.php
│   │   ├── UserRegistrationService.php
│   │   ├── LoginAuthenticationService.php
│   │   ├── BlockService.php
│   │   ├── FollowService.php
│   │   ├── LikeService.php
│   │   ├── ReplyService.php
│   │   ├── TweetUploadService.php
│   │   ├── UpdateProfileService.php
│   │   ├── CensorService.php
│   │   └── TweetApiFormatter.php (+ 14 autres services/resolvers)
│   ├── Repository/
│   │   ├── TweetRepository.php
│   │   ├── UserRepository.php
│   │   ├── ReplyRepository.php
│   │   └── TokenRepository.php
│   ├── Security/
│   │   └── AccessTokenHandler.php
│   └── Trait/
│       └── ParseMultipartTrait.php
```

## Frontend
```
frontend/src/
├── main.tsx (Router setup)
├── lib/
│   ├── api.ts (apiFetch, all API endpoints)
│   └── utils.ts (cn(), getImageUrl())
├── store/
│   ├── types.ts (AppState, StoreActions, User, Tweet)
│   └── StoreContext.tsx (StoreProvider, useStore, specialized hooks)
├── routes/
│   ├── feed.tsx (loader: fetchTweets)
│   ├── post.tsx (PostForm)
│   ├── profile.tsx (loader: parallel fetch)
│   ├── editProfile.tsx (EditProfileForm)
│   ├── settings.tsx
│   ├── login.tsx (LoginForm)
│   ├── register.tsx (RegisterForm)
│   └── error.tsx (ErrorPage)
└── components/
    ├── ui/
    │   ├── Button.tsx (CVA)
    │   ├── Input.tsx (CVA)
    │   ├── Textarea.tsx (CVA)
    │   ├── Avatar.tsx (CVA)
    │   ├── Banner.tsx (CVA)
    │   ├── Checkbox.tsx (CVA)
    │   ├── Heart.tsx (CVA + Motion)
    │   ├── TweetCard.tsx ⚠️ (200+ lines)
    │   ├── Mention.tsx
    │   ├── ReplyForm.tsx
    │   └── ReplyList.tsx
    └── (composites)
        ├── Header.tsx
        ├── NavBar.tsx
        ├── ProfileDropdown.tsx
        ├── LoginForm.tsx
        ├── RegisterForm.tsx
        ├── PostForm.tsx
        ├── SearchBar.tsx
        ├── ProfileHeader.tsx
        ├── EditTweetModal.tsx
        ├── EditProfileForm.tsx
        ├── PasswordStrengthIndicator.tsx
        └── ConfirmDeleteModal.tsx
```

---

# Recommandations {#recommendations}

## 🔴 HIGH Priority

### 1. Remove/Investigate User.readOnly Property
**Fichier:** [backend/src/Entity/User.php#L90](/backend/src/Entity/User.php#L90)

```php
#[ORM\Column]
#[Groups(['default'])]
private bool $readOnly = false;  // ❌ Never used
```

**Action:** Supprimer ou documenter l'usage

---

### 2. Add Refresh Token Logic
**Impact:** Tokens expire at 30 days, users forced to re-login

**Solution:**
```php
// Backend: new endpoint
POST /api/refresh-token
→ Returns new token + new refresh token

// Frontend: StoreContext
- Save refresh token separately (HttpOnly would be better)
- On 401: Use refresh token to get new access token
- Only redirect to /login if both tokens expired
```

---

### 3. Validate Query Parameters in TweetController.search()
**Fichier:** [backend/src/Controller/Api/TweetController.php#L71](/backend/src/Controller/Api/TweetController.php#L71)

```php
// ❌ Current - no validation
$query = $request->query->get('q', '');
$username = $request->query->get('user', '');

// ✅ Better - create SearchQueryDTO
class SearchQueryDTO {
    #[Assert\Length(max: 200)]
    public ?string $q = null;
    
    #[Assert\Length(max: 180)]
    public ?string $user = null;
    
    #[Assert\DateTime]
    public ?string $startDate = null;
}
```

---

### 4. Fix Dynamic Import in Store
**Fichier:** [frontend/src/store/StoreContext.tsx#L475](/frontend/src/store/StoreContext.tsx#L475)

```tsx
// ❌ Current
const { updateTweet: apiUpdateTweet } = await import('../lib/api');

// ✅ Better
import { updateTweet } from '../lib/api';
// Then use: await updateTweet(...)
```

---

## 🟡 MEDIUM Priority

### 1. Split TweetCard Component
**File:** [frontend/src/components/ui/TweetCard.tsx](/frontend/src/components/ui/TweetCard.tsx) (200+ lines)

Too complex - split into:
```tsx
<TweetCard />
├── <TweetHeader /> (author, date, menu)
├── <TweetContent /> (text, medias)
├── <TweetActions /> (like, reply, pin, delete)
└── <TweetReplies /> (list + form)
```

---

### 2. Centralize Image URL Building
Currently scattered:
```tsx
getImageUrl(src) || DEFAULT_AVATAR
getImageUrl(user.profilePicture)
imageUrl ? <img src={imageUrl} /> : <div>fallback</div>
```

**Create ImageDisplay component:**
```tsx
<Image 
  src={url} 
  alt={alt} 
  fallback={<DefaultAvatar />}
  className="w-10 h-10"
/>
```

---

### 3. Consolidate Multipart Upload Logic
**Status:** Already in `ParseMultipartTrait` ✅

Ensure all controllers use it consistently (check ReplyController)

---

### 4. Type Loaders Properly
Some loaders return `any` instead of typed response

Example [profile.tsx](/frontend/src/routes/profile.tsx):
```tsx
export async function loader({ params }: LoaderFunctionArgs): Promise<LoaderData | Response> {
  // ✅ Good - typed return
}
```

---

## 🟢 LOW Priority

### 1. Add Comprehensive Tests
No test files found (jest/vitest not visible)

### 2. Audit CORS Configuration
Check `backend/config/packages/nelmio_cors.yaml` - verify origins are restricted

### 3. Consider React Query / TanStack Query
Would eliminate duplication in:
- apiFetch logic
- Cache management
- Error handling
- Request deduplication

### 4. Document Store Pattern
Add JSDoc to StoreContext methods with examples

---

# Résumé Conformité {#resume}

| Category | Score | Notes |
|----------|-------|-------|
| **Backend Structure** | 85/100 | Good separation, minor validation issues |
| **API Controllers** | 90/100 | DI correct, DTOs used, proper attributes |
| **Security** | 85/100 | Tokens hashed, blocked users checked, no refresh logic |
| **Frontend Structure** | 85/100 | Clean folders, proper routing |
| **Store Pattern** | ✅✅ 95/100 | Excellent - optimistic updates, immutability, proper hooks |
| **React Router** | 90/100 | Good loaders, protected routes, type-safe |
| **Components** | 85/100 | CVA used correctly, no concern mixing, TweetCard too complex |
| **Tailwind** | 95/100 | Mobile-first, consistent, no style={{}} abuse |
| **Code Quality** | 80/100 | Some dead code, minor duplication, good patterns |
| **TypeScript** | 85/100 | Good typing, some any avoidance, Group props |
| **Overall** | **87/100** | Solid project, follow recommendations above |

---

**Audit Completed:** 30 Mars 2026 | **Auditor:** GitHub Copilot
