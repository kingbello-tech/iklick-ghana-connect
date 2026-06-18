import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OutlookCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"working" | "success" | "error">("working");
  const [message, setMessage] = useState("Finishing Outlook connection…");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const code = params.get("code");
    const state = params.get("state");
    const errParam = params.get("error_description") || params.get("error");
    if (errParam) {
      setStatus("error");
      setMessage(errParam);
      return;
    }
    if (!code || !state) {
      setStatus("error");
      setMessage("Missing authorization response. Please try connecting again.");
      return;
    }

    const redirect_uri = `${window.location.origin}/crm/outlook/callback`;
    supabase.functions
      .invoke("outlook-oauth", { body: { action: "complete", code, state, redirect_uri } })
      .then(({ data, error }) => {
        if (error || (data && data.success === false)) {
          setStatus("error");
          setMessage((data && data.error) || error?.message || "Failed to connect Outlook");
          return;
        }
        setStatus("success");
        setMessage(`Connected${data?.outlook_email ? ` as ${data.outlook_email}` : ""}.`);
        setTimeout(() => navigate("/crm/meeting-links?outlook=connected", { replace: true }), 1200);
      });
  }, [params, navigate]);

  return (
    <div className="p-8 flex justify-center">
      <Card className="p-8 max-w-md w-full text-center space-y-4">
        {status === "working" && <Loader2 className="h-10 w-10 mx-auto animate-spin text-primary" />}
        {status === "success" && <CheckCircle2 className="h-10 w-10 mx-auto text-green-600" />}
        {status === "error" && <XCircle className="h-10 w-10 mx-auto text-destructive" />}
        <h1 className="text-lg font-semibold">
          {status === "working" ? "Connecting Outlook…" : status === "success" ? "Outlook connected" : "Connection failed"}
        </h1>
        <p className="text-sm text-muted-foreground">{message}</p>
        {status === "error" && (
          <Button onClick={() => navigate("/crm/meeting-links")}>Back to Meeting Link</Button>
        )}
      </Card>
    </div>
  );
}