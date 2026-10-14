export interface LeaderboardEntry {
  rank: number;
  studentId: string;
  name: string;
  level: number;
  xp: number;
  isMe: boolean;
}

export interface LeaderboardPage {
  entries: LeaderboardEntry[];
  page: number;
  pageSize: number;
  total: number;
  /** Posisi user saat ini (selalu ada untuk SANTRI, meski di luar halaman aktif) */
  me: LeaderboardEntry | null;
}

export interface RoomSummary {
  id: string;
  name: string;
  memberCount: number;
}

export type LeaderboardScope = { type: "global" } | { type: "room"; roomId: string };
