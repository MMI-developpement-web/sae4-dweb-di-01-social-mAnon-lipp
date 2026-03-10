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
      
      // Redirect to home/feed
      navigate("/");
    } catch {
      setError("Email ou mot de passe incorrect.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[758px] w-full max-w-[326px] flex-col rounded-[40px] bg-surface px-6 py-11">
      <header className="flex flex-col gap-2">
        <h1 className="font-poppins text-[20px] font-bold text-text">
          Ravi de vous revoir
        </h1>
        <p className="font-poppins text-[24px] font-medium leading-tight text-text">
          Faites briller votre feed.
        </p>
      </header>

      <form className="mt-[88px] flex flex-1 flex-col justify-between" onSubmit={handleSubmit} noValidate>
        <div className="flex flex-col gap-[38px]">
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
          <div className="flex flex-col gap-2">
            <Input
              label="Saisissez votre mot de passe"
              type="password"
              placeholder="Mot de passe"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="font-poppins text-[11px] text-primary hover:underline"
              >
                Mot de passe oublié ?
              </Link>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-[47px]">
          <p className="font-poppins text-[13px] text-text-muted">
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
    </div>
  );
}
