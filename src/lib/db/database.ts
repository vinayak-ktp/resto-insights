// ============================================================
// IndexedDB Database Schema via Dexie.js
// ============================================================

import Dexie, { type Table } from 'dexie';
import type { MetricRecord, Restaurant, UploadRecord } from '@/types';

export class DashboardDatabase extends Dexie {
  restaurants!: Table<Restaurant, string>;
  metricRecords!: Table<MetricRecord, number>;
  uploads!: Table<UploadRecord, number>;

  constructor() {
    super('ZomatoDashboard');

    this.version(1).stores({
      restaurants: 'id, name, city, subzone',
      metricRecords: '++id, [restaurantId+date+metricKey], restaurantId, date, metricGroup, metricKey, granularity',
      uploads: '++id, uploadedAt, status',
    });
  }
}

export const db = new DashboardDatabase();

// --- Helper: Upsert metric records (overwrite duplicates) ---
export async function upsertMetricRecords(records: MetricRecord[]): Promise<number> {
  let upsertedCount = 0;

  // Process in batches of 500
  const batchSize = 500;
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);

    await db.transaction('rw', db.metricRecords, async () => {
      for (const record of batch) {
        // Check for existing record with same compound key
        const existing = await db.metricRecords
          .where('[restaurantId+date+metricKey]')
          .equals([record.restaurantId, record.date, record.metricKey])
          .first();

        if (existing) {
          await db.metricRecords.update(existing.id!, { value: record.value, granularity: record.granularity });
        } else {
          await db.metricRecords.add(record);
        }
        upsertedCount++;
      }
    });
  }

  return upsertedCount;
}

// --- Helper: Upsert restaurants ---
export async function upsertRestaurants(restaurants: Restaurant[]): Promise<void> {
  await db.transaction('rw', db.restaurants, async () => {
    for (const r of restaurants) {
      await db.restaurants.put(r);
    }
  });
}

// --- Helper: Add upload record ---
export async function addUploadRecord(upload: UploadRecord): Promise<number> {
  return await db.uploads.add(upload);
}

// --- Helper: Clear all data ---
export async function clearAllData(): Promise<void> {
  await db.transaction('rw', [db.restaurants, db.metricRecords, db.uploads], async () => {
    await db.restaurants.clear();
    await db.metricRecords.clear();
    await db.uploads.clear();
  });
}
