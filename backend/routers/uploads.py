"""Admin media upload — saves to MEDIA_ROOT (VPS-local for now) and returns the
public URL under /api/media. Swap MEDIA_ROOT for a CDN backend before prod video
traffic without touching callers."""
import os
import uuid

from fastapi import APIRouter, File, HTTPException, Request, UploadFile

import config
from deps import require_admin

router = APIRouter(prefix="/api", tags=["uploads"])

# content-type -> extension
ALLOWED = {
    "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif",
    "video/mp4": "mp4", "video/webm": "webm", "video/quicktime": "mov",
    "application/pdf": "pdf",
}


@router.post("/uploads")
async def upload(request: Request, file: UploadFile = File(...)):
    require_admin(request)
    ext = ALLOWED.get((file.content_type or "").lower())
    if not ext:
        raise HTTPException(status_code=415, detail=f"Unsupported file type: {file.content_type}")
    data = await file.read()
    if len(data) > config.MAX_UPLOAD_MB * 1024 * 1024:
        raise HTTPException(status_code=413, detail=f"File too large (max {config.MAX_UPLOAD_MB}MB)")
    os.makedirs(config.MEDIA_ROOT, exist_ok=True)
    name = f"{uuid.uuid4().hex}.{ext}"
    with open(os.path.join(config.MEDIA_ROOT, name), "wb") as fh:
        fh.write(data)
    return {"url": f"/api/media/{name}", "content_type": file.content_type}
