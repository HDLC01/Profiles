# Media hosting + CDN migration

## Today (VPS-local — fine for testing, NOT for real traffic)
Uploads (`POST /api/uploads`) and generated résumés write to `MEDIA_ROOT` (`/app/media`
on the `media` Docker volume) and serve read-only at `/api/media/<file>` via FastAPI
`StaticFiles`. nginx routes `/api` to the api container, so media comes straight off the
1 vCPU / 2 GB box. Photos + PDFs are light; **intro video is the problem** — even a few
concurrent viewers will saturate the box's CPU/bandwidth. Migrate before sharing with
real clients.

## Target
- **Images + résumé PDFs → Cloudflare R2.** Free tier covers 10 GB + the op counts we'll
  hit; zero egress fees. Effectively $0/mo at CAS scale.
- **Intro video → Bunny Stream (or Cloudflare Stream).** Purpose-built: transcoding,
  adaptive playback, global CDN. ~$5 per 1,000 min stored + ~$1 per 1,000 min delivered;
  a few dollars/month here.

## How (the code is ready for it)
The only thing that writes media is the upload endpoint + the résumé generator, both
producing a `/api/media/<name>` URL stored on the candidate (`photo_url`,
`intro_video_url`, `resume_url`). To migrate:
1. Add a `backend/services/storage.py` with a `save(data, ext, kind) -> url` interface and
   two backends, selected by `STORAGE_BACKEND` env (`local` | `r2`). The `r2` backend uses
   boto3 (S3-compatible) against the R2 endpoint + bucket; returns the public CDN URL.
2. Route `routers/uploads.py` and the résumé endpoint through `storage.save(...)` (drop the
   direct `open(MEDIA_ROOT/...)` writes). Callers + the stored URLs don't change shape.
3. For video, upload to Bunny Stream from the admin upload path and store the Bunny playback
   URL in `intro_video_url`; the profile already renders it as a link/player.
4. Existing local files: one-off copy `/app/media/*` to the bucket, then rewrite the
   `photo_url` / `resume_url` / `intro_video_url` prefixes in the DB.

## Env to add at migration time
`STORAGE_BACKEND=r2`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`,
`R2_BUCKET`, `R2_PUBLIC_BASE_URL` (the CDN/custom-domain prefix), and for video
`BUNNY_STREAM_LIBRARY_ID` + `BUNNY_API_KEY`.

## Note on access
With nginx routing `/api/media` straight to the backend, media is public-by-URL (random
UUID filenames). That matches the CDN endgame (CDN objects are public via unguessable
URLs). If a candidate's media must be private, gate it behind a signed URL from the CDN.
