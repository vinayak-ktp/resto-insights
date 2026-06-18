// ============================================================
// API Route: Proxy latest shared CSV to the browser
// GET /api/csv-data
// ============================================================
// Fetches the latest CSV from Vercel Blob on the server side
// (no CORS restrictions) and returns the raw text to the client.
// This bypasses the browser's same-origin CORS policy that would
// block a direct client-side fetch to blob.vercel-storage.com.
// ============================================================

import { list } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const result = await list({ prefix: 'dashboard-data/' });

    if (result.blobs.length === 0) {
      return NextResponse.json({ error: 'No shared data available' }, { status: 404 });
    }

    // Get the most recently uploaded blob
    const latest = result.blobs.sort(
      (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    )[0];

    // Fetch the CSV server-side — no CORS restrictions apply here
    const blobResponse = await fetch(latest.url);
    if (!blobResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch CSV from storage' }, { status: 502 });
    }

    const csvText = await blobResponse.text();

    return new NextResponse(csvText, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        // Cache for 5 minutes on the CDN edge — reduces repeated blob fetches
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    console.error('[csv-data] Failed to proxy CSV:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
