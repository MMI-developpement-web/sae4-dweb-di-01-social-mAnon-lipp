/**
 * createResource — Suspense-enabled resource loading
 * 
 * Creates a resource that suspends rendering until data is loaded.
 * React catches the thrown promise and renders the nearest Suspense boundary's fallback.
 * 
 * @example
 * // Create resource at module level
 * const tweetsResource = createResource(fetchTweets(1, 20));
 * 
 * // In component: suspends until data ready
 * const tweets = tweetsResource.read();
 */

type Status = 'pending' | 'success' | 'error';

interface Resource<T> {
  read(): T;
}

/**
 * Create a resource that suspends React rendering while data loads.
 * 
 * The resource throws a promise while pending, so React's Suspense catches it.
 * Once resolved or errored, subsequent reads return or throw synchronously.
 */
export function createResource<T>(promise: Promise<T>): Resource<T> {
  let status: Status = 'pending';
  let result: T;
  let error: unknown;

  const suspender = promise
    .then(
      (data) => {
        status = 'success';
        result = data;
      },
      (err) => {
        status = 'error';
        error = err;
      }
    );

  return {
    read(): T {
      if (status === 'pending') {
        throw suspender;  // React catches this and renders Suspense fallback
      }
      if (status === 'error') {
        throw error;  // React catches this and renders ErrorBoundary
      }
      return result;
    },
  };
}
