# Trading Singularity AI Coach — Starter

This folder contains a minimal server (Vercel Edge Function) and a simple frontend chat you can embed in Kajabi.

## Quick steps

1) Create a Vercel project and add `OPENAI_API_KEY` as an environment variable.
2) Deploy the server. Copy the URL like `https://YOUR-VERCEL-PROJECT.vercel.app/api/chat`.
3) Edit `index.html`, replace ENDPOINT with your URL.
4) Host `index.html` (Vercel static or any host).
5) In Kajabi, add a Custom Code block with:
```
<iframe src="https://YOUR-FRONTEND-URL" width="100%" height="720" style="border:none;border-radius:12px;"></iframe>
```
6) In `api/chat.ts`, set your real allowed origins in `ALLOWED_ORIGINS`:
   - `https://your-kajabi-subdomain.mykajabi.com`
   - `https://YOUR-FRONTEND-URL`

Deploy again after changes.
