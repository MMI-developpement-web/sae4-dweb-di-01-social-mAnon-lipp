# Architecture Documentation — Social Network SAÉ 4.DWeb-DI.01

> **Context:** IUT du Limousin / Département MMI / BUT2  
> **Project:** Build a social network (Twitter/Instagram-like) using Symfony (back) + React + Tailwind (front) in a Docker environment.  
> **Period:** 2 March → 3 April 2026 — Iterative development.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Global Architecture](#2-global-architecture)
3. [Backend — Symfony](#3-backend--symfony)
   - [Folder Structure](#31-folder-structure)
   - [REST API](#32-rest-api)
   - [Security & Authentication](#33-security--authentication)
   - [Entities & Doctrine ORM](#34-entities--doctrine-orm)
   - [Services & DTOs](#35-services--dtos)
   - [Back Office — EasyAdmin](#36-back-office--easyadmin)
4. [Frontend — React + Tailwind](#4-frontend--react--tailwind)
   - [Folder Structure](#41-folder-structure)
   - [Routing — React Router DOM](#42-routing--react-router-dom)
   - [Design System](#43-design-system)
   - [Data Fetching Pattern](#44-data-fetching-pattern)
5. [Docker Environment](#5-docker-environment)
6. [Database](#6-database)
7. [Deployment](#7-deployment)
8. [GitHub Workflow](#8-github-workflow)
9. [Iteration Plan](#9-iteration-plan)

---

## 1. Project Overview

This application is a **social network** where users can:

- Publish content (posts, images, etc.)
- Share content with other users
- Follow/interact with other users
- Access a back office (admin panel) for content moderation and management

**Architecture pattern:** Decoupled full-stack  
- **Back:** Symfony exposes a **REST API** (JSON) + EasyAdmin back office  
- **Front:** React consumes the API exclusively via JSON, using **client-side rendering (CSR)**  
- Communication between front and back happens only via HTTP/JSON

---

## 2. Global Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        Docker Compose                         │
│                                                               │
│  ┌─────────────┐   HTTP/JSON   ┌──────────────────────────┐  │
│  │  React +    │  ──────────►  │  Symfony API (REST)      │  │
│  │  Tailwind   │  ◄──────────  │  /api/*                  │  │
│  │  (frontend) │               │                          │  │
│  │  :3000      │               │  EasyAdmin back office   │  │
│  └─────────────┘               │  /admin/*                │  │
│                                 │                          │  │
│                                 │  Nginx reverse proxy     │  │
│                                 │  :8787                   │  │
│                                 └──────────┬───────────────┘  │
│                                             │                  │
│                                  ┌──────────▼───────────┐     │
│                                  │  MySQL 8             │     │
│                                  │  :3306               │     │
│                                  └──────────────────────┘     │
└──────────────────────────────────────────────────────────────┘
```

---

## 3. Backend — Symfony

> **Documentation:** [Symfony Docs](https://symfony.com/doc/current/index.html)  
> **Context7 library ID:** `/symfony/symfony-docs` — Use for all Symfony-related questions.

### 3.1 Folder Structure

```
src/
├── Controller/
│   ├── Api/                     # REST API controllers (JSON responses)
│   │   ├── ApiLegoController.php    # Reference: map to future Post/User controllers
│   │   └── SecurityController.php  # /api/login, /api/register
│   ├── LegoController.php           # Web (Twig) controllers — back office views
│   └── SecurityController.php       # Form login (Twig)
│
├── Dto/
│   └── Payload/
│       └── CreateLegoPayload.php    # Input validation via #[MapRequestPayload]
│
├── Entity/                          # Doctrine ORM entities
│   ├── User.php
│   ├── Token.php
│   ├── Lego.php                     # Reference entity → adapt to Post, Comment, etc.
│   └── LegoCollection.php
│
├── Repository/                      # Doctrine repositories (custom queries)
│   ├── UserRepository.php
│   ├── TokenRepository.php
│   ├── LegoRepository.php
│   └── LegoCollectionRepository.php
│
├── Security/
│   └── AccessTokenHandler.php       # Stateless API auth via Bearer token
│
├── Service/
│   ├── TokenManager.php             # Token generation and hashing (SHA-256)
│   ├── LegoService.php              # Business logic layer
│   └── FileUploader.php             # File/image upload handler
│
└── Validator/
    └── Constraints/
        ├── ValidLegoCollection.php
        └── ValidLegoCollectionValidator.php
```

### 3.2 REST API

All API routes are prefixed with `/api/` and return JSON.

| Method | Route             | Description                        | Auth required |
|--------|-------------------|------------------------------------|---------------|
| POST   | `/api/login`      | JSON login → returns Bearer token  | No            |
| POST   | `/api/register`   | Create new user account            | No            |
| GET    | `/api/posts`      | List all posts (paginated)         | No (premium: Yes) |
| GET    | `/api/posts/{id}` | Get single post                    | No            |
| POST   | `/api/posts`      | Create a new post                  | Yes           |
| PUT    | `/api/posts/{id}` | Update a post                      | Yes (owner)   |
| DELETE | `/api/posts/{id}` | Delete a post                      | Yes (owner)   |

**Pagination pattern** (from reference project):
```
GET /api/posts?page=1&per_page=10
```
Response:
```json
{
  "posts": [...],
  "pagination": {
    "current_page": 1,
    "per_page": 10,
    "total_items": 42
  }
}
```

**Serializer groups** — control which fields are exposed in JSON responses:
```php
#[ORM\Column(length: 255)]
#[Groups(['default'])]          // exposed to all
private ?string $content = null;

#[ORM\Column]
#[Groups(['admin'])]            // only in admin context
private ?bool $isActive = null;
```

### 3.3 Security & Authentication

Authentication is **stateless** for the API, using a **Bearer Access Token**.

**Flow:**
```
Client → POST /api/login { email, password }
       ← 200 { "token": "raw_token_string" }

Client → GET /api/posts
         Header: Authorization: Bearer <raw_token_string>
       ← 200 { posts: [...] }
```

**Key components:**

| Component | Role |
|---|---|
| `AccessTokenHandler` | Validates incoming `Authorization: Bearer` token against DB |
| `TokenManager` | Generates raw token → hashes with SHA-256 → stores in DB |
| `Token` entity | Stores `hashed_value`, `user`, `created_at`, `expires_at` |

**security.yaml pattern:**
```yaml
firewalls:
  main:
    access_token:
      token_handler: App\Security\AccessTokenHandler
    json_login:
      check_path: api_login
```

> **Context7 reference:** Query `/symfony/symfony-docs` for "access token authentication stateless API security"

### 3.4 Entities & Doctrine ORM

All entities use **PHP 8 Attributes** for ORM mapping.

**Base entity pattern:**
```php
#[ORM\Entity(repositoryClass: UserRepository::class)]
class User
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['default'])]
    private ?int $id = null;

    // Relations use ManyToOne / OneToMany / ManyToMany
    #[ORM\OneToMany(mappedBy: 'author', targetEntity: Post::class)]
    private Collection $posts;
}
```

**Migrations** are managed via Doctrine Migrations:
```bash
php bin/console doctrine:migrations:diff
php bin/console doctrine:migrations:migrate
```

### 3.5 Services & DTOs

**DTO / Payload pattern** — validate and type input data from API requests:
```php
class CreatePostPayload
{
    #[Assert\NotBlank]
    #[Assert\Length(min: 1, max: 280)]
    public string $content;

    public ?int $mediaId = null;
}

// In controller:
public function create(
    #[MapRequestPayload] CreatePostPayload $payload
): JsonResponse { ... }
```

**Service layer** — business logic lives in `src/Service/`, never in controllers.

### 3.6 Back Office — EasyAdmin

The admin back office is built with **EasyAdmin** bundle:
- Accessible at `/admin`
- CRUD for Users, Posts, etc.
- Protected by `ROLE_ADMIN`

> **Context7 reference:** Query `/symfony/symfony-docs` for "EasyAdmin CRUD controller configuration"

---

## 4. Frontend — React + Tailwind

> **Documentation:**  
> - React Router: [reactrouter.com](https://reactrouter.com)  
> - Context7 library ID for React Router: `/websites/reactrouter_6_30_3`  
> - Tailwind CSS: [tailwindcss.com](https://tailwindcss.com)  
> - Context7 library ID for Tailwind: `/tailwindlabs/tailwindcss.com`

### 4.1 Folder Structure

```
src/                             # React + TypeScript + Tailwind project
├── main.tsx                     # Entry point — ReactDOM.createRoot + RouterProvider
├── App.tsx                      # Root component (optionally used for providers)
├── index.css                    # Tailwind directives (@tailwind base/components/utilities)
├── App.css                      # Global custom styles
│
├── routes/                      # One file per page/route
│   ├── root.tsx                 # Layout route: <NavBar /> + <Outlet />
│   ├── feed.tsx                 # Home feed (loader fetches posts)
│   ├── profile.tsx              # User profile page
│   ├── login.tsx                # Login form
│   └── register.tsx             # Registration form
│
├── components/                  # All UI components (two levels)
│   │
│   ├── ui/                      # ─── ATOMS — indivisible base elements ───
│   │   ├── Button.tsx           # CVA variants: primary, secondary, danger, ghost, outline
│   │   ├── Input.tsx            # CVA variants: default, error
│   │   ├── Badge.tsx            # CVA variants: success, warning, error
│   │   ├── Avatar.tsx           # CVA sizes: sm, md, lg
│   │   └── Checkbox.tsx         # CVA variants: default, error
│   │
│   ├── NavBar/                  # ─── COMPOSITES — built from ui/ atoms ───
│   │   └── index.tsx
│   ├── PostCard/
│   │   ├── index.tsx
│   │   └── PostSkeleton.tsx
│   ├── Feed/
│   │   └── index.tsx
│   ├── Avatar/
│   │   └── index.tsx
│   └── ErrorPage/
│       └── index.tsx
│
│   ⚠️  Rule: atoms in ui/ may NOT import composites.
│           Composites import from ui/ freely.
│
├── lib/
│   ├── utils.ts                 # cn() helper: clsx + tailwind-merge
│   ├── loaders.ts               # Data fetching functions (used in route loaders)
│   └── api.ts                   # API client (fetch wrappers for Symfony REST API)
│
└── assets/                      # Static assets (images, fonts, icons)
```

### 4.2 Routing — React Router DOM

The app uses **`createBrowserRouter`** (data router) from `react-router-dom`.  
This is **mandatory** to use route `loader` functions for data fetching.

**Pattern:**
```tsx
// main.tsx
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Root from "./routes/root";
import Feed, { loader as feedLoader } from "./routes/feed";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,         // Layout: NavBar + <Outlet />
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <Feed />,
        loader: feedLoader,    // Runs BEFORE render, fetches data in parallel
      },
      {
        path: "profile/:userId",
        element: <Profile />,
        loader: profileLoader,
      },
      {
        path: "login",
        element: <Login />,
      },
    ],
  },
]);
```

**Route file pattern:**
```tsx
// routes/feed.tsx
import { useLoaderData } from "react-router-dom";

export async function loader() {
  const res = await fetch("/api/posts?page=1&per_page=20");
  return res.json();
}

export default function Feed() {
  const data = useLoaderData();   // Type-safe access to loader return value
  return <PostList posts={data.posts} />;
}
```

> **Key rules:**
> - Loaders run **in parallel** for nested routes — no waterfalls
> - Loaders **never** run inside components (no `useEffect` for initial data)
> - Use `<Outlet />` in layout routes to render child routes

### 4.3 Design System & Mobile-First

#### Mobile-First

The app is built **mobile-first**: every component and layout starts from the smallest viewport and uses Tailwind breakpoint prefixes (`sm:`, `md:`, `lg:`, `xl:`) to override for wider screens. Unprefixed classes = mobile layout.

```tsx
// ✅ Mobile-first: stacked on mobile, side-by-side on md+
<div className="flex flex-col gap-4 md:flex-row md:gap-8" />

// ❌ Never do desktop-first
<div className="flex flex-row lg:flex-col" />
```

#### Design Tokens — CSS Custom Properties

Colors, surfaces and gradients are defined as **CSS custom properties** in `index.css` and exposed to Tailwind via `@theme inline`. This means:
- Components never use hardcoded hex values
- Swapping a theme means changing `:root` overrides only — components adapt automatically

**`src/index.css` structure:**

```css
/* 1. Raw CSS variables — overridable per theme */
:root {
  --color-primary:        #fbcc58;
  --color-primary-hover:  #f0b830;
  --color-background:     #ffffff;
  --color-surface:        #ffffff;
  --color-text:           #1a1a1a;
  --color-text-muted:     #8d8d8d;
  --color-border:         #808080;
  --color-border-muted:   #adadad;
  --color-placeholder:    #9ca3af;
  --color-danger:         #ef4444;
  --color-danger-hover:   #dc2626;
  --gradient-auth: linear-gradient(155.25deg, …);
}

/* Optional theme override */
[data-theme="dark"] {
  --color-background: #121212;
  --color-surface:    #1e1e1e;
  --color-text:       #f1f1f1;
}

/* 2. Tailwind v4 — expose tokens as utility classes */
@theme inline {
  --color-primary:        var(--color-primary);
  --color-primary-hover:  var(--color-primary-hover);
  --color-background:     var(--color-background);
  --color-surface:        var(--color-surface);
  --color-text:           var(--color-text);
  --color-text-muted:     var(--color-text-muted);
  --color-border:         var(--color-border);
  --color-placeholder:    var(--color-placeholder);
  --color-danger:         var(--color-danger);
  --color-danger-hover:   var(--color-danger-hover);
}

/* 3. Utility classes that use gradient tokens */
@layer utilities {
  .bg-auth-gradient { background: var(--gradient-auth); }
}
```

**Generated Tailwind classes (examples):**

| Token | Tailwind classes available |
|---|---|
| `--color-primary` | `bg-primary`, `text-primary`, `border-primary`, `ring-primary` |
| `--color-surface` | `bg-surface` |
| `--color-text` | `text-text` |
| `--color-text-muted` | `text-text-muted` |
| `--color-border` | `border-border` |
| `--color-danger` | `bg-danger`, `text-danger`, `border-danger` |
| `--gradient-auth` | `bg-auth-gradient` (custom utility) |

> **Rule:** Never write `bg-[#fbcc58]` or `text-[#8d8d8d]` in components. Always use the semantic token class (`bg-primary`, `text-text-muted`, etc.).

#### cn() utility

```ts
// src/lib/utils.ts
import { twMerge } from "tailwind-merge";
import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

#### CVA component pattern

All atoms in `src/components/ui/` use **CVA** (`class-variance-authority`). Variants reference semantic token classes, not hardcoded values.

```tsx
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-[10px] font-medium transition-colors disabled:opacity-50",
  {
    variants: {
      variant: {
        // ✅ semantic tokens — adapt to the active theme
        primary:   "bg-primary text-white hover:bg-primary-hover",
        secondary: "bg-surface border border-border text-text hover:bg-gray-50",
        danger:    "bg-danger text-white hover:bg-danger-hover",
        ghost:     "bg-transparent text-text hover:bg-gray-100",
        outline:   "border border-primary text-primary hover:bg-primary/10",
      },
      size: {
        sm: "h-9 px-4 text-sm",
        md: "h-[54px] px-6 text-base",
        lg: "h-14 px-8 text-lg",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export default function Button({ variant, size, className, ...props }: ButtonProps) {
  return (
    <button className={cn(buttonVariants({ variant, size }), className)} {...props} />
  );
}
```

**Available base components:**

| Component | Variants |
|---|---|
| `Button` | `primary`, `secondary`, `danger`, `ghost`, `outline` × `sm`, `md`, `lg` |
| `Badge` | `success`, `warning`, `error` × `sm`, `md`, `lg` |
| `Input` | `default`, `error` × `sm`, `md` |
| `Checkbox` | `default`, `error` × `sm`, `md` |

#### HTML sémantique — ne pas tout mettre dans des `<div>`

Chaque élément HTML doit refléter le rôle de son contenu. Utiliser `<div>` pour tout est interdit sauf quand aucun autre élément ne convient (conteneur purement visuel/layout).

| Situation | ✅ Bon élément | ❌ À éviter |
|---|---|---|
| Contenu principal d'une page | `<main>` | `<div>` |
| Zone d'en-tête de carte/section | `<header>` | `<div>` |
| Navigation | `<nav>` | `<div>` |
| Pied de page | `<footer>` | `<div>` |
| Formulaire | `<form>` | `<div>` |
| Titre de page / section | `<h1>`…`<h6>` | `<p>`, `<div>` |
| Texte courant | `<p>` | `<div>` |
| Article indépendant (post, carte) | `<article>` | `<div>` |
| Section thématique avec titre | `<section>` | `<div>` |
| Liste d'éléments | `<ul>` / `<ol>` + `<li>` | `<div>` |
| Bouton déclencheur d'action | `<button>` | `<div>`, `<span>` |
| Image | `<img alt="…">` | `<div>` avec background |
| Lien de navigation | `<a>` ou `<Link>` | `<div onClick>` |
| Champ de formulaire + libellé | `<label htmlFor>` + `<input id>` | `<div>` + texte nu |

**Règles pratiques :**
- Une page = un seul `<main>`
- Les `<h1>` → `<h6>` respectent une hiérarchie logique (pas de saut de niveau)
- Tout `<input>` est relié à son `<label>` via `htmlFor` / `id`
- Un `<form>` contient son bouton `type="submit"` (pas un `<button>` orphelin)
- `<article>` pour chaque post, commentaire, carte de profil autonome
- `<section>` uniquement si la zone a un titre visible (`<h2>`, `<h3>`…)

```tsx
// ✅ Correct
<main className="...">
  <article className="...">
    <header>
      <h2>Titre du post</h2>
    </header>
    <p>Contenu…</p>
    <footer>
      <button type="button">Liker</button>
    </footer>
  </article>
</main>

// ❌ Incorrect
<div className="...">
  <div className="...">
    <div>Titre du post</div>
    <div>Contenu…</div>
    <div onClick={like}>Liker</div>
  </div>
</div>
```

### 4.4 Data Fetching Pattern

All API calls go through `src/lib/api.ts` (to be created):

```ts
// lib/api.ts
const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8787/api";

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem("auth_token");
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });
  if (!res.ok) throw new Response(await res.text(), { status: res.status });
  return res.json();
}
```

Used in route loaders:
```ts
// lib/loaders.ts
import { apiFetch } from "./api";

export function fetchPosts(page = 1) {
  return apiFetch(`/posts?page=${page}&per_page=20`);
}
```

---

## 5. Docker Environment

Three main services are defined in `docker-compose.yml`:

| Service | Image | Port | Role |
|---|---|---|---|
| `nginx` | `nginx:latest` | `8787:80` | Reverse proxy (PHP + static frontend) |
| `php` | Custom (`docker/php/Dockerfile`) | — | PHP-FPM runtime for Symfony |
| `mysql` | `mysql:8` | — | Database |
| `phpmyadmin` | `phpmyadmin` | `8788:80` | DB management UI |
| `frontend` | `node:lts` | `3000:5173` | Vite dev server (React) |

**Commands:**
```bash
docker compose up -d                   # Start all services
docker compose exec php bash           # Enter PHP container
docker compose exec php php bin/console doctrine:migrations:migrate
```

---

## 6. Database

**Engine:** MySQL 8  
**ORM:** Doctrine (Symfony)  
**Migration tool:** `doctrine/migrations` bundle

Schema is managed via Doctrine migrations in `migrations/`.  
Never edit the DB schema directly — always use:
```bash
php bin/console make:entity            # Create/update entity
php bin/console doctrine:migrations:diff   # Generate migration
php bin/console doctrine:migrations:migrate  # Apply migration
```

---

## 7. Deployment

**Development:** Docker (local)  
**Production:** LAMP-based hosting (e.g., Pulse Heberg / `mmi.unilim.fr`)

For production:
- Compile React assets: `npm run build` → deploy `dist/` to hosting `public_html/`
- Configure Symfony for `APP_ENV=prod`
- Set proper DB credentials in `.env.local`
- Run `composer install --no-dev --optimize-autoloader`

---

## 8. GitHub Workflow

```
main
  ├── iteration-1        ← Iteration 1 feature branch
  ├── iteration-2        ← Iteration 2 feature branch
  ├── ...
  └── cycle-1            ← Merge of all cycle 1 iterations (tagged release)
```

**Rules:**
- One branch **per iteration** named `iteration-X`
- It is **not possible** to start iteration N+1 before iteration N is complete and tested
- At end of each cycle, merge all cycle iterations into a `cycle-X` branch
- Each cycle produces a **production-hosted** version

---

## 9. Iteration Plan

Iterations are organized in **cycles**. Each cycle is a meta-iteration — the next cycle cannot begin before the previous one is fully done and deployed.

> Iterations to be defined per the project User Stories (click each iteration in the subject table for the corresponding User Story).

**Cycle structure template:**

| Iteration | Feature | Status |
|---|---|---|
| 1 | Project setup: Docker + Symfony API starter + React/Vite starter | ☐ |
| 2 | User registration + login (API + React form) | ☐ |
| 3 | Create & list posts (feed) | ☐ |
| 4 | User profiles | ☐ |
| 5 | Follow system | ☐ |
| 6 | Like / interaction system | ☐ |
| 7 | Image upload for posts | ☐ |
| 8 | EasyAdmin back office setup | ☐ |
| ... | ... | ☐ |
