import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileText,
  Save,
  Mail,
  Send,
  Download,
  CheckCircle,
  AlertCircle,
  Users,
  Search,
  Lock,
  CheckSquare,
  XSquare,
  Loader2,
  X
} from 'lucide-react';
import api from '../services/api';
import markService from '../services/markService';
import attendanceService from '../services/attendanceService';
import academicService from '../services/academicService';
import { generateMarksheetPDF } from '../utils/marksheetPdfGenerator';

/**
 * Calculates letter grade based on marks obtained and max marks
 */
const calculateGrade = (marks, maxMarks, isAbsent) => {
  if (isAbsent) return 'AB';
  if (marks === '' || marks === undefined || marks === null) return '—';
  const num = parseFloat(marks);
  if (isNaN(num) || maxMarks <= 0) return '—';

  const percentage = (num / maxMarks) * 100;
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B+';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C';
  if (percentage >= 40) return 'D';
  return 'F';
};

const getGradeBadgeColor = (grade) => {
  switch (grade) {
    case 'A+':
    case 'A':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'B+':
    case 'B':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'C':
    case 'D':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'F':
      return 'bg-red-50 text-red-700 border-red-200';
    case 'AB':
      return 'bg-gray-100 text-gray-600 border-gray-200 font-semibold';
    default:
      return 'bg-gray-50 text-gray-400 border-gray-200';
  }
};

export default function BulkMarksEntryGrid({
  currentUser,
  role = 'faculty', // 'faculty' or 'admin'
  onMarksSaved
}) {
  const queryClient = useQueryClient();
  const isAdmin = (role || currentUser?.role || '').toLowerCase() === 'admin';

  // ============================================================================
  // 1. DATA SOURCES: Faculty Subject Assignments & Admin Subjects
  // ============================================================================
  const { data: mySubjects = [] } = useQuery({
    queryKey: ['mySubjects'],
    queryFn: () => attendanceService.getMySubjects(),
    enabled: !isAdmin
  });

  const { data: adminSubjects = [] } = useQuery({
    queryKey: ['adminSubjects'],
    queryFn: () => academicService.getSubjects(),
    enabled: isAdmin
  });

  // ============================================================================
  // 2. CRITERIA & RBAC CONSTRAINTS
  // ============================================================================
  const facultyDept = currentUser?.department && currentUser.department !== 'All Departments'
    ? currentUser.department
    : (mySubjects[0]?.department || 'AIML');

  // Normalize semester string/number
  const initialSem = isAdmin
    ? '8'
    : String(currentUser?.semester || mySubjects[0]?.semester || '6').replace(/[^0-9]/g, '') || '6';

  const [selectedDepartment, setSelectedDepartment] = useState(
    isAdmin ? 'Cyber Security' : facultyDept
  );
  const [selectedSemester, setSelectedSemester] = useState(initialSem);
  const [selectedDivision, setSelectedDivision] = useState(
    isAdmin ? 'General' : (currentUser?.classSection || currentUser?.section || mySubjects[0]?.classSection || 'General')
  );
  const [selectedSubject, setSelectedSubject] = useState('');

  // Faculty: locked strictly to 'Mid Term' and 30 marks
  // Admin: selectable 'Mid Term' / 'Final Exam' and custom marks
  const [examType, setExamType] = useState('Mid Term');
  const [maxMarks, setMaxMarks] = useState(30);

  // Status feedback
  const [saveSuccess, setSaveSuccess] = useState('');
  const [saveError, setSaveError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // ============================================================================
  // 3. STUDENT STATE & DIRECT API FETCH LOGIC
  // ============================================================================
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Email Modal State
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailRecipient, setEmailRecipient] = useState('');
  const [emailNotes, setEmailNotes] = useState('');
  const [emailSuccess, setEmailSuccess] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Enforce faculty role limitations
  useEffect(() => {
    if (!isAdmin) {
      setExamType('Mid Term');
      setMaxMarks(30);
      if (facultyDept) setSelectedDepartment(facultyDept);
    }
  }, [isAdmin, facultyDept]);

  // Adjust default max marks when Admin switches exam type
  const handleAdminExamTypeChange = (newExam) => {
    setExamType(newExam);
    if (newExam === 'Mid Term') {
      setMaxMarks(30);
    } else if (newExam === 'Final Exam') {
      setMaxMarks(50);
    }
  };

  // Derive available criteria options
  const availableDepartments = useMemo(() => {
    return !isAdmin ? [facultyDept || 'AIML'] : ['Cyber Security', 'AIML'];
  }, [isAdmin, facultyDept]);

  const availableSemesters = useMemo(() => {
    if (!isAdmin) {
      const sems = new Set();
      if (currentUser?.semester) {
        const s = String(currentUser.semester).replace(/[^0-9]/g, '');
        if (s) sems.add(s);
      }
      mySubjects.forEach((sub) => {
        if (sub.semester) {
          const s = String(sub.semester).replace(/[^0-9]/g, '');
          if (s) sems.add(s);
        }
      });
      return sems.size > 0 ? Array.from(sems).sort() : ['6'];
    }
    return ['1', '2', '3', '4', '5', '6', '7', '8'];
  }, [isAdmin, currentUser, mySubjects]);

  const availableDivisions = useMemo(() => {
    if (!isAdmin) {
      const divs = new Set();
      const userDiv = (currentUser?.classSection || currentUser?.section || '').trim();
      if (userDiv) divs.add(userDiv.replace(/^(Section|Division)\s+/i, ''));
      mySubjects.forEach((s) => {
        const div = (s.classSection || '').trim().replace(/^(Section|Division)\s+/i, '');
        if (div) divs.add(div);
      });
      return divs.size > 0 ? Array.from(divs).sort() : ['General', 'A', 'B'];
    }
    return ['General', 'A', 'B'];
  }, [isAdmin, currentUser, mySubjects]);

  const availableSubjects = useMemo(() => {
    if (!isAdmin) {
      const subs = mySubjects
        .filter((s) => {
          const deptMatch = !s.department || s.department.toLowerCase() === selectedDepartment.toLowerCase();
          const sSem = String(s.semester || '').replace(/[^0-9]/g, '');
          const semMatch = !sSem || sSem === String(selectedSemester);
          return deptMatch && semMatch;
        })
        .map((s) => s.subject);

      if (subs.length === 0 && currentUser?.assignedSubject) {
        return [currentUser.assignedSubject];
      }
      return subs.length > 0 ? Array.from(new Set(subs)) : ['Machine Learning'];
    }

    const systemSubs = adminSubjects.map((s) => s.name || s.subject || s.title).filter(Boolean);
    const defaults = ['Network Security', 'Machine Learning', 'Deep Learning', 'Neural Networks', 'Cyber Forensics', 'Cloud Computing', 'Database Management'];
    return Array.from(new Set([...systemSubs, ...defaults]));
  }, [isAdmin, mySubjects, adminSubjects, currentUser, selectedDepartment, selectedSemester]);

  useEffect(() => {
    if (availableSubjects.length > 0 && (!selectedSubject || !availableSubjects.includes(selectedSubject))) {
      setSelectedSubject(availableSubjects[0]);
    }
  }, [availableSubjects, selectedSubject]);

  useEffect(() => {
    const deptSlug = (selectedDepartment || 'aiml').toLowerCase().replace(/\s+/g, '');
    setEmailRecipient(`hod.${deptSlug}@campus.edu`);
  }, [selectedDepartment]);

  // ============================================================================
  // 4. FETCH STUDENTS FUNCTION & EFFECT (TRIGGERS ONLY ON SELECTION)
  // ============================================================================
  const fetchStudents = useCallback(async () => {
    // Only trigger backend fetch if required criteria dropdowns are selected
    if (!selectedDepartment || !selectedSemester || !selectedDivision) {
      console.log('Skipping student fetch: Department, Semester, or Division not selected yet.', {
        selectedDepartment,
        selectedSemester,
        selectedDivision
      });
      setStudents([]);
      return;
    }

    setLoadingStudents(true);
    console.log('[BulkMarksEntry] Triggering fetch for criteria:', {
      department: selectedDepartment,
      semester: selectedSemester,
      division: selectedDivision,
      subject: selectedSubject,
      examType: examType
    });

    try {
      // 1. Fetch Students from GET /api/students with query params
      const response = await api.get('/students', {
        params: {
          department: selectedDepartment,
          semester: selectedSemester,
          division: selectedDivision
        }
      });

      console.log('[BulkMarksEntry] Received API response from /api/students:', response.data);

      // Robust response parsing: handles res.data.students vs res.data.data vs res.data
      const rawStudentData = response.data?.students || response.data?.data || response.data || [];
      const studentList = Array.isArray(rawStudentData) ? rawStudentData : [];

      // 2. Fetch existing marks for these students if subject & exam are selected
      let existingMarksMap = new Map();
      if (selectedSubject && examType) {
        try {
          const existingMarks = await markService.getMarks({
            department: selectedDepartment,
            subject: selectedSubject,
            exam: examType
          });
          if (Array.isArray(existingMarks)) {
            existingMarks.forEach((m) => {
              const key = (m.enrollment || m.student || '').trim().toLowerCase();
              if (key) existingMarksMap.set(key, m);
            });
          }
        } catch (mErr) {
          console.warn('[BulkMarksEntry] Could not fetch existing marks:', mErr.message);
        }
      }

      // 3. Map students into evaluation roster state
      const mappedStudents = studentList.map((stu) => {
        const studentEnroll = (stu.enrollment || stu.username || stu.id || stu._id || '').trim();
        const studentName = stu.name || 'Student';
        const existing = existingMarksMap.get(studentEnroll.toLowerCase()) ||
                         existingMarksMap.get(studentName.toLowerCase());

        let attendance = 'Present';
        let marks = '';
        let grade = '—';

        if (existing) {
          if (existing.attendanceStatus) {
            attendance = existing.attendanceStatus;
          } else if (String(existing.score).toUpperCase() === 'AB') {
            attendance = 'Absent';
          }

          if (attendance === 'Absent') {
            marks = 'AB';
            grade = 'AB';
          } else {
            const parsedScore = String(existing.score || '').split('/')[0].trim();
            marks = parsedScore;
            grade = existing.grade || calculateGrade(parsedScore, maxMarks, false);
          }
        }

        return {
          _id: stu._id || stu.id,
          enrollment: studentEnroll,
          name: studentName,
          attendance,
          marks,
          grade,
          validationError: ''
        };
      });

      console.log(`[BulkMarksEntry] Mapped ${mappedStudents.length} students into state.`);
      setStudents(mappedStudents);
    } catch (error) {
      console.error('[BulkMarksEntry] Error fetching students from backend:', error);
      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  }, [selectedDepartment, selectedSemester, selectedDivision, selectedSubject, examType, maxMarks]);

  // Trigger fetch when criteria dropdowns change
  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // ============================================================================
  // 5. INTERACTIVE TABLE ROW HANDLERS
  // ============================================================================
  const handleToggleAttendance = (enrollment) => {
    setStudents((prevList) =>
      prevList.map((student) => {
        if (student.enrollment !== enrollment) return student;

        const nextAttendance = student.attendance === 'Present' ? 'Absent' : 'Present';
        if (nextAttendance === 'Absent') {
          return {
            ...student,
            attendance: 'Absent',
            marks: 'AB',
            grade: 'AB',
            validationError: ''
          };
        } else {
          return {
            ...student,
            attendance: 'Present',
            marks: '',
            grade: '—',
            validationError: ''
          };
        }
      })
    );
  };

  const handleMarksChange = (enrollment, value) => {
    setStudents((prevList) =>
      prevList.map((student) => {
        if (student.enrollment !== enrollment) return student;
        if (student.attendance === 'Absent') return student;

        const trimmedVal = value.trim();

        if (trimmedVal.toUpperCase() === 'AB') {
          return {
            ...student,
            attendance: 'Absent',
            marks: 'AB',
            grade: 'AB',
            validationError: ''
          };
        }

        let valError = '';
        if (trimmedVal !== '') {
          const numVal = parseFloat(trimmedVal);
          if (isNaN(numVal)) {
            valError = 'Invalid';
          } else if (numVal < 0) {
            valError = '≥ 0';
          } else if (numVal > maxMarks) {
            valError = `Max ${maxMarks}`;
          }
        }

        const grade = calculateGrade(trimmedVal, maxMarks, false);

        return {
          ...student,
          marks: trimmedVal,
          grade,
          validationError: valError
        };
      })
    );
  };

  const handleMarkAllPresent = () => {
    setStudents((prev) =>
      prev.map((student) => ({
        ...student,
        attendance: 'Present',
        marks: student.marks === 'AB' ? '' : student.marks,
        grade: student.marks === 'AB' ? '—' : student.grade
      }))
    );
  };

  const handleClearAllMarks = () => {
    if (window.confirm('Clear all entered marks in this grid?')) {
      setStudents((prev) =>
        prev.map((student) => ({
          ...student,
          attendance: 'Present',
          marks: '',
          grade: '—',
          validationError: ''
        }))
      );
    }
  };

  // ============================================================================
  // 6. STATISTICS & FILTERED ROWS
  // ============================================================================
  const stats = useMemo(() => {
    const total = students.length;
    let presentCount = 0;
    let absentCount = 0;
    let filledCount = 0;
    let totalMarks = 0;
    let passCount = 0;

    students.forEach((row) => {
      if (row.attendance === 'Absent') {
        absentCount++;
      } else {
        presentCount++;
        const num = parseFloat(row.marks);
        if (!isNaN(num)) {
          filledCount++;
          totalMarks += num;
          if (num >= maxMarks * 0.4) {
            passCount++;
          }
        }
      }
    });

    const average = filledCount > 0 ? (totalMarks / filledCount).toFixed(1) : '—';
    const passRate = filledCount > 0 ? Math.round((passCount / filledCount) * 100) : 0;

    return {
      total,
      presentCount,
      absentCount,
      filledCount,
      average,
      passRate
    };
  }, [students, maxMarks]);

  const displayedStudents = useMemo(() => {
    if (!searchTerm.trim()) return students;
    const term = searchTerm.toLowerCase();
    return students.filter(
      (s) =>
        s.enrollment.toLowerCase().includes(term) ||
        s.name.toLowerCase().includes(term)
    );
  }, [students, searchTerm]);

  // ============================================================================
  // 7. SAVE ALL MARKS MUTATION (BULK UPDATE)
  // ============================================================================
  const saveMarksMutation = useMutation({
    mutationFn: (bulkPayload) => markService.bulkSaveMarks(bulkPayload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['marks'] });
      setSaveSuccess(data?.message || `Saved marks for ${students.length} students.`);
      setSaveError('');
      if (onMarksSaved) onMarksSaved();
      setTimeout(() => setSaveSuccess(''), 4000);
    },
    onError: (err) => {
      setSaveError(err.response?.data?.message || err.message || 'Failed to save marks.');
      setSaveSuccess('');
    }
  });

  const handleSaveAllMarks = () => {
    const hasErrors = students.some((r) => r.validationError);
    if (hasErrors) {
      setSaveError(`Please resolve validation errors (Marks must be between 0 and ${maxMarks}).`);
      return;
    }

    if (students.length === 0) {
      setSaveError('No students available in the current roster.');
      return;
    }

    const payload = {
      department: selectedDepartment,
      semester: selectedSemester,
      division: selectedDivision,
      subject: selectedSubject,
      exam: examType,
      maxMarks: Number(maxMarks),
      enteredBy: currentUser?.name || (isAdmin ? 'Admin' : 'Faculty'),
      marksData: students.map((row) => ({
        enrollment: row.enrollment,
        student: row.name,
        attendanceStatus: row.attendance,
        marks: row.attendance === 'Absent' ? 'AB' : (row.marks !== '' ? row.marks : '0'),
        score: row.attendance === 'Absent' ? 'AB' : `${row.marks || '0'}/${maxMarks}`,
        grade: row.grade === '—' ? calculateGrade(row.marks || '0', maxMarks, false) : row.grade
      }))
    };

    saveMarksMutation.mutate(payload);
  };

  // ============================================================================
  // 8. PDF GENERATION (JSPDF + JSPDF-AUTOTABLE)
  // ============================================================================
  const handleGeneratePDF = () => {
    if (students.length === 0) {
      alert('Cannot export PDF: No student roster available.');
      return;
    }

    try {
      generateMarksheetPDF({
        institutionName: 'CAMPUS AI INSTITUTE OF TECHNOLOGY & MANAGEMENT',
        department: selectedDepartment,
        semester: selectedSemester,
        division: selectedDivision,
        subject: selectedSubject,
        examType: examType,
        maxMarks: Number(maxMarks),
        enteredBy: currentUser?.name || (isAdmin ? 'Admin' : 'Faculty'),
        records: students,
        autoDownload: true
      });
    } catch (err) {
      alert('Error generating marksheet PDF: ' + err.message);
    }
  };

  // ============================================================================
  // 9. EMAIL SHARING (TARGETED BY DEPARTMENT & DIVISION)
  // ============================================================================
  const handleOpenEmailModal = () => {
    setEmailError('');
    setEmailSuccess('');
    setEmailModalOpen(true);
  };

  const handleSendEmailReport = async () => {
    if (!emailRecipient.trim()) {
      setEmailError('Please enter a valid recipient email address.');
      return;
    }

    setIsSendingEmail(true);
    setEmailError('');
    setEmailSuccess('');

    try {
      const doc = generateMarksheetPDF({
        institutionName: 'CAMPUS AI INSTITUTE OF TECHNOLOGY & MANAGEMENT',
        department: selectedDepartment,
        semester: selectedSemester,
        division: selectedDivision,
        subject: selectedSubject,
        examType: examType,
        maxMarks: Number(maxMarks),
        enteredBy: currentUser?.name || (isAdmin ? 'Admin' : 'Faculty'),
        records: students,
        autoDownload: false
      });

      const pdfBase64 = doc.output('datauristring');

      const emailPayload = {
        department: selectedDepartment,
        semester: selectedSemester,
        division: selectedDivision,
        subject: selectedSubject,
        examType: examType,
        maxMarks: Number(maxMarks),
        targetEmail: emailRecipient.trim(),
        notes: emailNotes.trim(),
        enteredBy: currentUser?.name || (isAdmin ? 'Admin' : 'Faculty'),
        pdfBase64,
        stats,
        studentMarks: students.map((row) => ({
          enrollment: row.enrollment,
          name: row.name,
          attendance: row.attendance,
          marks: row.attendance === 'Absent' ? 'AB' : (row.marks || '0'),
          grade: row.grade
        }))
      };

      const res = await markService.sendMarksheetEmail(emailPayload);
      setEmailSuccess(res?.message || 'Marksheet report emailed successfully!');
      setTimeout(() => {
        setEmailModalOpen(false);
        setEmailSuccess('');
      }, 2000);
    } catch (err) {
      setEmailError(err.response?.data?.message || err.message || 'Failed to dispatch marksheet email.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  // ============================================================================
  // RENDER UI: CLEAN, ENTERPRISE SAAS TABLE WITH EXPLICIT STUDENT MAPPING
  // ============================================================================
  return (
    <div className="space-y-4">
      {/* 1. Standard Header with Top Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-gray-200 gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Marks Entry</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {isAdmin
              ? 'Select academic criteria, input student scores, and generate or share official reports.'
              : `Mid Term evaluations for ${facultyDept} Department (Max 30 Marks).`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleGeneratePDF}
            disabled={students.length === 0}
            className="px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 active:bg-gray-100 text-gray-700 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            title="Download official PDF marksheet"
          >
            <Download size={14} className="text-gray-500" />
            Generate Marksheet
          </button>
          <button
            onClick={handleOpenEmailModal}
            disabled={students.length === 0}
            className="px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 active:bg-gray-100 text-gray-700 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            title="Email marksheet to department HOD"
          >
            <Mail size={14} className="text-gray-500" />
            Send to Department
          </button>
          <button
            onClick={handleSaveAllMarks}
            disabled={saveMarksMutation.isPending || students.length === 0}
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saveMarksMutation.isPending ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={14} />
                Save All Marks
              </>
            )}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg flex items-center gap-2.5 text-xs font-medium">
          <CheckCircle size={15} className="text-emerald-600 shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}
      {saveError && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg flex items-center gap-2.5 text-xs font-medium">
          <AlertCircle size={15} className="text-red-600 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {/* 2. Compact Criteria Selection Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {/* Department */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-1">
              Department *
            </label>
            {isAdmin ? (
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-md text-xs font-medium text-gray-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {availableDepartments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            ) : (
              <div className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-xs font-medium text-gray-700 flex items-center justify-between cursor-not-allowed">
                <span>{selectedDepartment}</span>
                <Lock size={12} className="text-gray-400" />
              </div>
            )}
          </div>

          {/* Semester */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-1">
              Semester *
            </label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-md text-xs font-medium text-gray-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {availableSemesters.map((sem) => {
                const semNum = String(sem).replace(/[^0-9]/g, '') || sem;
                return (
                  <option key={sem} value={semNum}>
                    Semester {semNum}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Division */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-1">
              Division / Section *
            </label>
            <select
              value={selectedDivision}
              onChange={(e) => setSelectedDivision(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-md text-xs font-medium text-gray-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {availableDivisions.map((div) => (
                <option key={div} value={div}>
                  {div === 'General' ? 'Division General' : `Division ${div}`}
                </option>
              ))}
            </select>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-1">
              Subject *
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-md text-xs font-medium text-gray-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 truncate"
            >
              {availableSubjects.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>

          {/* Exam Type */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-1">
              Exam Type
            </label>
            {isAdmin ? (
              <select
                value={examType}
                onChange={(e) => handleAdminExamTypeChange(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-md text-xs font-medium text-gray-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="Mid Term">Mid Term</option>
                <option value="Final Exam">Final Exam</option>
              </select>
            ) : (
              <div className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-xs font-medium text-gray-700 flex items-center justify-between cursor-not-allowed">
                <span>Mid Term</span>
                <span className="text-[10px] text-gray-500 font-semibold bg-gray-200/80 px-1 py-0.2 rounded">
                  Locked
                </span>
              </div>
            )}
          </div>

          {/* Max Marks */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-1">
              Max Marks
            </label>
            {isAdmin ? (
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={maxMarks}
                  onChange={(e) => setMaxMarks(Number(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-md text-xs font-medium text-gray-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="30 or 50"
                />
              </div>
            ) : (
              <div className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-xs font-medium text-gray-700 flex items-center justify-between cursor-not-allowed">
                <span>30 Marks</span>
                <span className="text-[10px] text-gray-500 font-semibold bg-gray-200/80 px-1 py-0.2 rounded">
                  Fixed
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Compact Metrics & Utility Toolbar Strip */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 text-xs text-gray-600">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500">Total:</span>
            <span className="font-semibold text-gray-900">{stats.total}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500">Present:</span>
            <span className="font-semibold text-emerald-700">{stats.presentCount}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500">Absent:</span>
            <span className="font-semibold text-red-600">{stats.absentCount}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500">Evaluated:</span>
            <span className="font-semibold text-indigo-700">
              {stats.filledCount} <span className="text-gray-400 font-normal">/ {stats.presentCount}</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500">Average:</span>
            <span className="font-semibold text-gray-900">{stats.average}</span>
            <span className="text-gray-400">/{maxMarks}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500">Pass Rate:</span>
            <span className="font-semibold text-emerald-700">{stats.passRate}%</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search student..."
              className="pl-7 pr-2.5 py-1 bg-white border border-gray-300 rounded text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 w-44"
            />
          </div>

          <button
            onClick={handleMarkAllPresent}
            disabled={students.length === 0}
            className="px-2.5 py-1 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded text-xs font-medium flex items-center gap-1 transition-colors shadow-sm disabled:opacity-50"
            title="Mark all students as Present"
          >
            <CheckSquare size={13} className="text-emerald-600" />
            All Present
          </button>

          <button
            onClick={handleClearAllMarks}
            disabled={students.length === 0}
            className="px-2.5 py-1 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded text-xs font-medium flex items-center gap-1 transition-colors shadow-sm disabled:opacity-50"
            title="Reset grid inputs"
          >
            <XSquare size={13} className="text-gray-400" />
            Clear
          </button>
        </div>
      </div>

      {/* 4. Strict, Clean HTML Data Table with Empty State Handling */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
        {/* Loading State */}
        {loadingStudents ? (
          <div className="py-16 text-center text-gray-500 flex flex-col items-center justify-center">
            <Loader2 size={24} className="animate-spin text-indigo-600 mb-2" />
            <p className="text-xs font-medium">Loading student list for selected class...</p>
          </div>
        ) : !selectedDepartment || !selectedSemester || !selectedDivision ? (
          /* Selection Missing Empty State */
          <div className="py-16 text-center text-gray-500">
            <Users size={32} className="mx-auto mb-1.5 opacity-40 text-gray-400" />
            <p className="text-xs font-semibold text-gray-700">
              Please select Department, Semester, and Division to view the student list
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Choose the required class criteria from the dropdowns above.
            </p>
          </div>
        ) : displayedStudents.length === 0 ? (
          /* No Students Found Empty State */
          <div className="py-14 text-center text-gray-500">
            <Users size={32} className="mx-auto mb-1.5 opacity-40 text-gray-400" />
            <p className="text-xs font-semibold text-gray-700">No students found for this selection.</p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              No registered students match {selectedDepartment} — Semester {selectedSemester} ({selectedDivision}).
            </p>
          </div>
        ) : (
          /* Data Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-gray-50/90 border-b border-gray-200 text-gray-600 text-[11px] font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3 w-12 text-center">#</th>
                  <th className="py-2.5 px-3 w-40">Enrollment No</th>
                  <th className="py-2.5 px-3">Student Name</th>
                  <th className="py-2.5 px-3 w-36 text-center">Attendance</th>
                  <th className="py-2.5 px-3 w-36 text-center">Marks Obtained</th>
                  <th className="py-2.5 px-3 w-24 text-center">Grade</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200/80">
                {displayedStudents.map((student, index) => {
                  const isAbsent = student.attendance === 'Absent';
                  return (
                    <tr
                      key={student.enrollment || student._id || index}
                      className={`transition-colors ${
                        isAbsent
                          ? 'bg-red-50/20 hover:bg-red-50/30'
                          : index % 2 === 0
                          ? 'bg-white hover:bg-gray-50/80'
                          : 'bg-gray-50/40 hover:bg-gray-50/80'
                      }`}
                    >
                      {/* Sr No */}
                      <td className="py-2 px-3 text-center text-gray-400 font-mono text-[11px]">
                        {index + 1}
                      </td>

                      {/* Enrollment No */}
                      <td className="py-2 px-3 font-mono font-medium text-gray-800">
                        {student.enrollment}
                      </td>

                      {/* Student Name */}
                      <td className="py-2 px-3 font-medium text-gray-900">
                        {student.name}
                      </td>

                      {/* Attendance Toggle */}
                      <td className="py-2 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleAttendance(student.enrollment)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                            isAbsent
                              ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isAbsent ? 'bg-red-500' : 'bg-emerald-500'
                            }`}
                          />
                          {isAbsent ? 'Absent' : 'Present'}
                        </button>
                      </td>

                      {/* Marks Input (Disabled & set to AB when Absent) */}
                      <td className="py-2 px-3 text-center">
                        <div className="inline-flex items-center justify-center gap-1">
                          <input
                            type="text"
                            disabled={isAbsent}
                            value={student.marks}
                            onChange={(e) => handleMarksChange(student.enrollment, e.target.value)}
                            placeholder={isAbsent ? 'AB' : '0'}
                            className={`w-16 text-center py-1 px-2 text-xs font-mono font-medium rounded border transition-colors ${
                              isAbsent
                                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed select-none font-bold'
                                : student.validationError
                                ? 'bg-red-50 border-red-500 text-red-700'
                                : 'bg-white text-gray-900 border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500'
                            }`}
                          />
                          <span className="text-[11px] text-gray-400 font-mono select-none">
                            /{maxMarks}
                          </span>
                        </div>
                        {student.validationError && (
                          <div className="text-[10px] text-red-600 font-medium mt-0.5">
                            {student.validationError}
                          </div>
                        )}
                      </td>

                      {/* Grade Badge */}
                      <td className="py-2 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-semibold border ${getGradeBadgeColor(
                            student.grade
                          )}`}
                        >
                          {student.grade}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 5. Bottom Action & Summary Bar */}
        <div className="p-3 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 text-xs">
          <div className="text-gray-500">
            <span className="font-semibold text-gray-800">{stats.filledCount}</span> of{' '}
            <span className="font-semibold text-gray-800">{stats.presentCount}</span> evaluated
            {stats.absentCount > 0 && (
              <span className="ml-1 text-red-600">({stats.absentCount} Absent)</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleGeneratePDF}
              disabled={students.length === 0}
              className="px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={13} className="text-gray-500" />
              Generate Marksheet
            </button>
            <button
              onClick={handleOpenEmailModal}
              disabled={students.length === 0}
              className="px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Mail size={13} className="text-gray-500" />
              Send to Department
            </button>
            <button
              onClick={handleSaveAllMarks}
              disabled={saveMarksMutation.isPending || students.length === 0}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saveMarksMutation.isPending ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={13} />
                  Save All Marks
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 6. Clean Minimalist Email Modal */}
      {emailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-lg max-w-md w-full shadow-xl border border-gray-200 overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Email Marksheet Report</h3>
                <p className="text-xs text-gray-500">
                  {selectedDepartment} — Sem {selectedSemester} Div {selectedDivision} ({selectedSubject})
                </p>
              </div>
              <button
                onClick={() => setEmailModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 space-y-3.5 text-xs">
              {emailSuccess && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded text-xs font-medium flex items-center gap-2">
                  <CheckCircle size={15} className="text-emerald-600 shrink-0" />
                  {emailSuccess}
                </div>
              )}
              {emailError && (
                <div className="p-2.5 bg-red-50 border border-red-200 text-red-800 rounded text-xs font-medium flex items-center gap-2">
                  <AlertCircle size={15} className="text-red-600 shrink-0" />
                  {emailError}
                </div>
              )}

              <div className="bg-gray-50 border border-gray-200 rounded p-3 text-gray-700 space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">Evaluation:</span>
                  <span className="font-medium text-gray-900">
                    {examType} ({maxMarks} Marks)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Roster Summary:</span>
                  <span className="font-medium text-gray-900">
                    {students.length} Students ({stats.presentCount} Present, {stats.absentCount} Absent)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Class Average:</span>
                  <span className="font-semibold text-emerald-700">{stats.average} / {maxMarks}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Recipient HOD / Admin Email *
                </label>
                <input
                  type="email"
                  value={emailRecipient}
                  onChange={(e) => setEmailRecipient(e.target.value)}
                  placeholder="hod.aiml@campus.edu"
                  className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Remarks / Notes (Optional)
                </label>
                <textarea
                  rows="2"
                  value={emailNotes}
                  onChange={(e) => setEmailNotes(e.target.value)}
                  placeholder="Add evaluation comments or notes for HOD..."
                  className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="p-2.5 bg-gray-50 border border-gray-200 rounded text-[11px] text-gray-600 flex items-center gap-2">
                <FileText size={14} className="text-gray-500 shrink-0" />
                <span>The official PDF marksheet will be attached to the email automatically.</span>
              </div>
            </div>

            <div className="p-3 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEmailModalOpen(false)}
                className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-xs font-medium rounded hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendEmailReport}
                disabled={isSendingEmail}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSendingEmail ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send size={13} />
                    Send Email
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
