import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Trophy, CalendarClock, Route, MapPin, Calendar } from "lucide-react";
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

  useEffect(() => {
    if (!identity?.email) return;
    setLoading(true);
    api.dashboard(identity.email).then((d) => { setData(d); setLoading(false); });
  }, [identity]);

  if (loading || !data) return <div className="text-muted-foreground py-20 text-center">Načítavam...</div>;

  return (
    <div className="space-y-8">
      <div>
        <p className="font-mono-t text-xs uppercase tracking-widest text-primary mb-1">Moja účasť</p>
        <h2 className="font-heading text-3xl sm:text-4xl font-black uppercase tracking-tight">Ahoj, {identity.name}</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={Trophy} label="Absolvované tréningy" value={data.attended_count} testId="stat-attended" accent="bg-primary/15 text-primary" />
        <StatCard icon={CalendarClock} label="Nadchádzajúce" value={data.upcoming_count} testId="stat-upcoming" accent="bg-accent/15 text-accent" />
        <StatCard icon={Route} label="Celkom km" value={data.total_km} testId="stat-km" accent="bg-emerald-500/15 text-emerald-400" />
      </div>

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
    </div>
  );
};
