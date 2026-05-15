"use client";

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { HealthRecord, NewHealthRecord, UserProfile, ChatMessage, UserSettings, DEFAULT_SETTINGS } from '@/types';

// ── Firestore 비동기 side effect 헬퍼 (fire-and-forget) ──────────
// dynamic import → 환경변수 없을 때 Firebase가 초기화되지 않아도 안전
async function fsSyncOne(appUserId: string, record: HealthRecord) {
  try {
    const [{ upsertBodyRecord }, { getFirestoreUserId }] = await Promise.all([
      import('@/services/healthRecordService'),
      import('@/services/userService'),
    ]);
    await upsertBodyRecord(getFirestoreUserId(appUserId), record);
  } catch (err) {
    console.error('[Firestore] 저장 실패:', err);
  }
}

async function fsSyncBulk(appUserId: string, records: HealthRecord[]) {
  if (records.length === 0) return;
  try {
    const [{ bulkUpsertBodyRecords }, { getFirestoreUserId }] = await Promise.all([
      import('@/services/healthRecordService'),
      import('@/services/userService'),
    ]);
    await bulkUpsertBodyRecords(getFirestoreUserId(appUserId), records);
  } catch (err) {
    console.error('[Firestore] 일괄 저장 실패:', err);
  }
}

// ─────────────────────────────────────────────────────────────────

interface HealthState {
  users: UserProfile[];
  currentUserId: string;
  userRecords: Record<string, HealthRecord[]>;
  userNotes: Record<string, string>;
  userDocs: Record<string, any[]>;
  userChats: Record<string, ChatMessage[]>;
  lastBackupAt: string | null;
  userSettings: Record<string, UserSettings>;
  getUserSettings: () => UserSettings;
  updateUserSettings: (partial: Partial<UserSettings>) => void;

  setCurrentUser: (id: string) => void;
  addUser: (name: string) => void;
  updateUserName: (id: string, newName: string) => void;
  deleteUser: (id: string) => void;
  addRecord: (record: NewHealthRecord) => void;
  addBulkRecords: (records: NewHealthRecord[]) => void;
  /** Firestore에서 불러온 기록을 병합합니다 (중복 날짜는 건너뜁니다) */
  importRecordsFromFirestore: (records: HealthRecord[]) => void;
  clearCurrentUserData: () => void;
  updateNote: (note: string) => void;
  getNote: () => string;
  getRecords: () => HealthRecord[];
  addDoc: (doc: any) => void;
  updateDoc: (docId: string, updates: Partial<any>) => void;
  deleteDoc: (docId: string) => void;
  getDocs: () => any[];
  addChatMessage: (msg: ChatMessage) => void;
  getChatMessages: () => ChatMessage[];
  clearChatMessages: () => void;

  // Backup & Restore
  exportData: () => string;
  importData: (jsonData: string) => boolean;
}

export const useHealthStore = create<HealthState>()(
  persist(
    (set, get) => ({
      users: [
        { id: 'user-1', name: '사용자 1' },
        { id: 'user-2', name: '사용자 2' },
      ],
      currentUserId: 'user-1',
      userRecords: {},
      userNotes: {},
      userDocs: {},
      userChats: {},
      lastBackupAt: null,
      userSettings: {},

      setCurrentUser: (id) => set({ currentUserId: id }),
      addUser: (name) => set((state) => ({
        users: [...state.users, { id: `user-${Date.now()}`, name }]
      })),
      updateUserName: (id, newName) => set((state) => ({
        users: state.users.map(u => u.id === id ? { ...u, name: newName } : u)
      })),
      deleteUser: (id) => set((state) => {
        if (state.users.length <= 1) return state;
        const remaining = state.users.filter(u => u.id !== id);
        const { [id]: _r, ...newRecords } = state.userRecords;
        const { [id]: _n, ...newNotes } = state.userNotes;
        const { [id]: _d, ...newDocs } = state.userDocs;
        const { [id]: _c, ...newChats } = state.userChats;
        const { [id]: _s, ...newSettings } = state.userSettings || {};
        return {
          users: remaining,
          userRecords: newRecords,
          userNotes: newNotes,
          userDocs: newDocs,
          userChats: newChats,
          userSettings: newSettings,
          currentUserId: state.currentUserId === id ? remaining[0].id : state.currentUserId,
        };
      }),

      addRecord: (newRecord) => {
        let savedRecord: HealthRecord | undefined;

        set((state) => {
          const userId = state.currentUserId;
          const currentRecords = state.userRecords[userId] || [];
          const existingIdx = currentRecords.findIndex(r => r.date === newRecord.date);
          const heightM = ((state.userSettings?.[userId]?.height ?? 165) / 100);
          const recordWithBmi = { ...newRecord, bmi: newRecord.bmi || parseFloat((newRecord.weight / (heightM * heightM)).toFixed(1)) } as HealthRecord;
          let updated: HealthRecord[];
          if (existingIdx >= 0) {
            updated = [...currentRecords];
            updated[existingIdx] = { ...recordWithBmi, id: currentRecords[existingIdx].id, created_at: currentRecords[existingIdx].created_at };
            savedRecord = updated[existingIdx];
          } else {
            const newId = Math.random().toString(36).substr(2, 9);
            savedRecord = { ...recordWithBmi, id: newId, created_at: new Date().toISOString() };
            updated = [...currentRecords, savedRecord];
          }
          return { userRecords: { ...state.userRecords, [userId]: updated.sort((a, b) => a.date.localeCompare(b.date)) } };
        });

        // Firestore write-through (fire-and-forget)
        if (savedRecord) {
          fsSyncOne(get().currentUserId, savedRecord);
        }
      },

      addBulkRecords: (records) => {
        const saved: HealthRecord[] = [];

        set((state) => {
          const userId = state.currentUserId;
          const currentRecords = state.userRecords[userId] || [];
          const updated = [...currentRecords];
          records.forEach(newR => {
            const idx = updated.findIndex(r => r.date === newR.date);
            const heightM2 = ((state.userSettings?.[userId]?.height ?? 165) / 100);
            const recordWithBmi = { ...newR, bmi: newR.bmi || parseFloat((newR.weight / (heightM2 * heightM2)).toFixed(1)) } as HealthRecord;
            if (idx >= 0) {
              updated[idx] = { ...recordWithBmi, id: updated[idx].id, created_at: updated[idx].created_at };
              saved.push(updated[idx]);
            } else {
              const r = { ...recordWithBmi, id: Math.random().toString(36).substr(2, 9), created_at: new Date().toISOString() };
              updated.push(r);
              saved.push(r);
            }
          });
          return { userRecords: { ...state.userRecords, [userId]: updated.sort((a, b) => a.date.localeCompare(b.date)) } };
        });

        // Firestore bulk write-through (fire-and-forget)
        if (saved.length > 0) {
          fsSyncBulk(get().currentUserId, saved);
        }
      },

      importRecordsFromFirestore: (firestoreRecords) => {
        set((state) => {
          const userId = state.currentUserId;
          const currentRecords = state.userRecords[userId] || [];
          const localDates = new Set(currentRecords.map(r => r.date));
          // 로컬에 없는 날짜 기록만 병합
          const newRecords = firestoreRecords.filter(r => r.date && !localDates.has(r.date));
          if (newRecords.length === 0) return state;
          const updated = [...currentRecords, ...newRecords]
            .sort((a, b) => a.date.localeCompare(b.date));
          return { userRecords: { ...state.userRecords, [userId]: updated } };
        });
      },

      clearCurrentUserData: () => set((state) => ({
        userRecords: { ...state.userRecords, [state.currentUserId]: [] },
        userNotes: { ...state.userNotes, [state.currentUserId]: '' },
        userDocs: { ...state.userDocs, [state.currentUserId]: [] },
        userChats: { ...state.userChats, [state.currentUserId]: [] },
      })),
      updateNote: (note) => set((state) => ({ userNotes: { ...state.userNotes, [state.currentUserId]: note } })),
      getNote: () => get().userNotes[get().currentUserId] || '',
      getRecords: () => get().userRecords[get().currentUserId] || [],
      addDoc: (doc) => set((state) => ({
        userDocs: {
          ...state.userDocs,
          [state.currentUserId]: [{ ...doc, category: doc.category || '건강검진' }, ...(state.userDocs[state.currentUserId] || [])]
        }
      })),
      updateDoc: (docId, updates) => set((state) => ({
        userDocs: {
          ...state.userDocs,
          [state.currentUserId]: (state.userDocs[state.currentUserId] || []).map(d =>
            d.id === docId ? { ...d, ...updates } : d
          )
        }
      })),
      deleteDoc: (docId) => set((state) => ({ userDocs: { ...state.userDocs, [state.currentUserId]: (state.userDocs[state.currentUserId] || []).filter(d => d.id !== docId) } })),
      getDocs: () => get().userDocs[get().currentUserId] || [],
      addChatMessage: (msg) => set((state) => ({
        userChats: {
          ...state.userChats,
          [state.currentUserId]: [...(state.userChats[state.currentUserId] || []), msg],
        }
      })),
      getChatMessages: () => get().userChats[get().currentUserId] || [],
      clearChatMessages: () => set((state) => ({
        userChats: { ...state.userChats, [state.currentUserId]: [] }
      })),

      getUserSettings: () => {
        const state = get();
        return state.userSettings?.[state.currentUserId] ?? DEFAULT_SETTINGS;
      },
      updateUserSettings: (partial) => set((state) => ({
        userSettings: {
          ...state.userSettings,
          [state.currentUserId]: {
            ...(state.userSettings?.[state.currentUserId] ?? DEFAULT_SETTINGS),
            ...partial,
          },
        },
      })),

      exportData: () => {
        const now = new Date().toISOString();
        const data = {
          exportedAt: now,
          version: 1,
          users: get().users,
          userRecords: get().userRecords,
          userNotes: get().userNotes,
          userDocs: get().userDocs,
          userSettings: get().userSettings,
        };
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `body-insight-backup-${now.split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        set({ lastBackupAt: now });
        return json;
      },

      importData: (jsonData) => {
        try {
          const data = JSON.parse(jsonData);
          if (!data.users && !data.userRecords) return false;
          set({
            users: data.users || get().users,
            userRecords: data.userRecords || get().userRecords,
            userNotes: data.userNotes || get().userNotes,
            userDocs: data.userDocs || get().userDocs,
            userSettings: data.userSettings || get().userSettings,
          });
          return true;
        } catch {
          return false;
        }
      }
    }),
    {
      name: 'health-storage-v10',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
