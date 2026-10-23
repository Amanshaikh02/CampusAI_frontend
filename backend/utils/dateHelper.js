/**
 * Date and Time utilities for Assignment due date calculations
 * Ensures timezone consistency for Asia/Kolkata (IST: UTC+5:30)
 */

function parseDueDateTime(dueDate, dueTime) {
  if (!dueDate) return null;

  try {
    let year, month, day;
    const cleanDate = dueDate.trim();

    if (cleanDate.includes('-')) {
      const parts = cleanDate.split('-').map(Number);
      if (parts[0] > 1000) {
        // YYYY-MM-DD
        [year, month, day] = parts;
      } else {
        // DD-MM-YYYY
        [day, month, year] = parts;
      }
    } else if (cleanDate.includes('/')) {
      const parts = cleanDate.split('/').map(Number);
      if (parts[2] > 1000) {
        // DD/MM/YYYY
        [day, month, year] = parts;
      } else if (parts[0] > 1000) {
        // YYYY/MM/DD
        [year, month, day] = parts;
      }
    }

    let hours = 23;
    let minutes = 59;
    if (dueTime) {
      const timeLower = dueTime.toLowerCase().trim();
      const isPM = timeLower.includes('pm');
      const isAM = timeLower.includes('am');
      const cleanTime = timeLower.replace(/[a-z]/g, '').trim();
      const [hStr, mStr] = cleanTime.split(':');
      let h = parseInt(hStr, 10);
      let m = parseInt(mStr || '0', 10);
      if (isPM && h < 12) h += 12;
      if (isAM && h === 12) h = 0;
      if (!isNaN(h)) hours = h;
      if (!isNaN(m)) minutes = m;
    }

    if (!year || !month || !day) {
      const fallback = new Date(`${cleanDate} ${dueTime || ''}`);
      return isNaN(fallback.getTime()) ? null : fallback;
    }

    const pad = (n) => String(n).padStart(2, '0');
    // Using IST (+05:30) offset
    const isoString = `${year}-${pad(month)}-${pad(day)}T${pad(hours)}:${pad(minutes)}:00+05:30`;
    const parsed = new Date(isoString);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
    return new Date(`${cleanDate} ${dueTime || ''}`);
  } catch (e) {
    return null;
  }
}

function isDuePassed(dueDate, dueTime) {
  const due = parseDueDateTime(dueDate, dueTime);
  if (!due) return false;
  return new Date() > due;
}

module.exports = {
  parseDueDateTime,
  isDuePassed
};
