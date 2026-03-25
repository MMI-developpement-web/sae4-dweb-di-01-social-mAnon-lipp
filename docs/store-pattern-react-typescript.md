# Le Store Pattern en React/TypeScript
### Du MVC que vous connaissez à la gestion d'état centralisée

---

## Table des matières

1. [Le problème : la communication entre composants](#1-le-problème--la-communication-entre-composants)
2. [Le prop drilling : quand ça devient pénible](#2-le-prop-drilling--quand-ça-devient-pénible)
3. [La solution : le Store Pattern](#3-la-solution--le-store-pattern)
4. [Parallèle avec le MVC classique](#4-parallèle-avec-le-mvc-classique)
5. [Implémentation concrète en TypeScript](#5-implémentation-concrète-en-typescript)
6. [Utilisation dans les composants React](#6-utilisation-dans-les-composants-react)
7. [Récapitulatif et bonnes pratiques](#7-récapitulatif-et-bonnes-pratiques)

---

## 1. Le problème : la communication entre composants

### L'architecture en arbre de React

Une application React est structurée comme un **arbre de composants**. Chaque composant peut avoir des enfants, qui peuvent eux-mêmes avoir des enfants, et ainsi de suite. Cette structure est à la fois sa force (modularité, réutilisabilité) et la source d'un problème récurrent : **comment deux composants éloignés dans l'arbre peuvent-ils partager un état ?**

Prenons l'exemple d'un réseau social. L'arbre de composants pourrait ressembler à ceci :

```
App
├── Navbar
│   ├── Logo
│   └── UserMenu          ← doit connaître l'utilisateur connecté
│       └── Avatar
├── MainLayout
│   ├── Sidebar
│   │   └── ProfileCard   ← doit aussi connaître l'utilisateur connecté
│   └── Feed
│       ├── PostList
│       │   └── PostCard
│       │       └── LikeButton  ← doit savoir si l'utilisateur a déjà liké
│       └── NewPostForm         ← doit connaître l'auteur (utilisateur connecté)
└── Footer
```

Ici, plusieurs composants ont besoin d'accéder aux mêmes données : l'utilisateur actuellement connecté, la liste des posts, etc. Comment faire circuler ces données ?

---

## 2. Le prop drilling : quand ça devient pénible

### La solution naïve : passer les props de parent en enfant

La première approche qui vient à l'esprit est de stocker l'état dans le composant parent le plus proche commun aux composants qui en ont besoin, puis de le **passer en props** à travers l'arbre.

```tsx
// App.tsx — le composant racine stocke l'utilisateur
const App = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  return (
    <MainLayout currentUser={currentUser} />
  );
};

// MainLayout.tsx — reçoit currentUser... uniquement pour le transmettre
const MainLayout = ({ currentUser }: { currentUser: User | null }) => {
  return (
    <div>
      <Sidebar currentUser={currentUser} />
      <Feed currentUser={currentUser} />
    </div>
  );
};

// Sidebar.tsx — reçoit currentUser... uniquement pour le transmettre
const Sidebar = ({ currentUser }: { currentUser: User | null }) => {
  return <ProfileCard currentUser={currentUser} />;
};

// ProfileCard.tsx — enfin ! Ce composant utilise réellement currentUser
const ProfileCard = ({ currentUser }: { currentUser: User | null }) => {
  return <div>{currentUser?.username}</div>;
};
```

Ce phénomène s'appelle le **prop drilling** (forage de props) : on fait passer une donnée à travers plusieurs niveaux de composants intermédiaires qui n'en ont pas besoin eux-mêmes, juste pour qu'elle arrive à destination.

### Pourquoi c'est problématique

**Sur le plan de la maintenabilité :** Si la forme de l'objet `User` change, ou si un nouveau composant profondément imbriqué a besoin de `currentUser`, il faut modifier toute la chaîne intermédiaire, même les composants qui ne font que "faire passer" la donnée.

**Sur le plan de la lisibilité :** Les composants intermédiaires (`MainLayout`, `Sidebar`) se retrouvent avec des props dont ils ne se servent pas, ce qui rend leur interface difficile à comprendre.

**Sur le plan du couplage :** `MainLayout` et `Sidebar` sont désormais couplés à la notion d'utilisateur connecté, alors qu'ils n'ont aucune raison métier de l'être. Cela viole le principe de responsabilité unique.

**En pratique :** imaginez que `LikeButton` (situé à 5 niveaux de profondeur) ait besoin de l'utilisateur pour vérifier s'il a déjà liké un post. Il faudrait faire descendre `currentUser` à travers `MainLayout → Feed → PostList → PostCard → LikeButton`. Cinq composants modifiés pour une seule donnée.

---

## 3. La solution : le Store Pattern

### Le principe

L'idée est simple : plutôt que de faire circuler l'état verticalement à travers l'arbre de composants, on le place dans un **contexte centralisé** — le **Store** — que n'importe quel composant peut venir consulter ou modifier directement, sans passer par ses parents.

```
               ┌──────────────────┐
               │   StoreContext   │
               │  (contexte React)│
               └────────┬─────────┘
          ┌─────────────┼─────────────┐
          │             │             │
     ┌────┴────┐  ┌─────┴──────┐  ┌──┴──────────┐
     │UserMenu │  │ProfileCard │  │NewPostForm  │
     └─────────┘  └────────────┘  └─────────────┘
```

Chaque composant qui a besoin de l'état peut l'obtenir directement via le contexte, sans dépendre de ses parents.

### Les trois responsabilités du Store

| Rôle | Description | Analogie MVC |
|---|---|---|
| **Contenir l'état** | Stocker les données de l'application | Le Modèle |
| **Exposer des actions** | Fournir des fonctions pour modifier l'état | Le Contrôleur |
| **Propager les changements** | Notifier les composants automatiquement | L'Observer / notifyAll() |

---

## 4. Parallèle avec le MVC classique

Si vous avez déjà implémenté le pattern MVC en JavaScript vanilla, cette architecture vous est en réalité déjà familière. Le Store Pattern n'introduit rien de fondamentalement nouveau : il adapte des concepts existants au contexte des interfaces à base de composants.

### Table de correspondance

| MVC classique | Store Pattern React | Rôle |
|---|---|---|
| **Modèle (M)** | **State dans le StoreContext** | Contient et gère l'état de l'application |
| **Contrôleur (C)** | **Actions** (fonctions exposées par le contexte) | Traitent les commandes et modifient l'état |
| **Vue (V)** | **Composants React** | Affichent l'état et déclenchent des actions |
| **notifyAll()** | **React re-rend automatiquement** | Propagent les changements aux vues abonnées |

### Le flux est identique

Dans votre MVC vanilla :

```
Utilisateur clique
       │
       ▼
   [ Vue ]  ──appelle──►  [ Contrôleur ]  ──modifie──►  [ Modèle ]
                                                              │
   [ Vue ]  ◄──notifyAll()────────────────────────────────────┘
  se met à jour
```

Dans le Store Pattern :

```
Utilisateur clique
       │
       ▼
[ Composant ]  ──appelle──►  [ Action du Store ]  ──modifie──►  [ État (useState) ]
                                                                        │
[ Composant ]  ◄──React re-rend automatiquement────────────────────────┘
  se re-rend
```

La différence clé : **React prend en charge la notification**. Lorsqu'un état dans le contexte change via `useState`, React re-rend automatiquement tous les composants qui consomment ce contexte. Plus besoin d'un mécanisme d'Observer manuel.

---

## 5. Implémentation concrète en TypeScript

### 5.1 Définir les types

```ts
// src/store/types.ts

export interface User {
  id: number;
  username: string;
  avatarUrl: string;
}

export interface Post {
  id: number;
  authorId: number;
  content: string;
  likes: number[];    // tableau des IDs des utilisateurs ayant liké
  createdAt: string;
}

export interface AppState {
  currentUser: User | null;
  posts: Post[];
}

// Les actions exposées par le Store
export interface StoreActions {
  login: (user: User) => void;
  logout: () => void;
  setPosts: (posts: Post[]) => void;
  addPost: (post: Post) => void;
  toggleLike: (postId: number) => void;
}

// Le contexte combine état + actions
export type StoreContextType = AppState & StoreActions;
```

### 5.2 Créer le StoreContext

Le Store est implémenté comme un **Context React**. Il encapsule l'état et les actions, et les rend accessibles à tous les composants enfants sans prop drilling.

```tsx
// src/store/StoreContext.tsx

import React, { createContext, useContext, useState } from 'react';
import { AppState, StoreContextType, User, Post } from './types';

// ─── Création du contexte ─────────────────────────────────────────────────────

const StoreContext = createContext<StoreContextType | null>(null);

// ─── État initial ─────────────────────────────────────────────────────────────

const initialState: AppState = {
  currentUser: null,
  posts: [],
};

// ─── Provider ─────────────────────────────────────────────────────────────────
// Le Provider est le composant qui "enveloppe" l'application et fournit
// le contexte à tous ses enfants. C'est lui qui détient le vrai état.

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(initialState.currentUser);
  const [posts, setPosts] = useState<Post[]>(initialState.posts);

  // ─── Actions ───────────────────────────────────────────────────────────────
  // Équivalent des méthodes de votre Contrôleur MVC.
  // Ce sont les seuls points d'entrée pour modifier l'état.

  const login = (user: User): void => {
    setCurrentUser(user);
  };

  const logout = (): void => {
    setCurrentUser(null);
  };

  const addPost = (post: Post): void => {
    setPosts((prev) => [post, ...prev]);
  };

  const toggleLike = (postId: number): void => {
    if (!currentUser) return;

    setPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post;

        const alreadyLiked = post.likes.includes(currentUser.id);
        const likes = alreadyLiked
          ? post.likes.filter((id) => id !== currentUser.id)
          : [...post.likes, currentUser.id];

        return { ...post, likes };
      })
    );
  };

  return (
    <StoreContext.Provider
      value={{
        // État
        currentUser,
        posts,
        // Actions
        login,
        logout,
        setPosts,
        addPost,
        toggleLike,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

// ─── Hook d'accès au Store ────────────────────────────────────────────────────
// Plutôt que d'appeler useContext(StoreContext) partout,
// on expose un hook dédié qui vérifie que le contexte est bien disponible.

export const useStore = (): StoreContextType => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore doit être utilisé à l'intérieur d'un <StoreProvider>");
  }
  return context;
};
```

### 5.3 Brancher le Provider sur l'application

Le `StoreProvider` doit envelopper l'ensemble de l'application pour que tous les composants aient accès au contexte. C'est aussi ici que l'on configure `react-router`.

```tsx
// src/main.tsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { StoreProvider } from './store/StoreContext';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <StoreProvider>   {/* Le Store enveloppe toute l'application */}
        <App />
      </StoreProvider>
    </BrowserRouter>
  </React.StrictMode>
);
```

### 5.4 Les appels API avec Suspense

Pour les appels API vers le serveur Symfony, on exploite **Suspense** pour gérer l'état de chargement de manière déclarative, sans avoir besoin d'un flag `isLoading` dans le Store.

Le principe repose sur une **promise "suspendue"** : on crée une ressource qui lance la requête et lève une exception tant que la promesse n'est pas résolue. React intercepte cette exception et affiche le `fallback` du `<Suspense>` le plus proche.

```ts
// src/store/createResource.ts
// Utilitaire générique pour créer une ressource compatible Suspense

type Status = 'pending' | 'success' | 'error';

export function createResource<T>(promise: Promise<T>) {
  let status: Status = 'pending';
  let result: T;
  let error: unknown;

  const suspender = promise.then(
    (data) => { status = 'success'; result = data; },
    (err)  => { status = 'error';   error  = err;  }
  );

  return {
    read(): T {
      if (status === 'pending') throw suspender;  // React intercepte → affiche le fallback
      if (status === 'error')   throw error;       // React intercepte → affiche l'ErrorBoundary
      return result;
    },
  };
}
```

```ts
// src/store/resources.ts
// Déclaration des ressources de l'application

import { createResource } from './createResource';
import { Post } from './types';

const API_BASE = 'https://api.mon-reseau-social.fr';

// La requête est lancée dès l'import du module — pas d'attente d'un événement
export const postsResource = createResource<Post[]>(
  fetch(`${API_BASE}/api/posts`).then((res) => res.json())
);
```

```tsx
// src/components/Feed/PostList.tsx
// Ce composant "lit" la ressource — React suspend automatiquement si elle n'est pas prête

import React from 'react';
import { postsResource } from '../../store/resources';
import { useStore } from '../../store/StoreContext';
import PostCard from './PostCard';

const PostList: React.FC = () => {
  const { setPosts } = useStore();

  // read() suspend le composant si les données ne sont pas encore arrivées.
  // Une fois résolue, on hydrate le Store pour que les autres composants y aient accès.
  const posts = postsResource.read();
  setPosts(posts);

  return (
    <ul>
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </ul>
  );
};

export default PostList;
```

```tsx
// src/components/Feed/Feed.tsx
// Le composant parent déclare le Suspense et son fallback

import React, { Suspense } from 'react';
import PostList from './PostList';

const Feed: React.FC = () => {
  return (
    <section>
      <Suspense fallback={<p>Chargement des posts...</p>}>
        {/* PostList sera suspendu tant que les posts ne sont pas chargés */}
        <PostList />
      </Suspense>
    </section>
  );
};

export default Feed;
```

> **Avantage de Suspense :** le composant `PostList` n'a pas besoin de gérer lui-même un état de chargement. Il se comporte comme si les données étaient toujours disponibles — c'est React qui gère l'affichage du fallback. Cela simplifie à la fois le Store (pas de `isLoading`) et les composants.

---

## 6. Utilisation dans les composants React

### 6.1 Le composant UserMenu

```tsx
// src/components/Navbar/UserMenu.tsx

import React from 'react';
import { useStore } from '../../store/StoreContext';

const UserMenu: React.FC = () => {
  // Accès direct au Store — aucune prop nécessaire
  const { currentUser, logout } = useStore();

  if (!currentUser) {
    return <a href="/login">Se connecter</a>;
  }

  return (
    <div className="user-menu">
      <img src={currentUser.avatarUrl} alt={currentUser.username} />
      <span>{currentUser.username}</span>
      {/* L'action est appelée directement — comme un appel au Contrôleur en MVC */}
      <button onClick={logout}>Déconnexion</button>
    </div>
  );
};

export default UserMenu;
```

### 6.2 Le composant ProfileCard (dans la Sidebar)

```tsx
// src/components/Sidebar/ProfileCard.tsx

import React from 'react';
import { useStore } from '../../store/StoreContext';

const ProfileCard: React.FC = () => {
  const { currentUser, posts } = useStore();

  if (!currentUser) return null;

  const userPostCount = posts.filter((post) => post.authorId === currentUser.id).length;

  return (
    <div className="profile-card">
      <img src={currentUser.avatarUrl} alt={currentUser.username} />
      <h3>{currentUser.username}</h3>
      <p>{userPostCount} publication(s)</p>
    </div>
  );
};

export default ProfileCard;
```

> `ProfileCard` accède directement au Store. `Sidebar` et `MainLayout` n'ont **aucune prop à transmettre** — ils sont libérés de toute responsabilité vis-à-vis de la propagation des données.

### 6.3 Le composant LikeButton (5 niveaux de profondeur)

```tsx
// src/components/Feed/PostCard/LikeButton.tsx

import React from 'react';
import { useStore } from '../../../store/StoreContext';

interface LikeButtonProps {
  postId: number;
  likes: number[];
}

const LikeButton: React.FC<LikeButtonProps> = ({ postId, likes }) => {
  const { currentUser, toggleLike } = useStore();

  const hasLiked = currentUser ? likes.includes(currentUser.id) : false;

  return (
    <button
      onClick={() => toggleLike(postId)}
      disabled={!currentUser}
      className={hasLiked ? 'liked' : ''}
    >
      {hasLiked ? '❤️' : '🤍'} {likes.length}
    </button>
  );
};

export default LikeButton;
```

### 6.4 Le composant NewPostForm

```tsx
// src/components/Feed/NewPostForm.tsx

import React, { useState } from 'react';
import { useStore } from '../../store/StoreContext';

const API_BASE = 'https://api.mon-reseau-social.fr';

const NewPostForm: React.FC = () => {
  const { currentUser, addPost } = useStore();
  const [content, setContent] = useState('');

  if (!currentUser) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    // Appel à l'API Symfony
    const response = await fetch(`${API_BASE}/api/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, authorId: currentUser.id }),
    });
    const newPost = await response.json();

    addPost(newPost);  // On hydrate le Store avec la réponse du serveur
    setContent('');
  };

  return (
    <div className="new-post-form">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={`Quoi de neuf, ${currentUser.username} ?`}
      />
      <button onClick={handleSubmit} disabled={!content.trim()}>
        Publier
      </button>
    </div>
  );
};

export default NewPostForm;
```

### 6.5 Initialisation au démarrage

```tsx
// src/App.tsx

import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useStore } from './store/StoreContext';
import Navbar from './components/Navbar/Navbar';
import Feed from './components/Feed/Feed';
import ProfilePage from './pages/ProfilePage';

const App: React.FC = () => {
  const { login } = useStore();

  // Simulation de la récupération de l'utilisateur connecté (ex: depuis un token JWT)
  React.useEffect(() => {
    login({
      id: 1,
      username: 'alice',
      avatarUrl: 'https://exemple.fr/avatars/alice.jpg',
    });
  }, []);

  return (
    <div className="app">
      <Navbar />  {/* Pas de props — accède au Store directement */}
      <main>
        <Routes>
          <Route
            path="/"
            element={
              <Suspense fallback={<p>Chargement...</p>}>
                <Feed />
              </Suspense>
            }
          />
          <Route path="/profile/:id" element={<ProfilePage />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
```

---

## 7. Récapitulatif et bonnes pratiques

### Structure des fichiers suggérée

```
src/
├── store/
│   ├── types.ts            ← Types TypeScript (User, Post, AppState…)
│   ├── StoreContext.tsx     ← Contexte, Provider, actions, hook useStore
│   └── createResource.ts   ← Utilitaire Suspense pour les appels API
├── components/
│   └── ...
└── pages/
    └── ...
```

### Le flux complet en un schéma

```
┌─────────────────────────────────────────────┐
│               StoreProvider                 │
│                                             │
│  state: { currentUser, posts }              │
│  actions: { login, logout, addPost, ... }   │
│                                             │
│  ┌──────────┐  ┌─────────────┐  ┌────────┐ │
│  │ UserMenu │  │ ProfileCard │  │PostList│ │
│  │useStore()│  │ useStore()  │  │useStore│ │
│  └────┬─────┘  └──────┬──────┘  └───┬────┘ │
│       │               │             │      │
│    logout()        lecture       addPost() │
│       │               │             │      │
│       └───────────────▼─────────────┘      │
│               useState() → re-render       │
└─────────────────────────────────────────────┘
```

### Bonnes pratiques à retenir

**Ne jamais modifier l'état directement.** Toujours passer par une action du Store. C'est l'équivalent de ne jamais modifier le Modèle depuis la Vue en MVC.

**Toujours créer un nouvel objet lors des modifications de tableaux** (`[...prev, newItem]`, `prev.filter(...)`, `prev.map(...)`). React détecte les changements par comparaison de références — muter un tableau existant ne déclencherait pas de re-rendu.

**Garder les composants sans logique métier.** Ils appellent des actions et lisent l'état, c'est tout. La logique reste dans les actions du Store.

**Positionner `<Suspense>` au plus près des composants concernés.** Un Suspense placé trop haut dans l'arbre afficherait un fallback qui masque des parties de l'interface qui n'ont pas besoin d'attendre.

---

### Pour aller plus loin

Une fois ce pattern bien assimilé, vous comprendrez naturellement pourquoi des bibliothèques comme **Redux Toolkit** ou **Zustand** existent : elles fournissent ce même mécanisme, avec en plus des outils de debugging avancés et des optimisations de performance. Mais le principe fondamental reste exactement celui que vous venez d'implémenter.
