import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../lib/auth";
import { scheduleHabitOccurrences } from "../routes/habits";

// Seed: 1 demo user, 3 agents, 3 habits, 5 events, 3 due dates, automation templates.
// Idempotent — safe to run multiple times.

const prisma = new PrismaClient();

async function main() {
  const email = "demo@ai-scheduler.local";
  const existing = await prisma.user.findUnique({ where: { email } });
  let user = existing;
  if (!user) {
    user = await prisma.user.create({
      data: { email, name: "Demo User", passwordHash: await hashPassword("password123"), plan: "PRO" },
    });
    console.log(`[seed] Created demo user: ${user.id}`);
  } else {
    console.log(`[seed] Demo user exists: ${user.id}`);
  }

  // Agents (idempotent by name+userId)
  const agents = await Promise.all(
    [
      { name: "Cluster AI", role: "general", memory: "The user is a software developer who plans their day around standups and PRs." },
      { name: "Booking Agent", role: "booking", memory: "Specializes in scheduling appointments." },
      { name: "Customer Memory", role: "customer", memory: "Remembers customer preferences." },
    ].map(async (a) => {
      const existing = await prisma.agent.findFirst({ where: { name: a.name, userId: user!.id } });
      if (existing) return existing;
      return prisma.agent.create({ data: { ...a, userId: user!.id } });
    })
  );
  console.log(`[seed] ${agents.length} agents ready`);

  // Habits (idempotent by name+userId)
  const habits = await Promise.all(
    [
      { name: "Morning Standup", frequency: "DAILY" as const, idealTime: "MORNING" as const, timeRangeStart: "09:00", timeRangeEnd: "09:15", durationMinutes: 15, priorityLevel: "MEDIUM" as const, materialize: true, showAsBusy: true, isActive: true, active: true, autoReschedule: true, daysOfWeek: [], keywords: [], streak: 0, longestStreak: 0, priority: 3, skippedDates: [] },
      { name: "Gym Workout", frequency: "WEEKLY" as const, idealTime: "EVENING" as const, timeRangeStart: "18:00", timeRangeEnd: "19:00", durationMinutes: 60, priorityLevel: "HIGH" as const, daysOfWeek: ["MON", "WED", "FRI"], materialize: true, showAsBusy: true, isActive: true, active: true, autoReschedule: true, keywords: [], streak: 5, longestStreak: 12, priority: 2, skippedDates: [] },
      { name: "Evening Reading", frequency: "DAILY" as const, idealTime: "EVENING" as const, timeRangeStart: "21:00", timeRangeEnd: "21:30", durationMinutes: 30, priorityLevel: "LOW" as const, materialize: true, showAsBusy: false, isActive: true, active: true, autoReschedule: true, daysOfWeek: [], keywords: [], streak: 8, longestStreak: 15, priority: 3, skippedDates: [] },
    ].map(async (h) => {
      const existing = await prisma.habit.findFirst({ where: { name: h.name, userId: user!.id } });
      if (existing) return existing;
      return prisma.habit.create({ data: { ...h, userId: user!.id } });
    })
  );
  console.log(`[seed] ${habits.length} habits ready`);

  // Auto-schedule habit occurrences for the next 7 days
  const now = new Date();
  const week = new Date(Date.now() + 7 * 24 * 3600 * 1000);
  for (const h of habits) {
    await scheduleHabitOccurrences(prisma, h, now, week);
  }
  console.log(`[seed] Habit occurrences scheduled for next 7 days`);

  // Sample events (mixed: events, tasks, appointments) for today + this week
  const todayStart = new Date();
  todayStart.setHours(9, 0, 0, 0);
  const events = [
    { title: "Team Standup", startTime: new Date(todayStart.getTime() + 0), endTime: new Date(todayStart.getTime() + 15 * 60000), itemType: "EVENT" as const, status: "TODO" as const, priority: "MEDIUM" as const, tags: ["work"] },
    { title: "Ship scheduler view", startTime: new Date(todayStart.getTime() + 30 * 60000), endTime: new Date(todayStart.getTime() + 2.5 * 3600000), itemType: "TASK" as const, status: "TODO" as const, priority: "HIGH" as const, tags: ["dev", "urgent"] },
    { title: "Client Review", startTime: new Date(todayStart.getTime() + 3 * 3600000), endTime: new Date(todayStart.getTime() + 4 * 3600000), itemType: "APPOINTMENT" as const, status: "TODO" as const, priority: "HIGH" as const, tags: ["client"] },
    { title: "Lunch with Alex", startTime: new Date(todayStart.getTime() + 4.5 * 3600000), endTime: new Date(todayStart.getTime() + 5.5 * 3600000), itemType: "EVENT" as const, status: "TODO" as const, priority: "LOW" as const, tags: ["social"] },
    { title: "Submit Q3 report", startTime: new Date(todayStart.getTime() + 6 * 3600000), itemType: "TASK" as const, status: "TODO" as const, priority: "MEDIUM" as const, tags: ["deadline"] },
    // Overdue task from yesterday
    { title: "Review PR #142", startTime: new Date(todayStart.getTime() - 24 * 3600000), itemType: "TASK" as const, status: "TODO" as const, priority: "HIGH" as const, tags: ["review", "overdue"] },
  ];
  for (const e of events) {
    const exists = await prisma.event.findFirst({ where: { title: e.title, userId: user!.id } });
    if (!exists) {
      await prisma.event.create({ data: { ...e, userId: user!.id } });
    }
  }
  console.log(`[seed] ${events.length} events ready`);

  // Due dates (1 overdue, 1 tomorrow urgent, 1 next week medium)
  const dueDates = [
    { title: "Math Problem Set 4", description: "Chapters 5-7 exercises", dueDate: new Date(Date.now() - 2 * 24 * 3600000), dueTime: "23:59", priority: "HIGH" as const, status: "OVERDUE" as const, category: "ASSIGNMENT" as const },
    { title: "Biology Midterm", description: "Covering all material to date", dueDate: new Date(Date.now() + 1 * 24 * 3600000), dueTime: "09:00", priority: "URGENT" as const, status: "PENDING" as const, category: "EXAM" as const },
    { title: "Q3 Roadmap Doc", description: "Draft the Q3 roadmap for review", dueDate: new Date(Date.now() + 7 * 24 * 3600000), dueTime: "17:00", priority: "MEDIUM" as const, status: "PENDING" as const, category: "WORK" as const },
  ];
  for (const d of dueDates) {
    const exists = await prisma.dueDate.findFirst({ where: { title: d.title, userId: user!.id } });
    if (!exists) {
      await prisma.dueDate.create({ data: { ...d, userId: user!.id } });
    }
  }
  console.log(`[seed] ${dueDates.length} due dates ready`);

  // Goals
  const goals = [
    { goalText: "Ship the scheduler feature by end of week", deadline: new Date(Date.now() + 5 * 24 * 3600000), isActive: true, visibleAgentIds: [agents[0].id] },
    { goalText: "Read 100 pages this week", deadline: new Date(Date.now() + 7 * 24 * 3600000), isActive: true, visibleAgentIds: [agents[0].id] },
  ];
  for (const g of goals) {
    const exists = await prisma.goal.findFirst({ where: { goalText: g.goalText, userId: user!.id } });
    if (!exists) {
      await prisma.goal.create({ data: { ...g, userId: user!.id } });
    }
  }
  console.log(`[seed] ${goals.length} goals ready`);

  // Widgets (sample dashboard widgets)
  const widgets = [
    { title: "Tasks Today", type: "STAT" as const, config: { label: "Tasks remaining", value: "5", trend: "+2" }, size: "sm", order: 0 },
    { title: "Agents", type: "AGENTS_GRID" as const, config: { agents: agents.map(a => ({ name: a.name, role: a.role, color: a.role === "booking" ? "#4fb8a8" : a.role === "customer" ? "#f59e0b" : "#6366f1" })) }, size: "md", order: 1 },
    { title: "Recent Activity", type: "ACTIVITY_FEED" as const, config: { items: [{ text: "Created habit: Gym Workout", when: "2h ago" }, { text: "Completed task: Ship dashboard", when: "5h ago" }] }, size: "lg", order: 2 },
  ];
  for (const w of widgets) {
    const exists = await prisma.widget.findFirst({ where: { title: w.title, userId: user!.id } });
    if (!exists) {
      await prisma.widget.create({ data: { ...w, userId: user!.id } });
    }
  }
  console.log(`[seed] ${widgets.length} widgets ready`);

  console.log(`[seed] Done. Login: ${email} / password123`);
}

main()
  .catch((e) => {
    console.error("[seed] Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
