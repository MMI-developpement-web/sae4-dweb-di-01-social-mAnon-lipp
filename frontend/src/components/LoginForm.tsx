import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "./ui/Button";
import Input from "./ui/Input";
import { login } from "../lib/api";

export default function LoginForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await login({ email, password });
      
      // Store token in localStorage
      localStorage.setItem("auth_token", response.token);
      window.dispatchEvent(new Event("authTokenChanged"));
      
      // Redirect to home/feed
      navigate("/");
    } catch (error: any) {
      // Handle different error types
      if (error?.error === "Ce compte a été bloqué pour non respect des conditions d'utilisation") {
        setError("Ce compte a été bloqué pour non respect des conditions d'utilisation. Contactez l'administrateur pour plus d'informations.");
      } else {
        setError("Email ou mot de passe incorrect.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="flex form-container w-full max-w-80 flex-col rounded-2xl bg-surface px-6 py-11">
      <header className="flex flex-col gap-2">
        <h1 className="font-poppins text-xl font-bold text-text">
          Ravi de vous revoir
        </h1>
        <p className="font-poppins text-2xl font-medium leading-tight text-text">
          Faites briller votre feed.
        </p>
      </header>

      <form className="mt-24 flex flex-1 flex-col justify-between" onSubmit={handleSubmit} noValidate>
        <div className="flex flex-col gap-10">
          {error && (
            <div className="rounded-md bg-danger/10 p-3 text-sm text-danger font-poppins">
              {error}
            </div>
          )}
          
          <Input
            label="Saisissez votre e-mail"
            type="email"
            placeholder="Email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Saisissez votre mot de passe"
            type="password"
            placeholder="Mot de passe"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div className="flex flex-col gap-12">
          <p className="font-poppins text-xs text-text-muted">
            Pas de compte ?{" "}
            <Link to="/register" className="text-primary hover:underline">
              Inscrivez vous
            </Link>
          </p>
          <Button 
            type="submit" 
            variant="primary" 
            size="md" 
            className="w-full"
            disabled={isLoading || !email || !password}
          >
            {isLoading ? "Connexion..." : "Accéder à Lume"}
          </Button>
        </div>
      </form>
    </section>
  );
}
