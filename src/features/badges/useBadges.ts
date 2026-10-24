import { useEffect, useMemo } from "react";
import { useAdventure, useSantriDashboard } from "../dashboard/queries";
import { useConversations } from "../chatbot/queries";
import { useSessionUser } from "../../hooks/useSessionUser";
import type { Adventure } from "../../types/adventure";
import type { BadgeStats } from "../../types/badge";
import { evaluateBadges } from "./catalog";

const STORAGE_PREFIX = "deen.badges.earned.v1.";

function readEarned(userId: string): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + userId);
    const list: unknown = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(list) ? list.filter((x): x is string => typeof x === "string") : []);
  } catch {
    return new Set();
  }
}

function writeEarned(userId: string, ids: Set<string>) {
  try {
    localStorage.setItem(STORAGE_PREFIX + userId, JSON.stringify([...ids]));
  } catch {
    /* storage penuh/diblokir: badge tetap dihitung ulang dari data */
  }
}

/** Dipanggil saat "Reset data demo" supaya badge ikut kembali ke awal. */
export function clearEarnedBadges() {
  try {
    for (const key of Object.keys(localStorage)) if (key.startsWith(STORAGE_PREFIX)) localStorage.removeItem(key);
  } catch {
    /* abaikan */
  }
}

function moduleCounts(adventure: Adventure | undefined) {
  let total = 0;
  let completed = 0;
  for (const region of adventure?.regions ?? []) {
    const byModule = new Map<string, boolean>();
    for (const node of region.nodes) {
      byModule.set(node.moduleTitle, (byModule.get(node.moduleTitle) ?? true) && node.completed);
    }
    total += byModule.size;
    for (const done of byModule.values()) if (done) completed++;
  }
  return { total, completed };
}

/**
 * Menilai badge dari data yang sudah tersedia (dashboard, peta petualangan, percakapan Ziya).
 * Tidak butuh endpoint khusus badge, jadi jalan di mode mock maupun backend asli.
 */
export function useBadges(enabled = true) {
  const user = useSessionUser();
  const dash = useSantriDashboard(enabled);
  const adventure = useAdventure();
  const chats = useConversations();

  const stats = useMemo<BadgeStats | null>(() => {
    if (!dash.data || !adventure.data) return null;
    const g = dash.data.gamification;
    const regions = adventure.data.regions;
    const modules = moduleCounts(adventure.data);
    const totalCheckIns = Math.max(g.totalCheckIns ?? 0, g.longestStreak, g.streak);
    const { position, total } = dash.data.rank;
    return {
      level: g.level.level,
      longestStreak: Math.max(g.longestStreak, g.streak),
      totalCheckIns,
      // Ada check-in lama di luar rangkaian streak saat ini → pernah berhenti lalu bangkit lagi.
      comebackStreak: totalCheckIns > g.streak ? g.streak : 0,
      modulesCompleted: modules.completed,
      modulesTotal: modules.total,
      coursesCompleted: dash.data.stats.coursesCompleted,
      quizzesDone: dash.data.stats.quizzesDone,
      roomCount: dash.data.roomCount,
      regionsExplored: regions.filter((r) => r.completedContents > 0).length,
      discussions: chats.data?.pagination?.total ?? chats.data?.data.length ?? 0,
      challengesCompleted: regions.reduce((sum, r) => sum + r.nodes.filter((n) => n.type === "CHALLENGE" && n.completed).length, 0),
      rankTop: total >= 3 && position >= 1 && position <= 3 ? 1 : 0,
    };
  }, [dash.data, adventure.data, chats.data]);

  const badges = useMemo(() => (stats ? evaluateBadges(stats, readEarned(user.id)) : []), [stats, user.id]);

  // Simpan badge yang sudah didapat agar tidak hilang bila angkanya turun (mis. peringkat).
  useEffect(() => {
    if (!badges.length) return;
    const earned = badges.filter((b) => b.earned).map((b) => b.id);
    const stored = readEarned(user.id);
    if (earned.some((id) => !stored.has(id))) writeEarned(user.id, new Set([...stored, ...earned]));
  }, [badges, user.id]);

  return {
    badges,
    isLoading: dash.isLoading || adventure.isLoading,
    isError: dash.isError || adventure.isError,
  };
}
