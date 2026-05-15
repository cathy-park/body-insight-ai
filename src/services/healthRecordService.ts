import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { HealthRecord } from '@/types';

// ── 타입 변환 헬퍼 ────────────────────────────────────────────────

function toFirestoreDoc(record: HealthRecord) {
  return {
    appRecordId:         record.id,
    date:                record.date,
    weight:              record.weight,
    bodyFatPercentage:   record.body_fat,
    skeletalMuscleMass:  record.skeletal_muscle,
    bodyFatMass:         record.body_fat_mass,
    visceralFatLevel:    record.visceral_fat_level,
    abdominalFatRatio:   record.abdominal_fat_ratio,
    waistBelly:          record.waist_circumference_belly,
    waistBeauty:         record.waist_circumference_beauty,
    bmi:                 record.bmi,
    sleepHours:          record.sleep_hours,
    alcoholFlag:         record.alcohol_flag,
    bowelCondition:      record.bowel_condition,
    periodFlag:          record.period_flag,
    mounjaroFlag:        record.mounjaro_flag ?? false,
    mounjaroDose:        record.mounjaro_dose ?? 0,
    memo:                record.memo,
    source:              'manual' as const,
    createdAt:           record.created_at
      ? Timestamp.fromDate(new Date(record.created_at))
      : serverTimestamp(),
    updatedAt:           serverTimestamp(),
  };
}

function fromFirestoreDoc(docId: string, data: Record<string, any>): HealthRecord {
  return {
    id:                          data.appRecordId || docId,
    date:                        data.date ?? '',
    weight:                      data.weight ?? 0,
    body_fat:                    data.bodyFatPercentage ?? 0,
    skeletal_muscle:             data.skeletalMuscleMass ?? 0,
    body_fat_mass:               data.bodyFatMass ?? 0,
    visceral_fat_level:          data.visceralFatLevel ?? 0,
    abdominal_fat_ratio:         data.abdominalFatRatio ?? 0,
    waist_circumference_belly:   data.waistBelly ?? 0,
    waist_circumference_beauty:  data.waistBeauty ?? 0,
    bmi:                         data.bmi ?? 0,
    sleep_hours:                 data.sleepHours ?? 0,
    alcohol_flag:                data.alcoholFlag ?? false,
    bowel_condition:             data.bowelCondition ?? 'normal',
    period_flag:                 data.periodFlag ?? false,
    mounjaro_flag:               data.mounjaroFlag ?? false,
    mounjaro_dose:               data.mounjaroDose ?? 0,
    memo:                        data.memo ?? '',
    created_at:                  (data.createdAt as Timestamp)?.toDate?.()?.toISOString()
      ?? new Date().toISOString(),
  };
}

// ── bodyRecords CRUD ──────────────────────────────────────────────

/** 단일 기록 upsert (생성 또는 덮어쓰기) */
export async function upsertBodyRecord(
  firestoreUserId: string,
  record: HealthRecord,
): Promise<void> {
  if (!db) return;
  try {
    const ref = doc(db, 'users', firestoreUserId, 'bodyRecords', record.id);
    await setDoc(ref, toFirestoreDoc(record), { merge: true });
  } catch (err) {
    console.error('[Firestore] upsertBodyRecord 오류:', err);
    throw err;
  }
}

export const createBodyRecord  = upsertBodyRecord;
export const updateBodyRecord  = upsertBodyRecord;

/** 전체 기록 조회 (날짜 오름차순) */
export async function getBodyRecords(firestoreUserId: string): Promise<HealthRecord[]> {
  if (!db) return [];
  try {
    const col = collection(db, 'users', firestoreUserId, 'bodyRecords');
    const q   = query(col, orderBy('date', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => fromFirestoreDoc(d.id, d.data() as Record<string, any>));
  } catch (err) {
    console.error('[Firestore] getBodyRecords 오류:', err);
    return [];
  }
}

/** 날짜 범위로 기록 조회 */
export async function getBodyRecordsByDateRange(
  firestoreUserId: string,
  startDate: string,
  endDate: string,
): Promise<HealthRecord[]> {
  if (!db) return [];
  try {
    const col = collection(db, 'users', firestoreUserId, 'bodyRecords');
    const q   = query(
      col,
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date', 'asc'),
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => fromFirestoreDoc(d.id, d.data() as Record<string, any>));
  } catch (err) {
    console.error('[Firestore] getBodyRecordsByDateRange 오류:', err);
    return [];
  }
}

/** 단일 기록 삭제 */
export async function deleteBodyRecord(
  firestoreUserId: string,
  recordId: string,
): Promise<void> {
  if (!db) return;
  try {
    await deleteDoc(doc(db, 'users', firestoreUserId, 'bodyRecords', recordId));
  } catch (err) {
    console.error('[Firestore] deleteBodyRecord 오류:', err);
    throw err;
  }
}

/** 여러 기록을 배치로 upsert (Firestore 500개 한도 처리) */
export async function bulkUpsertBodyRecords(
  firestoreUserId: string,
  records: HealthRecord[],
): Promise<void> {
  if (!db || records.length === 0) return;
  try {
    const CHUNK = 400;
    for (let i = 0; i < records.length; i += CHUNK) {
      const batch = writeBatch(db);
      records.slice(i, i + CHUNK).forEach(r => {
        const ref = doc(db!, 'users', firestoreUserId, 'bodyRecords', r.id);
        batch.set(ref, toFirestoreDoc(r), { merge: true });
      });
      await batch.commit();
    }
  } catch (err) {
    console.error('[Firestore] bulkUpsertBodyRecords 오류:', err);
    throw err;
  }
}

// ── healthCheckups CRUD ───────────────────────────────────────────

export async function createHealthCheckup(
  firestoreUserId: string,
  data: Record<string, unknown>,
): Promise<string> {
  if (!db) return '';
  try {
    const id  = crypto.randomUUID();
    const ref = doc(db, 'users', firestoreUserId, 'healthCheckups', id);
    await setDoc(ref, { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    return id;
  } catch (err) {
    console.error('[Firestore] createHealthCheckup 오류:', err);
    throw err;
  }
}

export async function getHealthCheckups(firestoreUserId: string): Promise<Record<string, unknown>[]> {
  if (!db) return [];
  try {
    const col  = collection(db, 'users', firestoreUserId, 'healthCheckups');
    const q    = query(col, orderBy('date', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error('[Firestore] getHealthCheckups 오류:', err);
    return [];
  }
}

export async function updateHealthCheckup(
  firestoreUserId: string,
  checkupId: string,
  data: Record<string, unknown>,
): Promise<void> {
  if (!db) return;
  try {
    const ref = doc(db, 'users', firestoreUserId, 'healthCheckups', checkupId);
    await setDoc(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true });
  } catch (err) {
    console.error('[Firestore] updateHealthCheckup 오류:', err);
    throw err;
  }
}

export async function deleteHealthCheckup(
  firestoreUserId: string,
  checkupId: string,
): Promise<void> {
  if (!db) return;
  try {
    await deleteDoc(doc(db, 'users', firestoreUserId, 'healthCheckups', checkupId));
  } catch (err) {
    console.error('[Firestore] deleteHealthCheckup 오류:', err);
    throw err;
  }
}

// ── aiReports CRUD ────────────────────────────────────────────────

export async function createAiReport(
  firestoreUserId: string,
  data: Record<string, unknown>,
): Promise<string> {
  if (!db) return '';
  try {
    const id  = crypto.randomUUID();
    const ref = doc(db, 'users', firestoreUserId, 'aiReports', id);
    await setDoc(ref, { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    return id;
  } catch (err) {
    console.error('[Firestore] createAiReport 오류:', err);
    throw err;
  }
}

export async function getAiReports(firestoreUserId: string): Promise<Record<string, unknown>[]> {
  if (!db) return [];
  try {
    const col  = collection(db, 'users', firestoreUserId, 'aiReports');
    const q    = query(col, orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error('[Firestore] getAiReports 오류:', err);
    return [];
  }
}
