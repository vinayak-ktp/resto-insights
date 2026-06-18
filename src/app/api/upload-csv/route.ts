// ============================================================
// API Route: Upload CSV to Vercel Blob Storage
// ============================================================
// When a user uploads a CSV, it gets saved to Vercel Blob so
// every visitor can access the same shared data.
// ============================================================

import { put, del, list } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Delete any previously uploaded CSVs to keep storage clean
    try {
      const existing = await list({ prefix: 'dashboard-data/' });
      for (const blob of existing.blobs) {
        await del(blob.url);
      }
    } catch {
      // Ignore errors when listing/deleting old blobs
    }

    // Upload the new CSV with a timestamped name
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const blob = await put(`dashboard-data/${timestamp}.csv`, file, {
      access: 'public',
      contentType: 'text/csv',
    });

    return NextResponse.json({
      success: true,
      url: blob.url,
      uploadedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Upload to Blob failed:', error);
    return NextResponse.json(
      { error: 'Failed to upload CSV to shared storage' },
      { status: 500 }
    );
  }
}
