import { ref, set, get, onValue, update, serverTimestamp } from "firebase/database";
import { db } from "../firebase";

// ─── TYPES ─────────────────────────────────────────────────
export interface SessionData {
  creator: string;
  task: string;
  duration: number;          // in minutes
  status: "waiting" | "active" | "complete";
  createdAt: number;
  startTime?: number;        // Firebase server timestamp when session actually starts
  creatorStatus: "focused" | "away";
  friendStatus: "waiting" | "focused" | "away";
  friendTask?: string;       // friend's task (optional)
  creatorViolations: number;
  friendViolations: number;
}

// ─── GENERATE SESSION ID ───────────────────────────────────
export const generateSessionId = (): string => {
  return Math.random().toString(36).substring(2, 10);
};

// ─── CREATE SESSION (Screen 2 → 3) ─────────────────────────
export const createSession = async (sessionId: string, task: string, duration: number) => {
  const sessionRef = ref(db, `sessions/${sessionId}`);
  await set(sessionRef, {
    creator: "user1",
    task: task,
    duration: duration,
    status: "waiting",
    createdAt: Date.now(),
    creatorStatus: "focused",
    friendStatus: "waiting",
    creatorViolations: 0,
    friendViolations: 0,
  });
  return sessionId;
};

// ─── FRIEND JOINS SESSION ──────────────────────────────────
export const joinSession = async (sessionId: string, friendTask?: string) => {
  const updates: Record<string, any> = {
    friendStatus: "focused",
  };
  if (friendTask) {
    updates.friendTask = friendTask;
  }
  const sessionRef = ref(db, `sessions/${sessionId}`);
  await update(sessionRef, updates);
};

// ─── START SESSION (Creator clicks "Start Session") ────────
// This sets the startTime using Firebase server timestamp
// Both phones will read this same startTime for sync
export const startSession = async (sessionId: string) => {
  const sessionRef = ref(db, `sessions/${sessionId}`);
  
  // We need to use a workaround since serverTimestamp() doesn't return a value directly
  // First, write the server timestamp
  await update(sessionRef, {
    status: "active",
    startTime: serverTimestamp(),
  });
};

// ─── GET SESSION (one-time read) ───────────────────────────
export const getSession = async (sessionId: string): Promise<SessionData | null> => {
  const sessionRef = ref(db, `sessions/${sessionId}`);
  const snapshot = await get(sessionRef);
  return snapshot.val();
};

// ─── LISTEN TO SESSION (real-time updates) ─────────────────
// Both creator and friend use this to stay synced
export const listenToSession = (
  sessionId: string,
  callback: (session: SessionData | null) => void
) => {
  const sessionRef = ref(db, `sessions/${sessionId}`);
  const unsubscribe = onValue(sessionRef, (snapshot) => {
    callback(snapshot.val());
  });
  return unsubscribe;
};

// ─── LISTEN FOR FRIEND JOIN (Screen 3 waiting) ─────────────
export const listenForFriendJoin = (
  sessionId: string,
  callback: (joined: boolean) => void
) => {
  const sessionRef = ref(db, `sessions/${sessionId}/friendStatus`);
  const unsubscribe = onValue(sessionRef, (snapshot) => {
    const status = snapshot.val();
    if (status === "focused") {
      callback(true);
    }
  });
  return unsubscribe;
};

// ─── GET SERVER TIME OFFSET ────────────────────────────────
// Firebase provides .info/serverTimeOffset to calculate accurate server time
// serverTime ≈ Date.now() + offset
export const listenToServerTimeOffset = (callback: (offset: number) => void) => {
  const offsetRef = ref(db, ".info/serverTimeOffset");
  const unsubscribe = onValue(offsetRef, (snapshot) => {
    const offset = snapshot.val() || 0;
    callback(offset);
  });
  return unsubscribe;
};

// ─── UPDATE USER STATUS (focused/away) ─────────────────────
export const updateUserStatus = async (
  sessionId: string,
  isCreator: boolean,
  status: "focused" | "away"
) => {
  const field = isCreator ? "creatorStatus" : "friendStatus";
  const sessionRef = ref(db, `sessions/${sessionId}/${field}`);
  await set(sessionRef, status);
};

// ─── INCREMENT VIOLATIONS ──────────────────────────────────
export const incrementViolations = async (sessionId: string, isCreator: boolean) => {
  const field = isCreator ? "creatorViolations" : "friendViolations";
  const sessionRef = ref(db, `sessions/${sessionId}`);
  
  // Get current value and increment
  const snapshot = await get(ref(db, `sessions/${sessionId}/${field}`));
  const current = snapshot.val() || 0;
  await update(sessionRef, { [field]: current + 1 });
};

// ─── COMPLETE SESSION ──────────────────────────────────────
export const completeSession = async (sessionId: string) => {
  const sessionRef = ref(db, `sessions/${sessionId}`);
  await update(sessionRef, { status: "complete" });
};