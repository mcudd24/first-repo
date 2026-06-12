import { addDays } from "date-fns";
import { db } from "@/server/db";
import { isBirthdayToday } from "@/lib/dates";

export async function getDashboard() {
  const now = new Date();
  const weekAhead = addDays(now, 7);

  const [contacts, pendingMessages, recentImports, upcomingReminders, openReviewTasks, recentMessages] =
    await Promise.all([
      db.contact.findMany({ select: { id: true, firstName: true, lastName: true, birthday: true, status: true } }),
      db.message.count({ where: { status: "PENDING_APPROVAL" } }),
      db.importJob.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
      db.reminder.findMany({
        where: { status: "PENDING", dueDate: { lte: weekAhead } },
        include: { contact: true },
        orderBy: { dueDate: "asc" },
        take: 8,
      }),
      db.reviewTask.findMany({
        where: { status: "OPEN" },
        include: { contact: true },
        orderBy: { createdAt: "desc" },
      }),
      db.message.findMany({
        where: { status: "SENT" },
        include: { contact: true },
        orderBy: { sentAt: "desc" },
        take: 5,
      }),
    ]);

  const birthdaysToday = contacts.filter((c) => isBirthdayToday(c.birthday));
  const followUpsDue = await db.reminder.count({
    where: { status: "PENDING", dueDate: { lte: now } },
  });

  return {
    totals: {
      customers: contacts.filter((c) => c.status === "CUSTOMER").length,
      leads: contacts.filter((c) => c.status === "LEAD").length,
      birthdaysToday: birthdaysToday.length,
      followUpsDue,
      pendingMessages,
    },
    birthdaysToday: birthdaysToday.map((c) => ({
      id: c.id,
      name: `${c.firstName} ${c.lastName}`.trim(),
    })),
    recentImports,
    upcomingReminders,
    openReviewTasks,
    recentMessages,
  };
}
