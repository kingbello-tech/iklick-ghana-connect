import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Paperclip, Upload, Trash2, Download, Loader2 } from "lucide-react";
import { format } from "date-fns";

const MAX_BYTES = 1024 * 1024; // 1 MB

export type AttachmentEntity = "incident" | "incident_note" | "invoice" | "employee" | "site_survey" | "quotation";

type Row = {
  id: string;
  file_name: string;
  file_path: string;
  mime_type: string | null;
  size_bytes: number;
  uploaded_by: string | null;
  created_at: string;
};

interface Props {
  entityType: AttachmentEntity;
  entityId: string | null | undefined;
  title?: string;
  canUpload?: boolean;
  compact?: boolean;
}

export function Attachments({ entityType, entityId, title = "Attachments", canUpload = true, compact = false }: Props) {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    if (!entityId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("attachments")
      .select("*")
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .order("created_at", { ascending: false });
    if (!error) setRows((data || []) as Row[]);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [entityType, entityId]);

  const onPick = () => inputRef.current?.click();

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !entityId || !user) return;
    if (file.size > MAX_BYTES) {
      toast({ title: "File too large", description: "Attachments must be 1 MB or smaller.", variant: "destructive" });
      return;
    }
    setUploading(true);
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${entityType}/${entityId}/${crypto.randomUUID()}-${safeName}`;
    const { error: upErr } = await supabase.storage.from("attachments").upload(path, file, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });
    if (upErr) {
      setUploading(false);
      toast({ title: "Upload failed", description: upErr.message, variant: "destructive" });
      return;
    }
    const { error: insErr } = await supabase.from("attachments").insert({
      entity_type: entityType,
      entity_id: entityId,
      file_name: file.name,
      file_path: path,
      mime_type: file.type || null,
      size_bytes: file.size,
      uploaded_by: user.id,
    });
    setUploading(false);
    if (insErr) {
      await supabase.storage.from("attachments").remove([path]);
      toast({ title: "Save failed", description: insErr.message, variant: "destructive" });
      return;
    }
    toast({ title: "Attached", description: file.name });
    load();
  };

  const onDownload = async (row: Row) => {
    const { data, error } = await supabase.storage.from("attachments").createSignedUrl(row.file_path, 60);
    if (error || !data?.signedUrl) {
      toast({ title: "Download failed", description: error?.message || "Could not get URL", variant: "destructive" });
      return;
    }
    window.open(data.signedUrl, "_blank");
  };

  const onDelete = async (row: Row) => {
    if (!confirm(`Delete "${row.file_name}"?`)) return;
    const { error: dbErr } = await supabase.from("attachments").delete().eq("id", row.id);
    if (dbErr) { toast({ title: "Delete failed", description: dbErr.message, variant: "destructive" }); return; }
    await supabase.storage.from("attachments").remove([row.file_path]);
    toast({ title: "Deleted" });
    load();
  };

  const formatSize = (b: number) => b < 1024 ? `${b} B` : b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB` : `${(b / (1024 * 1024)).toFixed(2)} MB`;

  const body = (
    <div className="space-y-2">
      {loading ? (
        <div className="flex justify-center py-3"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
      ) : rows.length === 0 ? (
        <p className="text-xs text-muted-foreground">No attachments yet.</p>
      ) : (
        rows.map((r) => (
          <div key={r.id} className="flex items-center gap-2 p-2 rounded border border-border bg-muted/30">
            <Paperclip className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate">{r.file_name}</p>
              <p className="text-[10px] text-muted-foreground">{formatSize(r.size_bytes)} · {format(new Date(r.created_at), "MMM d, HH:mm")}</p>
            </div>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onDownload(r)}><Download className="h-3.5 w-3.5" /></Button>
            {(r.uploaded_by === user?.id || isAdmin) && (
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onDelete(r)}><Trash2 className="h-3.5 w-3.5" /></Button>
            )}
          </div>
        ))
      )}
      {canUpload && entityId && (
        <div className="pt-1">
          <input ref={inputRef} type="file" className="hidden" onChange={onFile} />
          <Button size="sm" variant="outline" onClick={onPick} disabled={uploading}>
            {uploading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Upload className="h-3.5 w-3.5 mr-1.5" />}
            Attach file
          </Button>
          <p className="text-[10px] text-muted-foreground mt-1">Max 1 MB per file.</p>
        </div>
      )}
    </div>
  );

  if (compact) return body;

  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">{title}</CardTitle></CardHeader>
      <CardContent>{body}</CardContent>
    </Card>
  );
}

export default Attachments;