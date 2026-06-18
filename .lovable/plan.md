I found the failing path: `outlook-oauth` is reaching Microsoft successfully, but Microsoft rejects the token exchange with `AADSTS7000215: Invalid client secret provided`. No Outlook token has been stored yet.

Plan:
1. Update the `MS_OAUTH_CLIENT_SECRET` runtime secret again with the actual Microsoft Entra client secret **Value**, not the Secret ID/GUID. If the Value is no longer visible in Entra, create a new client secret and copy its Value immediately.
2. After the secret update, test the `outlook-oauth` start endpoint to confirm it accepts the logged-in session and returns a Microsoft authorization URL.
3. Add a small defensive improvement to the Edge Function so this Microsoft error is returned to the UI as a clear setup message instead of the generic “Edge Function returned a non-2xx status code”.
4. Re-check the Edge Function logs after another sign-in attempt to verify the previous `AADSTS7000215` error is gone, then confirm a row appears in `meeting_host_outlook_tokens`.