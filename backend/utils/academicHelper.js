/**
 * Helper utilities for academic structure (Department, Semester, Subject)
 */

/**
 * Normalizes semester input to a clean integer (1 - 8)
 * e.g. "Semester 7" -> 7, "Sem 7" -> 7, 7 -> 7, "7" -> 7
 * @param {string|number} sem
 * @returns {number|null}
 */
function normalizeSemester(sem) {
  if (sem === null || sem === undefined) return null;
  if (typeof sem === 'number') {
    return sem >= 1 && sem <= 8 ? sem : null;
  }
  const str = String(sem).trim();
  const match = str.match(/\b([1-8])\b/);
  if (match) {
    return parseInt(match[1], 10);
  }
  const digits = str.replace(/[^0-9]/g, '');
  if (digits && digits.length === 1) {
    const num = parseInt(digits, 10);
    return num >= 1 && num <= 8 ? num : null;
  }
  return null;
}

/**
 * Returns a MongoDB query filter to match any format of a semester in the User model
 * e.g. for sem 7: matches 7, "7", "Semester 7", "Sem 7", "Sem-7"
 * @param {number|string} sem
 * @returns {Object} MongoDB query clause
 */
function getSemesterQueryFilter(sem) {
  const num = normalizeSemester(sem);
  if (!num) return {};
  return {
    $in: [
      num,
      String(num),
      `Semester ${num}`,
      `semester ${num}`,
      `Sem ${num}`,
      `Sem-${num}`,
      `sem ${num}`
    ]
  };
}

module.exports = {
  normalizeSemester,
  getSemesterQueryFilter
};
