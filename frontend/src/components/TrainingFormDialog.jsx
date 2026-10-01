import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { api } from "@/lib/api";
import { toast } from "sonner";

const empty = { title: "", date: "", time: "", location: "", distance_km: "", capacity: "", pace: "", description: "", use_permanentka: true };

function fromTraining(t) {
  if (!t) return empty;
  const d = new Date(t.date);
  const pad = (n) => String(n).padStart(2, "0");
  return {
    title: t.title || "",
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
    location: t.location || "",
    distance_km: String(t.distance_km ?? ""),
    capacity: String(t.capacity ?? ""),
    pace: t.pace || "",
    description: t.description || "",
    use_permanentka: t.use_permanentka !== false,
  };
}

export const TrainingFormDialog = ({ open, onOpenChange, identity, training, onSaved }) => {
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(false);
  const isEdit = !!training;

  useEffect(() => {
    if (open) setForm(fromTraining(training));
  }, [open, training]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.date || !form.time || !form.location || !form.distance_km || !form.capacity) {
      toast.error("Vyplň všetky povinné polia");
      return;
    }
    setLoading(true);
    try {
      const iso = new Date(`${form.date}T${form.time}`).toISOString();
      const base = {
        title: form.title,
        date: iso,
        location: form.location,
        distance_km: parseFloat(form.distance_km),
        capacity: parseInt(form.capacity, 10),
        pace: form.pace,
        description: form.description,
        use_permanentka: form.use_permanentka,
      };
      if (isEdit) {
        await api.updateTraining(training.id, { ...base, admin_email: identity?.email || "" });
        toast.success("Tréning upravený!");
      } else {
        await api.createTraining({ ...base, organizer_name: identity?.name || "", organizer_email: identity?.email || "" });
        toast.success("Tréning vytvorený!");
      }
      onOpenChange(false);
      onSaved();
    } catch {
      toast.error(isEdit ? "Nepodarilo sa upraviť tréning" : "Nepodarilo sa vytvoriť tréning");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card border-border max-h-[90vh] overflow-y-auto" data-testid="training-form-dialog">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl uppercase tracking-tight">{isEdit ? "Upraviť tréning" : "Nový tréning"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Názov *</Label>
            <Input data-testid="training-title-input" value={form.title} onChange={set("title")} placeholder="Ranný beh v parku" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Dátum *</Label>
              <Input type="date" data-testid="training-date-input" value={form.date} onChange={set("date")} />
            </div>
            <div className="space-y-2">
              <Label>Čas *</Label>
              <Input type="time" data-testid="training-time-input" value={form.time} onChange={set("time")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Miesto *</Label>
            <Input data-testid="training-location-input" value={form.location} onChange={set("location")} placeholder="Sad Janka Kráľa, Bratislava" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Vzdialenosť (km) *</Label>
              <Input type="number" step="0.1" data-testid="training-distance-input" value={form.distance_km} onChange={set("distance_km")} placeholder="10" />
            </div>
            <div className="space-y-2">
              <Label>Kapacita *</Label>
              <Input type="number" data-testid="training-capacity-input" value={form.capacity} onChange={set("capacity")} placeholder="15" />
            </div>
            <div className="space-y-2">
              <Label>Tempo</Label>
              <Input data-testid="training-pace-input" value={form.pace} onChange={set("pace")} placeholder="5:30/km" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Popis</Label>
            <Textarea data-testid="training-description-input" value={form.description} onChange={set("description")} placeholder="Voľný text o tréningu..." rows={3} />
          </div>
          <div className="flex items-start gap-3 rounded-lg border border-border bg-secondary/40 p-3">
            <Checkbox id="use-permanentka" data-testid="training-permanentka-checkbox" checked={form.use_permanentka} onCheckedChange={(v) => setForm((f) => ({ ...f, use_permanentka: !!v }))} className="mt-0.5" />
            <div className="space-y-1">
              <Label htmlFor="use-permanentka" className="cursor-pointer">Použiť permanentku</Label>
              <p className="text-xs text-muted-foreground">
                Ak je zakliknuté, účasť sa započíta do permanentky (X z 10). Pri free udalostiach nechaj nezaškrtnuté — započíta sa len do celkového počtu tréningov.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading} data-testid="submit-training-btn" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-wide active:scale-95 transition-transform">
              {loading ? "Ukladám..." : isEdit ? "Uložiť zmeny" : "Vytvoriť tréning"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
