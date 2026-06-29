import type { PrismaClient } from "@prisma/client";

// Seed automation templates on startup. Idempotent — uses upsert by id.
const TEMPLATES = [
  {
    id: "tmpl-daily-briefing",
    name: "Daily Morning Briefing",
    description: "Every morning at 8am, summarize your tasks, events, and overdue items.",
    category: "Daily",
    icon: "sun",
    isOfficial: true,
    isApproved: true,
    definition: { schedule: "0 8 * * *", steps: ["list_events", "list_due_dates", "plan_day", "send_chat_summary"] },
  },
  {
    id: "tmpl-weekly-review",
    name: "Weekly Friday Review",
    description: "Every Friday at 5pm, review the week's completed tasks and plan next week.",
    category: "Weekly",
    icon: "calendar",
    isOfficial: true,
    isApproved: true,
    definition: { schedule: "0 17 * * 5", steps: ["list_completed_tasks", "summarize_week", "plan_next_week"] },
  },
  {
    id: "tmpl-overdue-reminder",
    name: "Overdue Task Reminder",
    description: "Check for overdue tasks every 2 hours and notify in chat.",
    category: "Monitoring",
    icon: "alert",
    isOfficial: true,
    isApproved: true,
    definition: { schedule: "0 */2 * * *", steps: ["list_overdue", "send_notification"] },
  },
];

export async function seedAutomationTemplates(prisma: PrismaClient): Promise<void> {
  for (const t of TEMPLATES) {
    await prisma.automationTemplate.upsert({
      where: { id: t.id },
      update: { name: t.name, description: t.description, definition: t.definition as any },
      create: t as any,
    });
  }
  console.log(`[seeder] Seeded ${TEMPLATES.length} automation templates`);
}
