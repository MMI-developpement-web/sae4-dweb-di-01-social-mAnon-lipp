import { Link } from "react-router-dom";
import Button from "./ui/Button";
import Input from "./ui/Input";

export default function RegisterForm() {
  return (
    <div className="flex min-h-[758px] w-full max-w-[326px] flex-col rounded-[40px] bg-surface px-6 py-11">
      <header className="flex flex-col gap-2">
        <h1 className="font-poppins text-[20px] font-bold text-text">
          Bienvenue
        </h1>
        <p className="font-poppins text-[24px] font-medium leading-tight text-text">
          Inscrivez-vous pour faire rayonner vos idées.
        </p>
      </header>
      <form className="mt-[88px] flex flex-1 flex-col justify-between" noValidate>
        <div className="flex flex-col gap-[38px]">
          <Input
            label="Saisissez votre e-mail"
            type="email"
            placeholder="Email"
            autoComplete="email"
          />
          <Input
            label="Nom d'utilisateur"
            type="text"
            placeholder="Nom d'utilisateur"
            autoComplete="username"
          />
          <Input
            label="Saisissez votre mot de passe"
            type="password"
            placeholder="Mot de passe"
            autoComplete="new-password"
          />
        </div>

        <div className="flex flex-col gap-[47px]">
          <p className="font-poppins text-[13px] text-text-muted">
            Déjà inscrit ?{" "}
            <Link to="/login" className="text-primary hover:underline">
              Connectez-vous
            </Link>
          </p>
          <Button type="submit" variant="primary" size="md" className="w-full">
            Explorer Lume
          </Button>
        </div>
      </form>
    </div>
  );
}
