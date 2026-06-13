// Pulled out so the new-user seeder can import without dragging in Prisma
// from the message/automation services (which would also pull AI provider).

export const AUTOMATION_DEFS = [
  { type: "BIRTHDAY", name: "Birthday greetings", description: "Draft a birthday message on each contact's birthday.", config: {} },
  { type: "FOLLOW_UP_30", name: "30-day follow-up", description: "Draft a check-in 30 days after last contact.", config: { days: 30 } },
  { type: "FOLLOW_UP_60", name: "60-day follow-up", description: "Draft a check-in 60 days after last contact.", config: { days: 60 } },
  { type: "FOLLOW_UP_90", name: "90-day follow-up", description: "Draft a check-in 90 days after last contact.", config: { days: 90 } },
  { type: "BALANCE_TEST_6M", name: "6-month BalanceTest reminder", description: "Remind customers ~6 months after their last BalanceTest.", config: { days: 180 } },
  { type: "REORDER", name: "Product reorder reminder", description: "Draft a reorder nudge ~50 days after a purchase.", config: { days: 50 } },
  { type: "INACTIVE", name: "Inactive customer reminder", description: "Flag customers with no contact for 120+ days.", config: { days: 120 } },
  { type: "LEAD_NURTURE", name: "Lead nurture campaign", description: "Draft a gentle nurture message for leads after 14 quiet days.", config: { days: 14 } },
] as const;
