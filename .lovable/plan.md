## Root cause assessment

The current OAuth code sends `MS_OAUTH_CLIENT_SECRET` directly to Microsoft’s `/oauth2/v2.0/token` endpoint as `client_secret`. The edge-function logs show Microsoft is still returning `AADSTS7000215`, so the token request reaches Microsoft but the credential value is being rejected for the app ID.

One likely non-obvious root cause is that the secret value may contain characters such as `+`, `%`, `&`, or trailing whitespace/newlines. The code uses `URLSearchParams`, which is normally correct, but Microsoft/Azure secret copying and secret-storage workflows can still fail if the stored value has surrounding whitespace or if the wrong Entra object/tenant is paired with the client ID.

## Plan

1. **Add safe diagnostics to the OAuth edge function**
   - Log only non-sensitive metadata: tenant ID, client ID suffix, secret length, whether the secret has leading/trailing whitespace, and a short SHA-256 fingerprint prefix.
   - Do not log the secret value.
   - Include Microsoft’s `error_codes`, `trace_id`, and `correlation_id` in the returned/debug logs so we can distinguish invalid secret vs tenant/app mismatch.

2. **Harden secret handling before token exchange**
   - Trim leading/trailing whitespace from `MS_OAUTH_CLIENT_SECRET` before sending it to Microsoft.
   - Use the trimmed value consistently in both:
     - `supabase/functions/outlook-oauth/index.ts`
     - `supabase/functions/meeting-emails/index.ts` refresh-token flow

3. **Improve the Microsoft token request and error output**
   - Keep using `application/x-www-form-urlencoded`.
   - Return a more precise hint when Microsoft reports `AADSTS7000215`, mentioning:
     - verify the secret **Value**, not Secret ID
     - verify it belongs to client ID `c56c20a6-fd14-4356-ad32-8de556c94b97`
     - verify the tenant ID matches the app’s directory
     - recreate the secret if the Value is no longer visible

4. **Validate after deployment**
   - Use edge-function logs after another connection attempt to confirm whether the runtime picked up the updated secret and whether whitespace/tenant/client mismatch is visible from metadata.
   - If Microsoft still returns `AADSTS7000215` after trimming, update `MS_OAUTH_CLIENT_SECRET` again through the secure secret tool with a freshly created Entra **Value** and compare the safe fingerprint/length in logs to confirm it changed.