import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Activity } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

export const IdentityDialog = ({ open, onOpenChange, onSaved, initial }) => {
  const [name, setName] = useState(initial?.name || "");
  const [email, setEmail] = useState(initial?.email || "");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error("Vyplň meno aj email");
      return;
    }
    setLoading(true);
    try {
      const user = await api.upsertUser(name.trim(), email.trim().toLowerCase());
      onSaved({ name: user.name, email: user.email });
      toast.success(`Vitaj, ${user.name}!`);
      onOpenChange(false);
    } catch (err) {
      toast.error("Nepodarilo sa uložiť. Skontroluj email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-border bg-card" data-testid="identity-dialog">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary mb-1">
            <Activity className="h-5 w-5" />
            <span className="font-mono-t text-xs uppercase tracking-widest">RunPulse</span>
          </div>
          <DialogTitle className="font-heading text-2xl uppercase tracking-tight">
            {initial ? "Upraviť profil" : "Kto beží?"}
          </DialogTitle>
          <DialogDescription>Zadaj meno a email. Bez hesla, jednoducho.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="id-name">Meno</Label>
            <Input id="id-name" data-testid="identity-name-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ján Bežec" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="id-email">Email</Label>
            <Input id="id-email" type="email" data-testid="identity-email-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jan@email.sk" />
          </div>
          <Button type="submit" disabled={loading} data-testid="identity-save-btn" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-wide active:scale-95 transition-transform">
            {loading ? "Ukladám..." : "Pokračovať"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
