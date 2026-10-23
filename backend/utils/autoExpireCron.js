const Announcement = require('../models/Announcement');
const Event = require('../models/Event');
const Notice = require('../models/Notice');

/**
 * Proactively purges expired Announcements, Events, and Notices.
 * Complements MongoDB's background TTL index to guarantee immediate cleanup.
 */
const purgeExpiredRecords = async () => {
  try {
    const now = new Date();
    const filter = { expiresAt: { $lte: now, $ne: null } };

    const [announcements, events, notices] = await Promise.all([
      Announcement.deleteMany(filter),
      Event.deleteMany(filter),
      Notice.deleteMany(filter)
    ]);

    const totalPurged = (announcements.deletedCount || 0) + (events.deletedCount || 0) + (notices.deletedCount || 0);
    if (totalPurged > 0) {
      console.log(`[Auto-Expire] Purged ${totalPurged} expired records (${announcements.deletedCount} announcements, ${events.deletedCount} events, ${notices.deletedCount} notices) at ${now.toISOString()}`);
    }
  } catch (error) {
    console.error('[Auto-Expire] Error during expired records purge:', error.message);
  }
};

const startAutoExpireCron = (intervalMs = 60000) => {
  // Run once immediately on server startup
  purgeExpiredRecords();

  // Schedule recurring execution every 60 seconds
  const timer = setInterval(purgeExpiredRecords, intervalMs);

  // Unref timer so it doesn't block process exit if shutting down
  if (timer.unref) timer.unref();

  console.log('[Auto-Expire] Auto-deletion background monitor active (interval: 60s)');
  return timer;
};

module.exports = {
  purgeExpiredRecords,
  startAutoExpireCron
};
