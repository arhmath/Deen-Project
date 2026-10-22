import { describe, expect, it } from "vitest";

import { buildAdventureRegions } from "../src/modules/progress/progress.service";

describe("buildAdventureRegions", () => {
  it("menghasilkan payload yang sesuai dengan struktur MapsPage", () => {
    const regions = buildAdventureRegions(
      [
        {
          id: "course-1",
          title: "Belajar Huruf Hijaiyah",
          description: "Pasangan huruf hijaiyah dasar.",
          roomName: "Kelas A",
          status: "PUBLISHED",
          totalContents: 3,
          completedContents: 1,
          progressPercent: 33,
          nextContent: { id: "course-1-2", title: "Materi 2", type: "LESSON", rewardXp: 5 },
        },
      ],
      {
        "course-1": {
          modules: [{ id: "m1", title: "Modul 1" }],
          contents: [
            { id: "course-1-1", title: "Materi 1", type: "LESSON", moduleId: "m1", xpReward: 0, pointReward: 0 },
            { id: "course-1-2", title: "Materi 2", type: "LESSON", moduleId: "m1", xpReward: 0, pointReward: 0 },
            { id: "course-1-3", title: "Kuis 1", type: "QUIZ", moduleId: "m1", xpReward: 0, pointReward: 0 },
          ],
        },
      },
      new Set(["course-1-1"])
    );

    expect(regions).toHaveLength(1);
    expect(regions[0]).toMatchObject({
      courseId: "course-1",
      title: "Belajar Huruf Hijaiyah",
      description: "Pasangan huruf hijaiyah dasar.",
      roomName: "Kelas A",
      totalContents: 3,
      completedContents: 1,
      progressPercent: 33,
      completed: false,
      courseRewardXp: 100,
      nodes: [
        {
          id: "course-1-1",
          title: "Materi 1",
          type: "LESSON",
          moduleTitle: "Modul 1",
          rewardXp: 5,
          completed: true,
          isNext: false,
        },
        {
          id: "course-1-2",
          title: "Materi 2",
          type: "LESSON",
          moduleTitle: "Modul 1",
          rewardXp: 5,
          completed: false,
          isNext: true,
        },
      ],
    });
  });
});
