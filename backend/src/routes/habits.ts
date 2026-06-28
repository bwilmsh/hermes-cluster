import { Router, type Response } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { authMiddleware, type AuthedRequest } from "../lib/auth";

export const habitsRouter = Router();
habitsRouter.use(authMiddleware);

const createHabitSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  frequency: z.enum(["DAILY", "WEEKDAYS", "WEEKLY", "CUSTOM"]).default("DAILY"),
  idealTime: z.enum(["MORNING", "AFTERNOON", "EVENING"]).default("MORNING"),
  timeRangeStart: z.string().optional(),
  timeRangeEnd: z.string().optional(),
  daysOfWeek: z.array(z.string()).optional().default([]),
  durationMinutes: z.number().int().min(1).default(30),
  priorityLevel: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  materialize: z.boolean().default(true),
  showAsBusy: z.boolean().default(true),
  isActive: z.boolean().default(true),
  rrule: z.string().optional(),
});

habitsRouter.get("/", async (req: AuthedRequest, res: Response) => {
  const habits = await prisma.habit.findMany({
    where: { userId: req.user!.id },
    include: { entries: { orderBy: { scheduledDate: "desc" }, take: 30 } },
    orderBy: { createdAt: "desc" },
  });
  res.json({ habits });
});

habitsRouter.post("/", async (req: AuthedRequest, res: Response) => {
  const parsed = createHabitSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
  const habit = await prisma.habit.create({
    data: { ...parsed.data, userId: req.user!.id },
  });
  res.status(201).json({ habit });
});

habitsRouter.put("/:id", async (req: AuthedRequest, res: Response) => {
  const result = await prisma.habit.updateMany({
    where: { id: req.params.id, userId: req.user!.id },
    data: req.body,
  });
  if (result.count === 0) return res.status(404).json({ error: "Habit not found" });
  res.json({ ok: true });
});

habitsRouter.delete("/:id", async (req: AuthedRequest, res: Response) => {
  await prisma.habit.deleteMany({ where: { id: req.params.id, userId: req.user!.id } });
  res.json({ ok: true });
});

habitsRouter.get("/:id/entries", async (req: AuthedRequest, res: Response) => {
  const entries = await prisma.habitEntry.findMany({
    where: { habitId: req.params.id, habit: { userId: req.user!.id } },
    orderBy: { scheduledDate: "desc" },
  });
  res.json({ entries });
});

// Auto-schedule habit occurrences for a date range — creates HabitEntry + Event rows.
habitsRouter.post("/:id/schedule", async (req: AuthedRequest, res: Response) => {
  const { fromDate, toDate } = req.body as { fromDate?: string; toDate?: string };
  const from = fromDate ? new Date(fromDate) : new Date();
  const to = toDate ? new Date(toDate) : new Date(Date.now() + 7 * 24 * 3600 * 1000);
  const habit = await prisma.habit.findFirst({ where: { id: req.params.id, userId: req.user!.id } });
  if (!habit) return res.status(404).json({ error: "Habit not found" });

  const created = await scheduleHabitOccurrences(prisma, habit, from, to);
  res.json({ scheduled: created.length, entries: created });
});

// Pure helper used by the seeder and the schedule route.
export async function scheduleHabitOccurrences(
  prisma: any,
  habit: any,
  from: Date,
  to: Date
): Promise<any[]> {
  const created: any[] = [];
  const days = Math.ceil((to.getTime() - from.getTime()) / (24 * 3600 * 1000));
  const tz = habit.timezone ?? "UTC";

  for (let i = 0; i <= days; i++) {
    const date = new Date(from.getTime() + i * 24 * 3600 * 1000);
    const weekday = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"][date.getUTCDay()];

    let applies = false;
    if (habit.frequency === "DAILY") applies = true;
    else if (habit.frequency === "WEEKDAYS") applies = date.getUTCDay() >= 1 && date.getUTCDay() <= 5;
    else if (habit.frequency === "WEEKLY") applies = habit.daysOfWeek?.includes(weekday) ?? false;
    else if (habit.frequency === "CUSTOM") applies = habit.daysOfWeek?.includes(weekday) ?? false;
    if (!applies) continue;

    const dateStr = date.toISOString().slice(0, 10);
    const start = new Date(`${dateStr}T${habit.timeRangeStart ?? habit.timeOfDay ?? "09:00:00"}Z`);
    const end = new Date(start.getTime() + habit.durationMinutes * 60 * 1000);

    // Idempotent: skip if entry already exists.
    const existing = await prisma.habitEntry.findUnique({
      where: { habitId_scheduledDate: { habitId: habit.id, scheduledDate: date } },
    }).catch(() => null);
    if (existing) continue;

    const event = await prisma.event.create({
      data: {
        title: habit.name,
        userId: habit.userId,
        startTime: start,
        endTime: end,
        itemType: "HABIT",
        status: "TODO",
        priority: habit.priorityLevel === "HIGH" ? "HIGH" : habit.priorityLevel === "LOW" ? "LOW" : "MEDIUM",
        habitId: habit.id,
        habitOccurrenceAt: date,
        habitLocked: true,
        showAsBusy: habit.showAsBusy,
      },
    });
    const entry = await prisma.habitEntry.create({
      data: {
        habitId: habit.id,
        scheduledDate: date,
        scheduledStart: start,
        scheduledEnd: end,
        status: "SCHEDULED",
        eventId: event.id,
        event: { connect: { id: event.id } },
      },
    });
    created.push(entry);
  }
  return created;
}
