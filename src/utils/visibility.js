/**
 * Centralized Content Visibility and Filtering Logic
 * 
 * Rules:
 * 1. Admin: Complete institution-wide visibility across all individual, department, and public content.
 * 2. Individual Content: Visible ONLY to the designated recipient student (matching enrollment).
 * 3. Department-wide Content: Visible ONLY to users belonging to that department (and matching audience).
 * 4. Public / All Departments Content: Visible to all users matching the audience (Students, Faculty, Both).
 * 5. Dashboard and Modules use the EXACT same functions to ensure 100% data consistency.
 */

/**
 * Checks if an item (announcement, notice, or event) has passed its expiration time
 * @param {Object} item
 * @returns {boolean}
 */
export function isExpired(item) {
  if (!item || !item.expiresAt) return false;
  try {
    const expDate = new Date(item.expiresAt);
    return !isNaN(expDate.getTime()) && expDate <= new Date();
  } catch {
    return false;
  }
}

/**
 * Checks if a given item is visible to the specified user
 * @param {Object} item - Content item (assignment, notice, material, event)
 * @param {Object} currentUser - The logged in user object
 * @returns {boolean}
 */
export function isItemVisible(item, currentUser) {
  if (!item) return false;
  if (!currentUser) return false;

  // Auto-expire check: expired items disappear from all views
  if (isExpired(item)) return false;

  const role = (currentUser.role || '').toLowerCase();

  // 1. Admin has complete institution-wide visibility
  if (role === 'admin') {
    return true;
  }

  // 2. Student Visibility Rules
  if (role === 'student') {
    const studentEnrollment = (currentUser.enrollment || '').trim().toLowerCase();
    const studentDept = (currentUser.department || currentUser.course || '').trim().toLowerCase();

    const targetEnrollment = (item.targetStudentEnrollment || item.student || '').trim().toLowerCase();
    const isIndividual = item.targetType === 'individual' || !!targetEnrollment;

    // A. Individual Content
    if (isIndividual) {
      // Must match this student's enrollment exactly
      return !!studentEnrollment && targetEnrollment === studentEnrollment;
    }

    // B. Department Content check
    const itemDept = (item.targetDepartment || item.department || '').trim();
    if (itemDept && itemDept !== 'All Departments') {
      if (studentDept && itemDept.toLowerCase() !== studentDept) {
        return false; // Belongs to a different department
      }
    }

    // C. Audience check
    const audience = (item.audience || '').trim().toLowerCase();
    if (audience === 'faculty' || audience === 'all faculty') {
      return false; // Faculty-only content
    }

    return true;
  }

  // 3. Faculty / Teacher Visibility Rules
  if (role === 'faculty' || role === 'teacher') {
    const facultyDept = (currentUser.department || '').trim().toLowerCase();
    const facultyName = (currentUser.name || '').trim().toLowerCase();
    const author = (item.createdBy || item.postedBy || item.uploadedBy || item.organizer || '').trim().toLowerCase();

    // Faculty can always see what they created
    if (facultyName && author === facultyName) {
      return true;
    }

    const targetEnrollment = (item.targetStudentEnrollment || item.student || '').trim();
    const isIndividual = item.targetType === 'individual' || !!targetEnrollment;

    // Individual items sent to a student are only visible to the creator faculty and admin
    if (isIndividual) {
      return facultyName && author === facultyName;
    }

    // Department check
    const itemDept = (item.targetDepartment || item.department || '').trim();
    if (itemDept && itemDept !== 'All Departments') {
      if (facultyDept && itemDept.toLowerCase() !== facultyDept) {
        return false;
      }
    }

    // Audience check
    const audience = (item.audience || '').trim().toLowerCase();
    if (audience === 'students' || audience === 'all students') {
      // General student-only announcement not created by this faculty
      return false;
    }

    return true;
  }

  return false;
}

/**
 * Checks if an assignment's due date and time have passed (IST / Asia-Kolkata)
 * @param {string} dueDate
 * @param {string} dueTime
 * @returns {boolean}
 */
export function isDuePassed(dueDate, dueTime) {
  if (!dueDate) return false;
  try {
    let year, month, day;
    const cleanDate = dueDate.trim();

    if (cleanDate.includes('-')) {
      const parts = cleanDate.split('-').map(Number);
      if (parts[0] > 1000) {
        [year, month, day] = parts;
      } else {
        [day, month, year] = parts;
      }
    } else if (cleanDate.includes('/')) {
      const parts = cleanDate.split('/').map(Number);
      if (parts[2] > 1000) {
        [day, month, year] = parts;
      } else if (parts[0] > 1000) {
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
      return isNaN(fallback.getTime()) ? false : new Date() > fallback;
    }

    const pad = (n) => String(n).padStart(2, '0');
    const isoString = `${year}-${pad(month)}-${pad(day)}T${pad(hours)}:${pad(minutes)}:00+05:30`;
    const parsed = new Date(isoString);
    if (!isNaN(parsed.getTime())) {
      return new Date() > parsed;
    }
    return new Date() > new Date(`${cleanDate} ${dueTime || ''}`);
  } catch (e) {
    return false;
  }
}

/**
 * Checks if an assignment has been submitted by a student
 * @param {Object} assignment
 * @param {string} studentEnrollment
 * @returns {boolean}
 */
export function isAssignmentSubmitted(assignment, studentEnrollment) {
  if (!assignment) return false;
  if (assignment.isSubmitted) return true;
  if (!studentEnrollment) return false;
  const enrollmentLower = studentEnrollment.trim().toLowerCase();

  // Check backend submittedBy array
  if (Array.isArray(assignment.submittedBy)) {
    const hasSubmitted = assignment.submittedBy.some(
      (e) => typeof e === 'string' && e.trim().toLowerCase() === enrollmentLower
    );
    if (hasSubmitted) return true;
  }

  // Check backend submissions array
  if (Array.isArray(assignment.submissions)) {
    const hasSub = assignment.submissions.some(
      (s) => (s.studentEnrollment || '').trim().toLowerCase() === enrollmentLower
    );
    if (hasSub) return true;
  }

  // Check individual assignment status
  if (
    (assignment.targetType === 'individual' || assignment.student || assignment.targetStudentEnrollment) &&
    (assignment.status === 'Submitted' || assignment.status === 'Completed')
  ) {
    return true;
  }

  return false;
}

/**
 * Checks if an assignment is pending for a student
 * Pending = Visible to student AND Not submitted AND Due date has NOT passed
 * @param {Object} assignment
 * @param {string} studentEnrollment
 * @returns {boolean}
 */
export function isAssignmentPending(assignment, studentEnrollment) {
  if (isAssignmentSubmitted(assignment, studentEnrollment)) return false;
  if (isDuePassed(assignment.dueDate, assignment.dueTime)) return false;
  return true;
}

/**
 * Toggles submission state in localStorage and dispatches a window event
 * @param {string|number} assignmentId
 * @param {string} studentEnrollment
 * @returns {boolean} New submitted state
 */
export function toggleLocalAssignmentSubmission(assignmentId, studentEnrollment) {
  if (!assignmentId || !studentEnrollment) return false;
  const enrollmentLower = studentEnrollment.trim().toLowerCase();
  const idStr = String(assignmentId);
  const key = `submitted_assignments_${enrollmentLower}`;

  let ids = [];
  try {
    const stored = localStorage.getItem(key);
    if (stored) ids = JSON.parse(stored) || [];
  } catch (err) {
    ids = [];
  }

  const index = ids.indexOf(idStr);
  let isNowSubmitted = false;

  if (index >= 0) {
    ids.splice(index, 1);
    isNowSubmitted = false;
  } else {
    ids.push(idStr);
    isNowSubmitted = true;
  }

  try {
    localStorage.setItem(key, JSON.stringify(ids));
  } catch (err) {
    console.error('Error saving submission state:', err);
  }

  window.dispatchEvent(new CustomEvent('assignment-status-changed', {
    detail: { assignmentId: idStr, studentEnrollment: enrollmentLower, isSubmitted: isNowSubmitted }
  }));

  return isNowSubmitted;
}

/**
 * Returns all assignments visible to the currentUser
 */
export function getVisibleAssignments(assignments = [], currentUser) {
  if (!Array.isArray(assignments)) return [];
  return assignments.filter((a) => isItemVisible(a, currentUser));
}

/**
 * Returns pending assignments visible to the student
 */
export function getPendingAssignments(assignments = [], currentUser) {
  const visible = getVisibleAssignments(assignments, currentUser);
  const studentEnrollment = currentUser?.enrollment || '';
  return visible.filter((a) => isAssignmentPending(a, studentEnrollment));
}

/**
 * Returns all materials visible to the currentUser
 */
export function getVisibleMaterials(materials = [], currentUser) {
  if (!Array.isArray(materials)) return [];
  return materials.filter((m) => isItemVisible(m, currentUser));
}

/**
 * Returns all notices visible to the currentUser
 */
export function getVisibleNotices(notices = [], currentUser) {
  if (!Array.isArray(notices)) return [];
  return notices.filter((n) => isItemVisible(n, currentUser));
}

/**
 * Checks if an announcement is visible to the specified user based on department + role targeting
 * @param {Object} item - Announcement item
 * @param {Object} currentUser - Current logged in user
 * @returns {boolean}
 */
export function isAnnouncementVisible(item, currentUser) {
  if (!item) return false;
  if (!currentUser) return false;

  // Auto-expire check: expired announcements disappear from all views
  if (isExpired(item)) return false;

  const role = (currentUser.role || '').toLowerCase();
  if (role === 'admin') return true;

  // 1. Individual targeting check (if specified)
  const targetEnrollment = (item.targetStudentEnrollment || item.student || item.recipientEnrollment || item.targetStudent || '').trim().toLowerCase();
  const isIndividual = item.targetType === 'individual' || !!targetEnrollment;

  if (isIndividual) {
    if (role === 'student') {
      const studentEnrollment = (currentUser.enrollment || '').trim().toLowerCase();
      return !!studentEnrollment && targetEnrollment === studentEnrollment;
    }
    return false;
  }

  const userDept = (currentUser.department || currentUser.course || '').trim().toLowerCase();
  const annDept = (item.department || item.targetDepartment || 'All Departments').trim();
  const annRole = (item.targetRole || item.audience || 'Students & Faculty').trim();

  // 2. Department matching
  if (annDept !== 'All Departments') {
    if (!userDept || userDept !== annDept.toLowerCase()) {
      return false;
    }
  }

  // 3. Role matching
  if (role === 'student') {
    return annRole === 'Students' || annRole === 'Students & Faculty' || annRole === 'Everyone';
  }

  if (role === 'teacher' || role === 'faculty') {
    return annRole === 'Faculty' || annRole === 'Students & Faculty' || annRole === 'Everyone';
  }

  return false;
}

/**
 * Returns all announcements visible to the currentUser
 */
export function getVisibleAnnouncements(announcements = [], currentUser) {
  if (!Array.isArray(announcements)) return [];
  return announcements.filter((a) => isAnnouncementVisible(a, currentUser));
}

/**
 * Returns all events visible to the currentUser
 */
export function getVisibleEvents(events = [], currentUser) {
  if (!Array.isArray(events)) return [];
  return events.filter((e) => isItemVisible(e, currentUser));
}
