import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, MapPin, Calendar, Trophy, ClipboardList } from "lucide-react";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/identity";

export const OrganizerDashboard = ({ identity }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!identity?.email) return;
    setLoading(true);
    api.adminReport(identity.email).then((d) => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, [identity]);

  if (loading) return <div className="text-muted-foreground py-20 text-center">Načítavam...</div>;

  const trainings = data?.trainings || [];
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
      </div>

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
