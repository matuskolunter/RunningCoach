import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trophy, CalendarClock, Route, MapPin, Calendar, Ticket, PartyPopper, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/identity";

const StatCard = ({ icon: Icon, label, value, testId, accent }) => (
  <Card className="bg-card border-border p-5 rounded-xl" data-testid={testId}>
    <div className="flex items-center gap-3">
      <div className={`h-11 w-11 rounded-lg flex items-center justify-center ${accent}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="font-heading text-3xl font-black leading-none">{value}</div>
        <div className="text-xs text-muted-foreground uppercase tracking-wide font-mono-t mt-1">{label}</div>
      </div>
    </div>
  </Card>
);

const Row = ({ t }) => (
  <div className="flex items-center justify-between py-3 border-b border-border last:border-0" data-testid={`dash-training-${t.id}`}>
    <div>
      <div className="font-semibold">{t.title}</div>
      <div className="text-xs text-muted-foreground flex items-center gap-3 mt-1">
        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(t.date)}</span>
        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{t.location}</span>
      </div>
    </div>
    <span className="font-mono-t text-sm text-primary shrink-0">{t.distance_km} km</span>
  </div>
);

export const Dashboard = ({ identity }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [celebrate, setCelebrate] = useState(false);

  useEffect(() => {
    if (!identity?.email) return;
    setLoading(true);
    api.dashboard(identity.email).then((d) => { setData(d); setLoading(false); });
  }, [identity]);

  const attended = data?.attended_count || 0;
  const permanentka = data?.permanentka_count || 0;
  const stamps = permanentka === 0 ? 0 : ((permanentka - 1) % 10) + 1; // 1..10
  const completedCards = Math.floor(permanentka / 10);

  // Show celebration once per completed card (per runner)
  useEffect(() => {
    if (!data || stamps !== 10 || !identity?.email) return;
    const key = `perm_celebrated_${identity.email}_${completedCards}`;
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, "1");
      setCelebrate(true);
    }
  }, [data, stamps, completedCards, identity]);

  if (loading || !data) return <div className="text-muted-foreground py-20 text-center">Načítavam...</div>;

  return (
    <div className="space-y-8">
      <div>
        <p className="font-mono-t text-xs uppercase tracking-widest text-primary mb-1">Moja účasť</p>
        <h2 className="font-heading text-3xl sm:text-4xl font-black uppercase tracking-tight">Ahoj, {identity.name}</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={Trophy} label="Absolvované tréningy" value={attended} testId="stat-attended" accent="bg-primary/15 text-primary" />
        <StatCard icon={CalendarClock} label="Nadchádzajúce" value={data.upcoming_count} testId="stat-upcoming" accent="bg-accent/15 text-accent" />
        <StatCard icon={Route} label="Celkom km" value={data.total_km} testId="stat-km" accent="bg-emerald-500/15 text-emerald-400" />
      </div>

      {/* Permanentka */}
      <Card className="bg-card border-border p-6 rounded-xl relative overflow-hidden" data-testid="permanentka-card">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
              <Ticket className="h-5 w-5" />
            </div>
            <div>
              <div className="font-heading text-xl font-bold uppercase tracking-tight">Permanentka</div>
              <div className="text-xs text-muted-foreground font-mono-t mt-0.5">
                {completedCards > 0 ? `Dokončené permanentky: ${completedCards}` : "Nazbieraj 10 tréningov"}
              </div>
            </div>
          </div>
          <div className="font-heading text-3xl font-black text-primary" data-testid="permanentka-count">{stamps} z 10</div>
        </div>

        <div className="grid grid-cols-10 gap-2">
          {Array.from({ length: 10 }).map((_, i) => {
            const filled = i < stamps;
            return (
              <div
                key={i}
                data-testid={`permanentka-stamp-${i + 1}`}
                className={`aspect-square rounded-lg border flex items-center justify-center transition-all ${
                  filled ? "bg-primary border-primary text-primary-foreground" : "bg-secondary border-border text-muted-foreground/40"
                }`}
              >
                {filled ? <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" /> : <span className="text-xs font-mono-t">{i + 1}</span>}
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border p-5 rounded-xl">
          <h3 className="font-heading text-lg font-bold uppercase tracking-tight mb-3 flex items-center gap-2"><CalendarClock className="h-5 w-5 text-accent" /> Nadchádzajúce tréningy</h3>
          {data.upcoming.length === 0 ? <p className="text-sm text-muted-foreground py-4">Zatiaľ nie si prihlásený na žiadny tréning.</p> : data.upcoming.map((t) => <Row key={t.id} t={t} />)}
        </Card>
        <Card className="bg-card border-border p-5 rounded-xl">
          <h3 className="font-heading text-lg font-bold uppercase tracking-tight mb-3 flex items-center gap-2"><Trophy className="h-5 w-5 text-primary" /> Absolvované tréningy</h3>
          {data.past.length === 0 ? <p className="text-sm text-muted-foreground py-4">Zatiaľ žiadne absolvované tréningy.</p> : data.past.map((t) => <Row key={t.id} t={t} />)}
        </Card>
      </div>

      <Dialog open={celebrate} onOpenChange={setCelebrate}>
        <DialogContent className="sm:max-w-md bg-card border-border text-center" data-testid="permanentka-dialog">
          <DialogHeader>
            <div className="mx-auto h-16 w-16 rounded-full bg-primary/15 text-primary flex items-center justify-center mb-2">
              <PartyPopper className="h-8 w-8" />
            </div>
            <DialogTitle className="font-heading text-2xl uppercase tracking-tight">Gratulujeme! 🎉</DialogTitle>
            <DialogDescription className="text-base">
              Dosiahol si <span className="text-primary font-bold">10 tréningov</span> a dokončil si permanentku!
              Tvoja permanentka sa teraz vynuluje a začínaš odznova od 1 z 10.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setCelebrate(false)} data-testid="permanentka-dialog-close" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-wide active:scale-95 transition-transform">
              Super, pokračujem!
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
