import { create } from 'zustand';

import { type SessionInfo } from '@/lib/terminal/commands/types';

interface SessionStore {
  /**
   * The server's last word on the admin session; null for visitors.
   */
  session: null | SessionInfo;
  set: (session: null | SessionInfo) => void;
}

export const useSessionStore = create<SessionStore>()((set) => ({
  session: null,
  set: (session) => set({ session }),
}));
