"use server";

import { auth } from "@/auth";
import prisma from "@repo/db/client";
import { getUserByEmail } from "@/db/user";
import {Test} from "@prisma/client"
import {
  calculateTotalTypingTime,
  getAllTimeBestScores,
  getRecentTests,
} from "@/lib/utils";

export const getProfileData = async () => {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      throw new Error("Unauthorized: No valid session found");
    }

    const user = await getUserByEmail(session.user.email);
    if (!user) {
      throw new Error("User not found");
    }
    const tests:Test [] = await prisma.test.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    }) ;
    console.log(tests)
    const testsCompleted = tests.length;
    const averageWpm:number = testsCompleted
      ? Math.round(
          tests.reduce((sum, test) => sum + (test.wpm??0), 0) / testsCompleted
        )
      : 0;
    const averageAccuracy:number = testsCompleted
      ? Number(
          (
            tests.reduce((sum, test) => sum + (test.accuracy??0), 0) / testsCompleted
          ).toFixed(1)
        )
      : 0;

    return {
      data: {
        name: user.name || "TypeMaster",
        image: user.image || "/placeholder.svg",
        stats: {
          averageWpm,
          averageAccuracy,
          testsCompleted,
          totalTimeTyping: calculateTotalTypingTime(tests),
        },
        allTimeBestScores: getAllTimeBestScores(tests),
        recentTests: getRecentTests(tests),
      },
    };
  } catch (err) {
    console.error("Error retrieving profile data:", err);
    throw err;
  }
};
