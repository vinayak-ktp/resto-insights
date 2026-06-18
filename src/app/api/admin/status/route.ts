// ============================================================
// API Route: Admin health check — verifies Blob connection
// GET /api/admin/status   (no auth required — read-only check)
// ============================================================

import { list } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function GET() {
  const tokenSet = !!process.env.BLOB_READ_WRITE_TOKEN;
  const adminSecretSet = !!process.env.ADMIN_SECRET;

  if (!tokenSet) {
    return NextResponse.json({
      ok: false,
      blobConnected: false,
      adminSecretSet,
      error: 'BLOB_READ_WRITE_TOKEN is not set in environment variables.',
    });
  }

  try {
    const result = await list({ prefix: 'dashboard-data/' });
    const latest = result.blobs.sort(
      (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    )[0] ?? null;

    return NextResponse.json({
      ok: true,
      blobConnected: true,
      adminSecretSet,
      blobCount: result.blobs.length,
      latestUploadedAt: latest?.uploadedAt ?? null,
      latestSize: latest?.size ?? null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({
      ok: false,
      blobConnected: false,
      adminSecretSet,
      error: `Blob connection failed: ${message}`,
    });
  }
}
