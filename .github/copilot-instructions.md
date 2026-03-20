# GitHub Copilot Instructions — Social Network SAÉ 4.DWeb-DI.01

## Project Overview

A full-stack social network application built with:
- **Backend:** Symfony (PHP) — REST API + EasyAdmin back office
- **Frontend:** React + TypeScript + Tailwind CSS — Client-Side Rendering
- **Database:** MySQL 8 via Doctrine ORM
- **Infrastructure:** Docker (development), LAMP (production)
- **Routing (front):** React Router DOM v6 with `createBrowserRouter` and route loaders

---

## ⚠️ Critical Rule — Always Use Context7

**For every question or code generation related to any technology used in this project, ALWAYS fetch up-to-date documentation via Context7 BEFORE writing any code.**

| Technology | Context7 Library ID |
|---|---|
| Symfony (backend, API, security, Doctrine) | `/symfony/symfony-docs` |
| React Router DOM (routing, loaders, hooks) | `/websites/reactrouter_6_30_3` |
| Tailwind CSS (styling, utilities) | `/tailwindlabs/tailwindcss.com` |
| React (components, hooks, patterns) | `/facebook/react` |

**How to use Context7:**
1. Call `resolve-library-id` if unsure of the exact library ID
2. Call `query-docs` with the resolved ID and a specific query
3. Use returned examples as the basis for generated code

**Always refer to `docs/architecture.md`** for the complete project architecture and file structure before generating any code.

**Always use Doctrine** but ask me to do it, every entity must be generated with a migration and made by me using Doctrine in the terminal, never edit the DB schema manually.Never ever write into the Entity folder without asking me, I will generate the entity and the migration with Doctrine. You have to always ask to generate the entity and the migration with Doctrine, never write into the Entity folder without asking me.

---

## Backend Rules — Symfony

### Project structure
```
src/
├── Controller/Api/     # ONLY JSON responses — REST endpoints
├── Controller/         # Twig/web controllers (back office views)
├── Dto/Payload/        # Input validation objects (#[MapRequestPayload])
├── Entity/             # Doctrine ORM entities (PHP 8 attributes)
├── Repository/         # Custom Doctrine queries
├── Security/           # AccessTokenHandler (stateless Bearer auth)
├── Service/            # Business logic — never put logic in controllers
└── Validator/          # Custom constraint validators
```

### API Controller rules
- All API controllers extend `AbstractController` from Symfony
- All API routes MUST return `JsonResponse`
- All routes under `/api/` use `format: 'json'` in `#[Route]`
- Use `#[MapRequestPayload]` for validated input instead of reading request manually
- Use Serializer groups (`#[Groups(['default'])]`) to control JSON output fields
- Implement pagination with `?page=N&per_page=N` query parameters

// Controller best-practices
- Don't instantiating domain or entity objects with `new` inside controllers. Put business logic and object creation in services under `src/Service/` and inject those services into controllers (constructor injection / autowiring). Controllers should orchestrate services and return responses, not contain persistence or business rules.

- Always inject the current user with the `#[CurrentUser]` attribute instead of calling `$this->getUser()` in controller methods. This makes method dependencies explicit and simplifies testing.

```php
// ✅ Prefer this
public function create(#[MapRequestPayload] TweetPayload $payload, #[CurrentUser] User $user)
{
  $tweet = $this->tweetService->createTweet($user, trim($payload->content));
  return $this->json($tweet, 201, [], ['groups' => 'default']);
}

// ❌ Avoid this inside controllers
$tweet = new Tweet();
$tweet->setAuthor($this->getUser());
// persistence + business logic here
```

```php
// ✅ Correct pattern
#[Route('/api/posts', name: 'posts.all', methods: ['GET'], format: 'json')]
public function all(PostRepository $repo, Request $request): JsonResponse
{
    $page = (int) $request->query->get('page', 1);
    $perPage = (int) $request->query->get('per_page', 20);
    $posts = $repo->findByLimitOffset($perPage, ($page - 1) * $perPage);
    return $this->json(['posts' => $posts, 'pagination' => [...]], 200, [], ['groups' => 'default']);
}
```

### Security rules
- Authentication is **stateless** — Bearer token, no sessions for the API
- Token flow: `POST /api/login` → `TokenManager::generateForUser()` → return raw token
- Token is stored **hashed** (SHA-256) in the `token` table
- `AccessTokenHandler` validates incoming tokens against the DB
- Form login (Twig back office) is separate from API JSON login

```php
// ✅ Correct token handler pattern
public function getUserBadgeFrom(string $accessToken): UserBadge
{
    $hashed = hash('sha256', $accessToken);
    $token = $this->repository->findOneByValue($hashed);
    if (null === $token || !$token->isValid()) {
        throw new BadCredentialsException('Invalid credentials.');
    }
    return new UserBadge($token->getUser()->getEmail());
}
```

### Entity rules
- Always use PHP 8 attribute syntax for ORM mapping (`#[ORM\Column]`, etc.)
- Always add `#[Groups(['default'])]` to fields that should be serialized in API responses
- Relations: use `#[ORM\ManyToOne]`, `#[ORM\OneToMany]`, `#[ORM\ManyToMany]` with proper `inversedBy`/`mappedBy`
- Never use `array_map` or manual JSON encoding — use Symfony Serializer via `$this->json()`

### Migrations rules
- NEVER edit the DB schema manually
- Always generate migrations with: `php bin/console doctrine:migrations:diff`
- Always apply with: `php bin/console doctrine:migrations:migrate`

### Service rules
- Business logic goes in `src/Service/`, not in controllers
- Services receive dependencies via constructor injection (autowiring)
- Use `EntityManagerInterface` for persistence operations

---

## Frontend Rules — React + TypeScript + Tailwind

### Project structure
```
src/
├── main.tsx                  # Entry: createBrowserRouter + RouterProvider
├── routes/                   # One file per page — exports component + loader
├── components/
│   ├── ui/                   # Atomic design system elements (never import composites here)
│   │   ├── Button.tsx        # CVA — variants: primary, secondary, danger, ghost, outline
│   │   ├── Input.tsx         # CVA — variants: default, error
│   │   ├── Badge.tsx         # CVA — variants: success, warning, error
│   │   ├── Avatar.tsx        # CVA — sizes: sm, md, lg
│   │   └── Checkbox.tsx      # CVA — variants: default, error
│   ├── NavBar/               # Composite — built from ui/ atoms
│   ├── PostCard/             # Composite — built from ui/ atoms
│   ├── Feed/                 # Composite — built from ui/ atoms
│   └── ...                   # Any other composed feature-level block
├── lib/
│   ├── utils.ts              # cn() — clsx + tailwind-merge
│   ├── api.ts                # Typed fetch wrapper (adds Bearer token header)
│   └── loaders.ts            # Loader functions (called from route definitions)
└── assets/                   # Static files
```

> **Rule:** `components/ui/` = indivisible atoms (Button, Input, Badge, Avatar…).  
> `components/` (top level) = composites assembled from those atoms (NavBar, PostCard, Feed…).  
> A composite can import from `components/ui/`. An atom must NEVER import another composite.

### React Router DOM rules
- ALWAYS use `createBrowserRouter` — never `BrowserRouter` + `<Routes>`
- ALWAYS fetch data in route **loaders**, never in `useEffect`
- ALWAYS access loader data with `useLoaderData()` — never pass as props from parent
- Layout routes use `<Outlet />` to render children
- Use `errorElement: <ErrorPage />` at the root level

```tsx
// ✅ Correct route file pattern
// routes/feed.tsx
import { useLoaderData } from "react-router-dom";
import { fetchPosts } from "../lib/loaders";

export async function loader() {
  return fetchPosts(1);
}

export default function Feed() {
  const data = useLoaderData() as { posts: Post[]; pagination: Pagination };
  return <PostList posts={data.posts} />;
}

// ❌ Wrong — never do this
export default function Feed() {
  const [posts, setPosts] = useState([]);
  useEffect(() => {
    fetch("/api/posts").then(r => r.json()).then(setPosts);
  }, []);
}
```

### Tailwind CSS rules — Mobile-First
- The app is **mobile-first**: unprefixed utility classes target mobile screens, breakpoint prefixes (`sm:`, `md:`, `lg:`, `xl:`) add overrides for larger screens
- Use utility classes **directly** in JSX — do not write custom CSS unless unavoidable
- For conditional/variant classes, use `cn()` (clsx + tailwind-merge) — never template strings
- Never use `style={{}}` for things achievable with Tailwind utilities
- Use `@layer components` in CSS only for truly global, highly reused patterns
- Always design the mobile layout first, then add responsive overrides

```tsx
// ✅ Correct — mobile-first: column on mobile, row on md+
<div className="flex flex-col gap-4 md:flex-row md:gap-8" />

// ✅ Correct — conditional classes
<div className={cn("rounded-lg p-4", isActive && "bg-blue-500", className)} />

// ❌ Wrong — desktop-first thinking
<div className="flex flex-row lg:flex-col" />
// ❌ Wrong — inline styles
<div style={{ borderRadius: "8px", padding: "16px" }} />
// ❌ Wrong — template string class merging
<div className={`rounded-lg p-4 ${isActive ? "bg-blue-500" : ""}`} />
```

### Design System / CVA rules
- All base UI components MUST use `cva` (class-variance-authority) for variants
- Always expose a `className` prop for overrides, merged with `cn()`
- Always define `defaultVariants`
- Use `VariantProps<typeof componentVariants>` to type variant props
- Atoms must be in `src/components/ui/` with PascalCase filenames
- Composites (NavBar, PostCard…) must be in `src/components/` (not inside `ui/`)
- CVA variant classes must also follow mobile-first: base classes are mobile, breakpoint classes are `sm:`/`md:`/`lg:` overrides

```tsx
// ✅ Correct CVA component pattern
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const inputVariants = cva(
  "w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2",
  {
    variants: {
      variant: {
        default: "border-gray-300 focus:ring-blue-300",
        error:   "border-red-400 focus:ring-red-300 text-red-700",
      },
      size: {
        sm: "text-xs py-1.5",
        md: "text-sm py-2",
      },
    },
    defaultVariants: { variant: "default", size: "md" },
  }
);

interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {}

export default function Input({ variant, size, className, ...props }: InputProps) {
  return <input className={cn(inputVariants({ variant, size }), className)} {...props} />;
}
```

### API client rules
- All fetch calls go through `src/lib/api.ts` — never use raw `fetch` in components or loaders
- The API base URL comes from `import.meta.env.VITE_API_URL`
- Bearer token is read from `localStorage.getItem("auth_token")`
- On 401 responses, redirect to `/login`

```ts
// lib/api.ts pattern
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
  return res.json() as Promise<T>;
}
```

### TypeScript rules
- ALWAYS type loader return values — use `as` or explicit return types on loaders
- ALWAYS type API response shapes with `interface` or `type`
- Prefer `interface` for object shapes, `type` for unions/intersections
- No `any` — use `unknown` if type is truly unknown, then narrow

---

## General Copilot Behavior

### When generating new code
1. **Check Context7 first** using the library IDs in the table above
2. Follow the file/folder structure from `architecture.md`
3. Respect all patterns listed in this file (loaders, CVA, services, DTOs, etc.)
4. Write self-documenting code — minimal inline comments only where logic is non-obvious
5. All user-facing text that may be read in international context: write in **English**

### When asked about a Symfony question
→ Query `/symfony/symfony-docs` first, then generate code matching the documented pattern.

### When asked about React routing or data fetching
→ Query `/websites/reactrouter_6_30_3` first, ensure loaders pattern is used.

### When asked about Tailwind or component styling
→ Query `/tailwindlabs/tailwindcss.com` first, use CVA for variant-based components.

### Iterative development
- Respect the iteration/branch model: `iteration-X` branches
- Each feature must be fully functional before starting the next
- Never leave stubs or TODO comments in committed code

### Security checklist for every iteration
- [ ] API endpoints that modify data require `ROLE_USER` at minimum
- [ ] Input is validated via Symfony Validator / DTO before processing
- [ ] Passwords are hashed (Symfony password hasher — never plain text)
- [ ] Tokens are hashed (SHA-256) in the database — never stored raw
- [ ] CORS headers are configured for the frontend origin
- [ ] No sensitive data (credentials, tokens) committed to git

---

## Quick Reference

### Start a new Symfony API endpoint
1. Create/update entity in `src/Entity/` if needed → run migration
2. Create DTO in `src/Dto/Payload/` for POST/PUT input
3. Add business logic to `src/Service/`
4. Create/update controller in `src/Controller/Api/`
5. Test with a REST client (Postman/Insomnia/Bruno)

### Start a new React page/route
1. Create `src/routes/mypage.tsx` with a named `loader` export and a default component export
2. Add the route to `createBrowserRouter` in `main.tsx`
3. If new UI components are needed → create in `src/components/ui/` using CVA
4. Add API call in `src/lib/loaders.ts` calling `apiFetch`

### Environment variables
| Variable | Where | Description |
|---|---|---|
| `VITE_API_URL` | Frontend `.env` | Symfony API base URL |
| `DATABASE_URL` | Symfony `.env.local` | MySQL connection string |
| `APP_SECRET` | Symfony `.env.local` | Symfony security secret |
| `APP_ENV` | Symfony `.env` | `dev` or `prod` |
