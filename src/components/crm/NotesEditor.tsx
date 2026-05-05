import { useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Bold, Italic, List, ListOrdered, Link2, Code, Heading } from "lucide-react";

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}

export function NotesEditor({ value, onChange, placeholder, rows = 3 }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const wrap = (before: string, after = before) => {
    const ta = ref.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const sel = value.slice(start, end) || "text";
    const next = value.slice(0, start) + before + sel + after + value.slice(end);
    onChange(next);
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + before.length, start + before.length + sel.length);
    }, 0);
  };

  const prefix = (p: string) => {
    const ta = ref.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const next = value.slice(0, lineStart) + p + value.slice(lineStart);
    onChange(next);
    setTimeout(() => { ta.focus(); ta.setSelectionRange(start + p.length, start + p.length); }, 0);
  };

  return (
    <div className="flex-1 border border-input rounded-md bg-background overflow-hidden">
      <div className="flex items-center gap-0.5 px-1.5 py-1 border-b border-border bg-muted/30">
        <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => wrap("**")} title="Bold"><Bold className="h-3.5 w-3.5" /></Button>
        <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => wrap("*")} title="Italic"><Italic className="h-3.5 w-3.5" /></Button>
        <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => wrap("`")} title="Code"><Code className="h-3.5 w-3.5" /></Button>
        <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => prefix("### ")} title="Heading"><Heading className="h-3.5 w-3.5" /></Button>
        <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => prefix("- ")} title="Bullet list"><List className="h-3.5 w-3.5" /></Button>
        <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => prefix("1. ")} title="Numbered list"><ListOrdered className="h-3.5 w-3.5" /></Button>
        <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => wrap("[", "](https://)")} title="Link"><Link2 className="h-3.5 w-3.5" /></Button>
      </div>
      <Textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 resize-none"
      />
    </div>
  );
}