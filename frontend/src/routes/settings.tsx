import { useEffect, useState } from "react";
import { redirect } from "react-router-dom";
import Header from "../components/Header";
import NavBar from "../components/NavBar";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Checkbox from "../components/ui/Checkbox";

export function loader() {
  const token = localStorage.getItem("auth_token");
  if (!token) return redirect("/login");
  return null;
}

export default function Settings() {
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(60);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const enabled = localStorage.getItem("auto_refresh_enabled") === "true";
    const interval = parseInt(localStorage.getItem("auto_refresh_interval") || "60", 10);
    setAutoRefreshEnabled(enabled);
    setAutoRefreshInterval(interval);
  }, []);

  const handleSave = () => {
    localStorage.setItem("auto_refresh_enabled", autoRefreshEnabled ? "true" : "false");
    localStorage.setItem("auto_refresh_interval", autoRefreshInterval.toString());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      <main className="max-w-2xl mx-auto px-5 py-5">
        <h1 className="text-2xl font-bold text-text mb-6">Paramètres</h1>

        <div className="bg-white rounded-lg border border-border-muted p-6">
          <h2 className="text-lg font-semibold text-text mb-4">Rafraîchissement du fil</h2>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Checkbox
                id="auto_refresh"
                checked={autoRefreshEnabled}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAutoRefreshEnabled(e.target.checked)}
              />
              <label htmlFor="auto_refresh" className="text-text cursor-pointer">
                Activer le rafraîchissement automatique
              </label>
            </div>

            {autoRefreshEnabled && (
              <div className="ml-6">
                <label htmlFor="interval" className="block text-sm text-text-muted mb-2">
                  Intervalle de rafraîchissement (en secondes)
                </label>
                <Input
                  id="interval"
                  type="number"
                  min={10}
                  max={300}
                  step={10}
                  value={autoRefreshInterval}
                  onChange={(e) =>
                    setAutoRefreshInterval(Math.max(10, parseInt(e.target.value) || 60))
                  }
                  className="w-32"
                />
              </div>
            )}
          </div>

          <div className="mt-6">
            <Button onClick={handleSave} variant="primary">
              Enregistrer
            </Button>
            {saved && <p className="text-green-600 text-sm mt-2">✓ Paramètres enregistrés</p>}
          </div>
        </div>
      </main>
      <NavBar />
    </div>
  );
}
