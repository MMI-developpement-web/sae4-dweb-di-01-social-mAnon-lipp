/**
 * Suspense Integration Guide for Store Pattern
 * 
 * This file explains how to integrate React Suspense with the Store Pattern
 * for elegant async data loading without explicit loading states.
 */

// ─────────────────────────────────────────────────────────────────────────────
// PATTERN 1: Suspense at route level (Recommended for Router v6)
// ─────────────────────────────────────────────────────────────────────────────

import { Suspense } from 'react';
import Feed from './routes/feed';

/**
 * In main.tsx, wrap route elements with Suspense
 * The component suspends until the loader completes
 */
const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <Suspense fallback={<div>Chargement du fil...</div>}>
        <Feed />
      </Suspense>
    ),
    loader: feedLoader,
  },
]);

// ─────────────────────────────────────────────────────────────────────────────
// PATTERN 2: Suspense for nested components (for granular control)
// ─────────────────────────────────────────────────────────────────────────────

// src/components/TweetList.tsx

import { createResource } from '../store/createResource';
import { useStore } from '../store/StoreContext';

/**
 * Create a resource once at module load — this triggers the fetch immediately
 */
let tweetsResource: ReturnType<typeof createResource> | null = null;

function TweetList() {
  const { addTweet } = useStore();

  // Initialize resource on first render
  if (!tweetsResource) {
    tweetsResource = createResource(
      fetch('/api/tweets')
        .then((r) => r.json())
        .then((data) => data.tweets)
    );
  }

  // This call suspends the component until tweets are ready
  const tweets = tweetsResource.read();

  // Once data is ready, populate the Store
  useEffect(() => {
    tweets.forEach((tweet) => addTweet(tweet));
  }, [tweets, addTweet]);

  return (
    <div>
      {tweets.map((tweet) => (
        <TweetCard key={tweet.id} tweet={tweet} />
      ))}
    </div>
  );
}

/**
 * Parent component declares the Suspense boundary and fallback
 */
function Feed() {
  return (
    <section>
      <Suspense fallback={<p>Chargement des tweets...</p>}>
        <TweetList />  {/* Will suspend until tweets are loaded */}
      </Suspense>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PATTERN 3: Error boundaries (handle API failures)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Error boundaries catch thrown errors from Suspense resources
 */
class ErrorBoundary extends React.Component {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Failed to load resource', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div>Erreur lors du chargement. Veuillez rafraîchir.</div>;
    }

    return this.props.children;
  }
}

/**
 * Usage with both Suspense and ErrorBoundary
 */
function AppWithErrorHandling() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<div>Chargement...</div>}>
        <Feed />
      </Suspense>
    </ErrorBoundary>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ADVANTAGES over loading flags
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ❌ OLD WAY: Manual loading state
 * const [isLoading, setIsLoading] = useState(true);
 * const [tweets, setTweets] = useState([]);
 * 
 * useEffect(() => {
 *   fetch('/api/tweets')
 *     .then((r) => r.json())
 *     .then((data) => {
 *       setTweets(data);
 *       setIsLoading(false);  // Must manually track
 *     });
 * }, []);
 * 
 * if (isLoading) return <Spinner />;  // Manual loading UI
 * 
 * ✅ NEW WAY: Suspense
 * const tweets = resource.read();  // Automatically suspends
 * // Component doesn't need to know about loading
 */

// ─────────────────────────────────────────────────────────────────────────────
// Best practices
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 1. Position Suspense as close to the suspending component as possible
 *    (avoid one Suspense boundary at the top masking unrelated components)
 * 
 * 2. Create resources at module level (fetch once, share across renders)
 * 
 * 3. Combine with ErrorBoundary for production (catch API failures)
 * 
 * 4. Use React Router's built-in loader for page-level data
 *    (you don't need Suspense for that — loaders already handle it)
 * 
 * 5. Use Suspense for nested components that fetch their own data
 *    (keeps data fetching co-located with components)
 */
