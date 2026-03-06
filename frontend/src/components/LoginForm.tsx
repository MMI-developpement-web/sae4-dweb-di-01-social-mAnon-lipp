import { Link } from "react-router-dom";
import Button from "./ui/Button";
import Input from "./ui/Input";

export default function LoginForm() {
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

      <form className="mt-[88px] flex flex-1 flex-col justify-between" noValidate>
        <div className="flex flex-col gap-[38px]">
          <Input
            label="Saisissez votre e-mail"
            type="email"
            placeholder="Email"
            autoComplete="email"
          />
          <div className="flex flex-col gap-2">
            <Input
              label="Saisissez votre mot de passe"
              type="password"
              placeholder="Mot de passe"
              autoComplete="current-password"
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
          <Button type="submit" variant="primary" size="md" className="w-full">
            Accéder à Lume
          </Button>
        </div>
      </form>
    </div>
  );
}
