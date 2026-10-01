import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { MapPin, Calendar, Clock, Users, Flame, Gauge, CheckCircle2, Pencil, Trash2 } from "lucide-react";
import { formatDate, formatTime, isPast } from "@/lib/identity";

export const TrainingCard = ({ training, identity, onJoin, onLeave, busy, index = 0, isAdmin, onEdit, onDelete }) => {
  const joined = identity && training.participants.some((p) => p.email === identity.email);
  const full = training.participants.length >= training.capacity;
  const past = isPast(training.date);
  const fillPct = Math.min(100, Math.round((training.participants.length / training.capacity) * 100));

  return (
    <Card
      className="group relative overflow-hidden bg-card border-border p-5 rounded-xl transition-all hover:border-primary/50 animate-fade-up"
      style={{ animationDelay: `${index * 60}ms` }}
      data-testid={`training-card-${training.id}`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="font-heading text-xl font-bold uppercase tracking-tight leading-tight">{training.title}</h3>
        {past ? (
          <Badge variant="secondary" className="shrink-0 font-mono-t text-[10px]">Ukončené</Badge>
        ) : joined ? (
          <Badge className="shrink-0 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-mono-t text-[10px]">Prihlásený</Badge>
        ) : null}
      </div>

      <div className="space-y-2 text-sm text-muted-foreground mb-4">
        <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" /> {formatDate(training.date)}</div>
        <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> {formatTime(training.date)}</div>
        <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> {training.location}</div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <Badge variant="outline" className="font-mono-t text-xs border-border"><Flame className="h-3 w-3 mr-1 text-primary" />{training.distance_km} KM</Badge>
        {training.pace ? <Badge variant="outline" className="font-mono-t text-xs border-border"><Gauge className="h-3 w-3 mr-1 text-accent" />{training.pace}</Badge> : null}
        {training.use_permanentka === false ? <Badge variant="outline" className="font-mono-t text-xs border-border text-muted-foreground">FREE</Badge> : null}
      </div>

      {training.description ? <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{training.description}</p> : null}

      <div className="mb-4">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="flex items-center gap-1 text-muted-foreground"><Users className="h-3.5 w-3.5" /> Bežci</span>
          <span className="font-mono-t" data-testid={`participants-count-${training.id}`}>{training.participants.length} / {training.capacity}</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${fillPct}%` }} />
        </div>
      </div>

      {!past && (
        joined ? (
          <Button variant="outline" disabled={busy} onClick={() => onLeave(training)} data-testid={`leave-btn-${training.id}`} className="w-full border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/40 font-bold uppercase text-xs tracking-wide active:scale-95 transition-transform">
            Odhlásiť sa
          </Button>
        ) : (
          <Button disabled={busy || full} onClick={() => onJoin(training)} data-testid={`join-btn-${training.id}`} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase text-xs tracking-wide active:scale-95 transition-transform disabled:opacity-40">
            {full ? "Plná kapacita" : <><CheckCircle2 className="h-4 w-4 mr-1" /> Prihlásiť sa</>}
          </Button>
        )
      )}

      {isAdmin && (
        <div className="flex gap-2 mt-2 pt-3 border-t border-border">
          <Button size="sm" variant="outline" onClick={() => onEdit(training)} data-testid={`edit-btn-${training.id}`} className="flex-1 border-border font-semibold text-xs">
            <Pencil className="h-3.5 w-3.5 mr-1" /> Upraviť
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="outline" data-testid={`delete-btn-${training.id}`} className="flex-1 border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/40 font-semibold text-xs">
                <Trash2 className="h-3.5 w-3.5 mr-1" /> Odstrániť
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-card border-border" data-testid={`delete-dialog-${training.id}`}>
              <AlertDialogHeader>
                <AlertDialogTitle className="font-heading uppercase tracking-tight">Odstrániť tréning?</AlertDialogTitle>
                <AlertDialogDescription>
                  Naozaj chceš odstrániť tréning <span className="text-foreground font-semibold">{training.title}</span>? Táto akcia sa nedá vrátiť.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel data-testid={`delete-cancel-${training.id}`}>Zrušiť</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(training)} data-testid={`delete-confirm-${training.id}`} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold">
                  Odstrániť
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </Card>
  );
};
