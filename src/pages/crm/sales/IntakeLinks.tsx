import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Copy, Plus, Link2 } from "lucide-react";

interface IntakeLink {
  id: string;
  token: string;
  label: string | null;
  active: boolean;
  created_at: string;
}

export default function IntakeLinks() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [links, setLinks] = useState<IntakeLink[]>([]);
  const [label, setLabel] = useState("");
  const [creating, setCreating] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from("intake_links")
      .select("id, token, label, active, created_at")
      .order("created_at", { ascending: false });
    setLinks(data ?? []);
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!user) return;
    setCreating(true);
    const { error } = await supabase.from("intake_links").insert({
      sales_rep_id: user.id,
      label: label.trim() || null,
    });
    setCreating(false);
    if (error) {
      toast({ title: "Could not create link", description: error.message, variant: "destructive" });
      return;
    }
    setLabel("");
    toast({ title: "Link created" });
    load();
  };

  const toggle = async (id: string, active: boolean) => {
    await supabase.from("intake_links").update({ active }).eq("id", id);
    load();
  };

  const formUrl = (token: string) => `${window.location.origin}/intake/${token}`;

  const copy = async (token: string) => {
    await navigator.clipboard.writeText(formUrl(token));
    toast({ title: "Link copied to clipboard" });
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><Link2 className="h-7 w-7" /> Intake Links</h1>
        <p className="text-muted-foreground mt-1">Generate a personal link to send to prospects. Submissions create leads assigned to you.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create new link</CardTitle>
          <CardDescription>Optionally label the link to remember the campaign or contact.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <Label htmlFor="label">Label (optional)</Label>
            <Input id="label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Tema expo, ACME enterprise" />
          </div>
          <Button onClick={create} disabled={creating} className="md:self-end">
            <Plus className="h-4 w-4 mr-2" /> Create link
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your links</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Label</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {links.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No links yet.</TableCell></TableRow>
              )}
              {links.map((l) => (
                <TableRow key={l.id}>
                  <TableCell>{l.label || <span className="text-muted-foreground">—</span>}</TableCell>
                  <TableCell className="font-mono text-xs truncate max-w-[280px]">{formUrl(l.token)}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{new Date(l.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch checked={l.active} onCheckedChange={(v) => toggle(l.id, v)} />
                      <Badge variant={l.active ? "default" : "secondary"}>{l.active ? "Active" : "Disabled"}</Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => copy(l.token)}>
                      <Copy className="h-4 w-4 mr-1" /> Copy
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}