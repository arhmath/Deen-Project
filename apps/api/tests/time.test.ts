import { describe, expect, it } from "vitest";
import { addDays, dayKey, daysBetween, mondayOf, weekdayOf } from "@/shared/time";

describe("time (zona Asia/Jakarta)", () => {
  it("memakai tanggal WIB, bukan UTC", () => {
    // 2026-10-14 18:30 UTC = 2026-10-15 01:30 WIB
    expect(dayKey(new Date("2026-10-14T18:30:00Z"), "Asia/Jakarta")).toBe("2026-10-15");
    expect(dayKey(new Date("2026-10-14T18:30:00Z"), "UTC")).toBe("2026-10-14");
  });
  it("aritmetika tanggal kalender", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(daysBetween("2026-10-10", "2026-10-15")).toBe(5);
  });
  it("Senin sebagai awal minggu", () => {
    expect(weekdayOf("2026-10-15")).toBe(4); // Kamis
    expect(mondayOf("2026-10-15")).toBe("2026-10-12");
    expect(mondayOf("2026-10-18")).toBe("2026-10-12"); // Minggu → Senin sebelumnya
  });
});
