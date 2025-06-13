export function scheduleNextDispute(userId: string) {
  // Mocked: returns a date 30 days from now
  const nextDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  return {
    userId,
    nextDisputeDate: nextDate.toISOString(),
  };
}
