import { ref, set, get, onValue } from "firebase/database";
import { db } from "../firebase";

// Creates a unique session ID
export const generateSessionId = (): string => {
  return Math.random().toString(36).substring(2, 10);
};

// Creates a session in Firebase
export const createSession = async (sessionId: string, task: string, duration: number) => {
  const sessionRef = ref(db, `sessions/${sessionId}`);
  await set(sessionRef, {
    creator: "user1",       // hardcoded for now, will be real user ID later
    task: task,
    duration: duration,
    status: "waiting",      // waiting → active → complete
    createdAt: Date.now(),
    creatorStatus: "focused",
    friendStatus: "waiting", // waiting = hasn't joined yet
    creatorViolations: 0,
    friendViolations: 0,
  });
  return sessionId;
};

// Friend joins the session
export const joinSession = async (sessionId: string) => {
  const sessionRef = ref(db, `sessions/${sessionId}/friendStatus`);
  await set(sessionRef, "focused");
};

// Listen for friend joining (used on Screen 3)
export const listenForFriendJoin = (sessionId: string, callback: (joined: boolean) => void) => {
  const sessionRef = ref(db, `sessions/${sessionId}/friendStatus`);
  const unsubscribe = onValue(sessionRef, (snapshot) => {
    const status = snapshot.val();
    if (status === "focused") {
      callback(true);
    }
  });
  return unsubscribe; // call this to stop listening
};