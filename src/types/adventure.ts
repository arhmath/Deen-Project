import type { ContentType } from "./learning";

export interface AdventureNode {
  id: string;
  title: string;
  type: ContentType;
  moduleTitle: string;
  rewardXp: number;
  completed: boolean;
  /** materi berikutnya yang disarankan di course ini */
  isNext: boolean;
}

/** Satu "wilayah" di peta = satu course. */
export interface AdventureRegion {
  courseId: string;
  title: string;
  description: string;
  roomName: string;
  totalContents: number;
  completedContents: number;
  progressPercent: number;
  completed: boolean;
  /** XP hadiah saat course selesai (dari konfigurasi server) */
  courseRewardXp: number;
  nodes: AdventureNode[];
}

export interface Adventure {
  regions: AdventureRegion[];
}
