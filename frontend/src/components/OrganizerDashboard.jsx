import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, MapPin, Calendar, Trophy, ClipboardList, Ticket, UsersRound, RotateCcw, Plus } from "lucide-react";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/identity";
import { toast } from "sonner";

const AdjustPermanentkaDialog = ({ runner, identity, onDone, index }) => {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const n = parseInt(amount, 10);
    if (!n) { toast.error("Zadaj počet tréningov"); return; }
    setLoading(true);
    try {
      await api.adjustPermanentka(identity.email, runner.email, n);
      toast.success(`${n > 0 ? "Pridané" : "Odpočítané"} ${Math.abs(n)} do permanentky — ${runner.name}`);
      setAmount(""); setOpen(false); onDone();
    } catch {
      toast.error("Úprava zlyhala");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" data-testid={`org-adjust-perm-${index}`} className="border-border font-semibold text-xs">
          <Plus className="h-3.5 w-3.5 mr-1" /> Pridať
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border sm:max-w-sm" data-testid={`org-adjust-dialog-${index}`}>
        <DialogHeader>
          <DialogTitle className="font-heading uppercase tracking-tight">Pridať do permanentky</DialogTitle>
          <DialogDescription>
            Pridaj počet tréningov do permanentky pre <span className="text-foreground font-semibold">{runner.name}</span> (napr. zo starej papierovej permanentky). Záporné číslo odpočíta.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label>Počet tréningov</Label>
          <Input type="number" data-testid={`org-adjust-input-${index}`} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="napr. 4" />
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={loading} data-testid={`org-adjust-confirm-${index}`} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
            {loading ? "Ukladám..." : "Pridať"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const OrganizerDashboard = ({ identity }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(null);

  const load = useCallback(() => {
    if (!identity?.email) return;
    api.adminReport(identity.email).then((d) => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, [identity]);

  useEffect(() => { setLoading(true); load(); }, [load]);

  const handleReset = async (runner) => {
    setResetting(runner.email);
    try {
      await api.resetPermanentka(identity.email, runner.email);
      toast.success(`Permanentka pre ${runner.name} bola vynulovaná`);
      load();
    } catch {
      toast.error("Vynulovanie zlyhalo");
    } finally {
      setResetting(null);
    }
  };

  if (loading) return <div className="text-muted-foreground py-20 text-center">Načítavam...</div>;

  const trainings = data?.trainings || [];
  const runners = data?.runners || [];
  const totalRegistrations = trainings.reduce((s, t) => s + t.participants.length, 0);

  return (
    <div className="space-y-8">
      <div>
        <p className="font-mono-t text-xs uppercase tracking-widest text-primary mb-1">Organizátor</p>
        <h2 className="font-heading text-3xl sm:text-4xl font-black uppercase tracking-tight flex items-center gap-3">
          <ClipboardList className="h-8 w-8 text-primary" /> Dashboard
        </h2>
        <p className="text-muted-foreground mt-2">Klikni na tréning a zobraz zoznam prihlásených bežcov.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Card className="bg-card border-border p-5 rounded-xl" data-testid="org-stat-trainings">
          <div className="font-heading text-3xl font-black">{trainings.length}</div>
          <div className="text-xs text-muted-foreground uppercase tracking-wide font-mono-t mt-1">Tréningov</div>
        </Card>
        <Card className="bg-card border-border p-5 rounded-xl" data-testid="org-stat-registrations">
          <div className="font-heading text-3xl font-black">{totalRegistrations}</div>
          <div className="text-xs text-muted-foreground uppercase tracking-wide font-mono-t mt-1">Registrácií spolu</div>
        </Card>
        <Card className="bg-card border-border p-5 rounded-xl" data-testid="org-stat-runners">
          <div className="font-heading text-3xl font-black">{runners.length}</div>
          <div className="text-xs text-muted-foreground uppercase tracking-wide font-mono-t mt-1">Bežcov spolu</div>
        </Card>
      </div>

      {/* Zoznam všetkých bežcov */}
      <Card className="bg-card border-border p-5 rounded-xl" data-testid="org-runners-card">
        <h3 className="font-heading text-lg font-bold uppercase tracking-tight mb-1 flex items-center gap-2">
          <UsersRound className="h-5 w-5 text-primary" /> Všetci bežci
        </h3>
        <p className="text-xs text-muted-foreground mb-4">Prehľad všetkých prihlásených bežcov, ich absolvované tréningy a stav permanentky.</p>
        {runners.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">Zatiaľ sa nikto neprihlásil.</p>
        ) : (
          <Table data-testid="org-runners-table">
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="w-10">#</TableHead>
                <TableHead>Meno</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-center">Absolvované</TableHead>
                <TableHead className="text-right">Permanentka</TableHead>
                <TableHead className="text-right">Akcia</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runners.map((r, i) => (
                <TableRow key={r.email} className="border-border" data-testid={`org-runner-${i}`}>
                  <TableCell className="text-muted-foreground font-mono-t">{i + 1}</TableCell>
                  <TableCell className="font-semibold">{r.name}</TableCell>
                  <TableCell className="text-muted-foreground">{r.email}</TableCell>
                  <TableCell className="text-center">
                    <Badge className="bg-primary/15 text-primary border border-primary/30 font-mono-t">
                      <Trophy className="h-3 w-3 mr-1" />{r.attended_count}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex flex-col items-end gap-0.5">
                      <Badge variant="outline" className="font-mono-t border-border" data-testid={`org-runner-perm-${i}`}>
                        <Ticket className="h-3 w-3 mr-1 text-accent" />{r.permanentka_stamps} z 10
                      </Badge>
                      <span className="text-[10px] text-muted-foreground font-mono-t">
                        ostáva {r.permanentka_remaining}{r.completed_cards > 0 ? ` · dokončené ${r.completed_cards}` : ""}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex gap-2 justify-end">
                    <AdjustPermanentkaDialog runner={r} identity={identity} onDone={load} index={i} />
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="outline" disabled={resetting === r.email || r.permanentka_stamps === 0} data-testid={`org-reset-perm-${i}`} className="border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/40 font-semibold text-xs">
                          <RotateCcw className="h-3.5 w-3.5 mr-1" /> Vynulovať
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-card border-border" data-testid={`org-reset-dialog-${i}`}>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="font-heading uppercase tracking-tight">Vynulovať permanentku?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Naozaj chceš vynulovať permanentku pre <span className="text-foreground font-semibold">{r.name}</span> ({r.email})?
                            Počítadlo sa nastaví na 0 z 10. Celkový počet absolvovaných tréningov ({r.attended_count}) ostáva zachovaný.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel data-testid={`org-reset-cancel-${i}`}>Zrušiť</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleReset(r)} data-testid={`org-reset-confirm-${i}`} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold">
                            Vynulovať
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {trainings.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">Zatiaľ žiadne tréningy.</div>
      ) : (
        <Accordion type="single" collapsible className="space-y-3">
          {trainings.map((t) => (
            <AccordionItem key={t.id} value={t.id} className="border border-border rounded-xl bg-card px-4" data-testid={`org-training-${t.id}`}>
              <AccordionTrigger className="hover:no-underline py-4" data-testid={`org-training-trigger-${t.id}`}>
                <div className="flex flex-1 items-center justify-between gap-3 pr-3">
                  <div className="text-left">
                    <div className="font-heading text-lg font-bold uppercase tracking-tight">{t.title}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(t.date)}</span>
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{t.location}</span>
                    </div>
                  </div>
                  <Badge variant="outline" className="font-mono-t text-xs border-border shrink-0">
                    <Users className="h-3 w-3 mr-1 text-primary" />{t.participants.length} / {t.capacity}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                {t.participants.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">Zatiaľ nikto prihlásený.</p>
                ) : (
                  <Table data-testid={`org-table-${t.id}`}>
                    <TableHeader>
                      <TableRow className="border-border hover:bg-transparent">
                        <TableHead className="w-10">#</TableHead>
                        <TableHead>Meno</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead className="text-right">Absolvované tréningy</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {t.participants.map((p, i) => (
                        <TableRow key={p.email} className="border-border" data-testid={`org-participant-${t.id}-${i}`}>
                          <TableCell className="text-muted-foreground font-mono-t">{i + 1}</TableCell>
                          <TableCell className="font-semibold">{p.name}</TableCell>
                          <TableCell className="text-muted-foreground">{p.email}</TableCell>
                          <TableCell className="text-right">
                            <Badge className="bg-primary/15 text-primary border border-primary/30 font-mono-t">
                              <Trophy className="h-3 w-3 mr-1" />{p.attended_count}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
};
