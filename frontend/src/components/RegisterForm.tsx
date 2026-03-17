import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "./ui/Button";
import Input from "./ui/Input";
import PasswordStrengthIndicator from "./PasswordStrengthIndicator";
import { register } from "../lib/api";

export default function RegisterForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (email: string): string => {
    if (!email) return "L'email est obligatoire";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return "L'email n'est pas valide";
    return "";
  };

  const validateUsername = (username: string): string => {
    if (!username) return "Le nom d'utilisateur est obligatoire";
    if (username.length < 3) return "Le nom d'utilisateur doit contenir au moins 3 caractères";
    if (username.length > 180) return "Le nom d'utilisateur ne peut pas dépasser 180 caractères";
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return "Le nom d'utilisateur ne peut contenir que des lettres, chiffres, tirets et underscores";
    }
    return "";
  };

  const validatePassword = (password: string): string => {
    if (!password) return "Le mot de passe est obligatoire";
    if (password.length < 8) return "Le mot de passe doit contenir au moins 8 caractères";
    if (!/(?=.*[a-z])/.test(password)) return "Le mot de passe doit contenir au moins une minuscule";
    if (!/(?=.*[A-Z])/.test(password)) return "Le mot de passe doit contenir au moins une majuscule";
    if (!/(?=.*\d)/.test(password)) return "Le mot de passe doit contenir au moins un chiffre";
    if (!/(?=.*[@$!%*?&])/.test(password)) {
      return "Le mot de passe doit contenir au moins un caractère spécial (@$!%*?&)";
    }
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGeneralError("");

    // Validate all fields
    const emailError = validateEmail(email);
    const usernameError = validateUsername(username);
    const passwordError = validatePassword(password);

    if (emailError || usernameError || passwordError) {
      setErrors({
        email: emailError,
        username: usernameError,
        password: passwordError,
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await register({ email, username, password });
      
      // Store token in localStorage
      localStorage.setItem("auth_token", response.token);
      
      // Redirect to home/feed
      navigate("/");
    } catch (err: any) {
      setGeneralError(err?.error || "Une erreur est survenue lors de l'inscription");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="flex form-container w-full max-w-80 flex-col rounded-2xl bg-surface px-6 py-11">
      <header className="flex flex-col gap-2">
        <h1 className="font-poppins text-xl font-bold text-text">
          Bienvenue
        </h1>
        <p className="font-poppins text-2xl font-medium leading-tight text-text">
          Inscrivez-vous pour faire rayonner vos idées.
        </p>
      </header>
      <form className="mt-24 flex flex-1 flex-col justify-between" onSubmit={handleSubmit} noValidate>
        <div className="flex flex-col gap-10">
          {generalError && (
            <div className="rounded-md bg-danger/10 p-3 text-sm text-danger font-poppins">
              {generalError}
            </div>
          )}
          
          <Input
            label="Saisissez votre e-mail"
            type="email"
            placeholder="Email"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setErrors((prev) => ({ ...prev, email: "" }));
            }}
            error={errors.email}
            required
          />
          <Input
            label="Nom d'utilisateur"
            type="text"
            placeholder="Nom d'utilisateur"
            autoComplete="username"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setErrors((prev) => ({ ...prev, username: "" }));
            }}
            error={errors.username}
            required
          />
          <div className="flex flex-col gap-2">
            <Input
              label="Saisissez votre mot de passe"
              type="password"
              placeholder="Mot de passe"
              autoComplete="new-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrors((prev) => ({ ...prev, password: "" }));
              }}
              error={errors.password}
              required
            />
            <PasswordStrengthIndicator password={password} />
          </div>
        </div>

        <div className="flex flex-col gap-12">
          <p className="font-poppins text-xs text-text-muted">
            Déjà inscrit ?{" "}
            <Link to="/login" className="text-primary hover:underline">
              Connectez-vous
            </Link>
          </p>
          <Button 
            type="submit" 
            variant="primary" 
            size="md" 
            className="w-full"
            disabled={isLoading || !email || !username || !password}
          >
            {isLoading ? "Inscription..." : "Explorer Lume"}
          </Button>
        </div>
      </form>
    </section>
  );
}
