import { useEffect, useState } from "react";
import { redirect } from "react-router-dom";
import Header from "../components/Header";
import NavBar from "../components/NavBar";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Checkbox from "../components/ui/Checkbox";
import { useStore } from "../store/StoreContext";
import Avatar from "../components/ui/Avatar";
import { updateReadOnly } from "../lib/api";

export function loader() {
  const token = localStorage.getItem("auth_token");
  if (!token) return redirect("/login");
  return null;
}

export default function Settings() {
  const { currentUser, blockedUsers, unblockUser, userProfiles, updateCurrentUser } = useStore();
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(60);
  const [readOnly, setReadOnly] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUnblocking, setIsUnblocking] = useState<number | null>(null);

  useEffect(() => {
    const enabled = localStorage.getItem("auto_refresh_enabled") === "true";
    const interval = parseInt(localStorage.getItem("auto_refresh_interval") || "60", 10);
    setAutoRefreshEnabled(enabled);
    setAutoRefreshInterval(interval);
    
    if (currentUser) {
      setReadOnly(currentUser.readOnly ?? false);
    }
  }, [currentUser]);

  const handleSaveRefresh = () => {
    localStorage.setItem("auto_refresh_enabled", autoRefreshEnabled ? "true" : "false");
    localStorage.setItem("auto_refresh_interval", autoRefreshInterval.toString());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReadOnlyChange = async (enabled: boolean) => {
    if (!currentUser) return;
    
    setIsSaving(true);
    setError("");
    try {
      await updateReadOnly(currentUser.id, enabled);
      setReadOnly(enabled);
      // ✅ Met à jour le Store global
      updateCurrentUser({ readOnly: enabled });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError("Erreur lors de la mise à jour du mode lecture seule");
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUnblock = async (userId: number) => {
    setIsUnblocking(userId);
    try {
      await unblockUser(userId);
    } catch (error) {
      console.error("Erreur lors du déblocage:", error);
    } finally {
      setIsUnblocking(null);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      <main className="max-w-2xl mx-auto px-5 py-5">
        <h1 className="text-2xl font-bold text-text mb-6">Paramètres</h1>

        <div className="bg-white rounded-lg border border-border-muted p-6">
          <h2 className="text-lg font-semibold text-text mb-4">Confidentialité du compte</h2>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Checkbox
                id="read_only"
                checked={readOnly}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleReadOnlyChange(e.target.checked)}
                disabled={isSaving}
              />
              <div className="flex-1">
                <label htmlFor="read_only" className="text-text cursor-pointer font-medium">
                  Compte en lecture seule
                </label>
                <p className="text-text-muted text-sm mt-1">
                  Lorsqu'activé, personne ne pourra commenter ou répondre à vos tweets
                </p>
              </div>
            </div>
          </div>

          {error && <p className="text-red-600 text-sm mt-2">⚠️ {error}</p>}
          {saved && <p className="text-green-600 text-sm mt-2">✓ Paramètres enregistrés</p>}
        </div>

        <div className="bg-white rounded-lg border border-border-muted p-6 mt-6">
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
            <Button onClick={handleSaveRefresh} variant="primary">
              Enregistrer
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-border-muted p-6 mt-6">
          <h2 className="text-lg font-semibold text-text mb-4">Utilisateurs bloqués</h2>
          {blockedUsers.size === 0 ? (
            <p className="text-text-muted text-sm">
              Vous n'avez bloqué aucun utilisateur.
            </p>
          ) : (
            <div className="space-y-3">
              {Array.from(blockedUsers).map((userId) => {
                const profile = userProfiles.get(userId);
                return (
                  <div
                    key={userId}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-border-muted"
                  >
                    <div className="flex items-center gap-3">
                      {profile && (
                        <>
                          <Avatar
                            src={profile.profilePicture}
                            alt={profile.username}
                            size="sm"
                          />
                          <div>
                            <p className="font-semibold text-text">{profile.username}</p>
                            {profile.bio && (
                              <p className="text-text-muted text-xs line-clamp-1">
                                {profile.bio}
                              </p>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                    <Button
                      onClick={() => handleUnblock(userId)}
                      disabled={isUnblocking === userId}
                      variant="outline"
                      size="sm"
                    >
                      {isUnblocking === userId ? "..." : "Débloquer"}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <NavBar />
    </div>
  );
}
