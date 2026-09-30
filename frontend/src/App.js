import { useEffect, useState, useCallback } from "react";
import "@/App.css";
import { Toaster } from "sonner";
import { Navbar } from "@/components/Navbar";
import { IdentityDialog } from "@/components/IdentityDialog";
import { CreateTrainingDialog } from "@/components/CreateTrainingDialog";
import { TrainingCard } from "@/components/TrainingCard";
import { Dashboard } from "@/components/Dashboard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { api } from "@/lib/api";
import { loadIdentity, saveIdentity, isPast } from "@/lib/identity";
import { toast } from "sonner";

const HERO = "https://images.unsplash.com/photo-1758683658297-d7c2512dcb0a?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njl8MHwxfHNlYXJjaHwzfHxydW5uZXJzJTIwdHJhaWwlMjBydW5uaW5nJTIwbWFyYXRob24lMjBncm91cHxlbnwwfHx8fDE3OTA4MDAwMjl8MA&ixlib=rb-4.1.0&q=85";

export default function App() {
  const [identity, setIdentity] = useState(loadIdentity());
  const [identityOpen, setIdentityOpen] = useState(!loadIdentity());
  const [view, setView] = useState("events");
  const [trainings, setTrainings] = useState([]);
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [tab, setTab] = useState("upcoming");

  const refresh = useCallback(() => {
    api.listTrainings().then(setTrainings).catch(() => {});
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const onSavedIdentity = (id) => { setIdentity(id); saveIdentity(id); };

  const guard = () => {
    if (!identity) { setIdentityOpen(true); return false; }
    return true;
  };

  const onJoin = async (t) => {
    if (!guard()) return;
    setBusyId(t.id);
    try {
      await api.join(t.id, identity.name, identity.email);
      toast.success(`Prihlásený na "${t.title}"`);
      refresh();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Prihlásenie zlyhalo");
    } finally { setBusyId(null); }
  };

  const onLeave = async (t) => {
    if (!guard()) return;
    setBusyId(t.id);
    try {
      await api.leave(t.id, identity.name, identity.email);
      toast.success(`Odhlásený z "${t.title}"`);
      refresh();
    } catch (e) {
      toast.error("Odhlásenie zlyhalo");
    } finally { setBusyId(null); }
  };

  const filtered = trainings
    .filter((t) => (tab === "upcoming" ? !isPast(t.date) : isPast(t.date)))
    .filter((t) => {
      const q = search.toLowerCase();
      return !q || t.title.toLowerCase().includes(q) || t.location.toLowerCase().includes(q);
    });

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <Toaster position="top-center" theme="dark" richColors />
      <Navbar identity={identity} view={view} setView={setView} onEditIdentity={() => setIdentityOpen(true)} />

      <IdentityDialog open={identityOpen} onOpenChange={setIdentityOpen} onSaved={onSavedIdentity} initial={identity} />

      {view === "events" ? (
        <>
          <header className="relative overflow-hidden border-b border-border">
            <img src={HERO} alt="Bežci" className="absolute inset-0 w-full h-full object-cover opacity-25" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/30" />
            <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
              <p className="font-mono-t text-xs uppercase tracking-widest text-primary mb-3 animate-fade-up">Bežecká komunita</p>
              <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight max-w-2xl animate-fade-up" style={{ animationDelay: "60ms" }}>
                Objav bežeckú komunitu a pridaj sa na <span className="text-primary">bežecké tréningy</span>
              </h1>
              <p className="text-muted-foreground mt-4 max-w-xl animate-fade-up" style={{ animationDelay: "120ms" }}>
                Vytváraj tréningy, registruj sa jedným klikom a sleduj, koľkých behov si sa zúčastnil.
              </p>
              <div className="mt-8 animate-fade-up" style={{ animationDelay: "180ms" }}>
                <CreateTrainingDialog identity={identity} onCreated={refresh} />
              </div>
            </div>
          </header>

          <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="inline-flex rounded-lg border border-border p-1 bg-card">
                <Button size="sm" variant={tab === "upcoming" ? "secondary" : "ghost"} onClick={() => setTab("upcoming")} data-testid="tab-upcoming" className="font-semibold">Nadchádzajúce</Button>
                <Button size="sm" variant={tab === "past" ? "secondary" : "ghost"} onClick={() => setTab("past")} data-testid="tab-past" className="font-semibold">Minulé</Button>
              </div>
              <div className="relative sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} data-testid="search-input" placeholder="Hľadať tréning alebo miesto..." className="pl-9 bg-card border-border" />
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground" data-testid="empty-state">
                Žiadne tréningy. {tab === "upcoming" && "Vytvor prvý!"}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filtered.map((t, i) => (
                  <TrainingCard key={t.id} training={t} identity={identity} onJoin={onJoin} onLeave={onLeave} busy={busyId === t.id} index={i} />
                ))}
              </div>
            )}
          </main>
        </>
      ) : (
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          {identity ? <Dashboard identity={identity} /> : (
            <div className="text-center py-20">
              <p className="text-muted-foreground mb-4">Najprv zadaj svoj profil.</p>
              <Button onClick={() => setIdentityOpen(true)} className="bg-primary text-primary-foreground font-bold">Zadať profil</Button>
            </div>
          )}
        </main>
      )}

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground font-mono-t">
        RunPulse — Bežecké tréningy & udalosti
      </footer>
    </div>
  );
}
