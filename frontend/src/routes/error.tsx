import { useRouteError, isRouteErrorResponse, Link } from "react-router-dom";

export default function ErrorPage() {
  const error = useRouteError();

  const message = isRouteErrorResponse(error)
    ? `${error.status} — ${error.statusText}`
    : error instanceof Error
      ? error.message
      : "Une erreur inattendue s'est produite.";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-6 text-center">
      <h1 className="font-poppins text-2xl font-bold text-text">Oups !</h1>
      <p className="font-poppins text-text-muted">{message}</p>
      <Link
        to="/"
        className="font-poppins text-primary underline hover:opacity-80"
      >
        Retour à l'accueil
      </Link>
    </main>
  );
}
