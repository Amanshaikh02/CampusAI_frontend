import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Users, Building2, Calendar, Layers, Search,
  RotateCcw, ChevronDown, Check, Plus, Copy, CheckCheck,
  Pencil, Trash2, X, AlertTriangle, ChevronLeft, ChevronRight
} from 'lucide-react';
import { getStudentInsights } from '../services/searchService';
import studentService from '../services/studentService';
import ConfirmModal from './common/ConfirmModal';
import Toast from './common/Toast';
import { DEPARTMENT_OPTIONS } from '../constants/departments';

export default function StudentDirectorySection({
  students = [],
  // Form props
  isFormOpen,
  setIsFormOpen,
  stName, setStName,
  stEnrollment, setStEnrollment,
  stEmail, setStEmail,
  stCourse, setStCourse,
  stSemester, setStSemester,
  stDepartment, setStDepartment,
  stClassSection, setStClassSection,
  stErrors, setStErrors,
  stSuccess,
  handleAddStudent
}) {
  // Local synchronized student list state
  const [studentList, setStudentList] = useState(students);

  useEffect(() => {
    if (students && Array.isArray(students)) {
      setStudentList(students);
    }
  }, [students]);

  // Modal State (Add / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [modalForm, setModalForm] = useState({
    name: '',
    enrollment: '',
    email: '',
    department: 'AIML',
    semester: 'Semester 1',
    classSection: 'A',
    password: ''
  });
  const [modalErrors, setModalErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Confirmation State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState('');

  // Cascading Filter States
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedSem, setSelectedSem] = useState('All');
  const [selectedDiv, setSelectedDiv] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedEnrollment, setCopiedEnrollment] = useState('');

  const handleOpenCreateModal = () => {
    setEditingStudent(null);
    setModalForm({
      name: '',
      enrollment: '',
      email: '',
      department: selectedDept !== 'All' ? selectedDept : 'AIML',
      semester: selectedSem !== 'All' ? selectedSem : 'Semester 1',
      classSection: selectedDiv !== 'All' ? selectedDiv : 'A',
      password: ''
    });
    setModalErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (student) => {
    setEditingStudent(student);
    setModalForm({
      name: student.name || '',
      enrollment: student.enrollment || '',
      email: student.email || '',
      department: student.department || student.course || 'AIML',
      semester: student.semester || 'Semester 1',
      classSection: student.classSection || student.section || 'A',
      password: ''
    });
    setModalErrors({});
    setIsModalOpen(true);
  };

  const handleOpenDeleteModal = (student) => {
    setStudentToDelete(student);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!studentToDelete) return;
    try {
      setIsDeleting(true);
      const studentId = studentToDelete._id || studentToDelete.id;
      await studentService.deleteStudent(studentId);
      setStudentList((prev) => prev.filter((s) => (s._id || s.id) !== studentId));
      setToastMessage(`Student '${studentToDelete.name}' deleted successfully!`);
      setIsDeleteModalOpen(false);
      setStudentToDelete(null);
    } catch (err) {
      console.error('Error deleting student:', err);
      alert(err.response?.data?.message || err.message || 'Failed to delete student.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!modalForm.name.trim()) errs.name = 'Full name is required.';
    if (!modalForm.enrollment.trim()) errs.enrollment = 'Enrollment number is required.';
    if (!modalForm.department) errs.department = 'Department is required.';
    if (!modalForm.semester) errs.semester = 'Semester is required.';

    if (Object.keys(errs).length > 0) {
      setModalErrors(errs);
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingStudent) {
        const studentId = editingStudent._id || editingStudent.id;
        const res = await studentService.updateStudent(studentId, modalForm);
        const updated = res.data || res;
        setStudentList((prev) =>
          prev.map((s) => ((s._id || s.id) === studentId ? { ...s, ...updated } : s))
        );
        setToastMessage(`Student '${modalForm.name}' updated successfully!`);
      } else {
        const res = await studentService.createStudent(modalForm);
        const created = res.data || res;
        setStudentList((prev) => [created, ...prev]);
        setToastMessage(`Student '${modalForm.name}' enrolled successfully!`);
      }
      setIsModalOpen(false);
      setEditingStudent(null);
    } catch (err) {
      console.error('Error saving student:', err);
      setModalErrors({
        submit: err.response?.data?.message || err.message || 'Failed to save student.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fetch Grouped Student Insights Aggregation from Backend API
  const {
    data: insightsData,
    isLoading: isLoadingInsights
  } = useQuery({
    queryKey: ['studentInsights'],
    queryFn: getStudentInsights,
    staleTime: 30000,
    retry: 1
  });

  const insightsTree = useMemo(() => insightsData?.tree || {}, [insightsData]);
  const insightsGroups = useMemo(() => insightsData?.groups || [], [insightsData]);
  const insightsSummary = useMemo(() => insightsData?.summary || {
    totalStudents: students.length,
    departments: [],
    semesters: [],
    divisions: []
  }, [insightsData, students.length]);

  // Compute available Semesters based on selected Department
  const availableSemesters = useMemo(() => {
    if (selectedDept === 'All') {
      // Gather all distinct semesters
      const sems = new Set();
      students.forEach(s => {
        if (s.semester) sems.add(s.semester);
      });
      insightsGroups.forEach(g => {
        if (g.semester) sems.add(g.semester);
      });
      return Array.from(sems).sort();
    }

    // If specific department is chosen, look up in tree
    const deptNode = insightsTree[selectedDept];
    if (deptNode && deptNode.semesters) {
      return Object.keys(deptNode.semesters).sort();
    }

    // Fallback from students list
    const sems = new Set();
    students
      .filter(s => (s.department || s.course) === selectedDept)
      .forEach(s => {
        if (s.semester) sems.add(s.semester);
      });
    return Array.from(sems).sort();
  }, [selectedDept, insightsTree, insightsGroups, students]);

  // Compute available Divisions based on selected Department and Semester
  const availableDivisions = useMemo(() => {
    if (selectedDept !== 'All' && selectedSem !== 'All') {
      const deptNode = insightsTree[selectedDept];
      if (deptNode?.semesters?.[selectedSem]?.divisions) {
        return Object.keys(deptNode.semesters[selectedSem].divisions).sort();
      }
    }

    // Fallback: collect from students matching current Department & Semester
    const divs = new Set();
    students
      .filter(s => {
        const matchesDept = selectedDept === 'All' || (s.department || s.course) === selectedDept;
        const matchesSem = selectedSem === 'All' || s.semester === selectedSem;
        return matchesDept && matchesSem;
      })
      .forEach(s => {
        const d = s.classSection || s.section || 'General';
        divs.add(d);
      });

    // Also check insightsGroups
    insightsGroups
      .filter(g => {
        const matchesDept = selectedDept === 'All' || g.department === selectedDept;
        const matchesSem = selectedSem === 'All' || g.semester === selectedSem;
        return matchesDept && matchesSem;
      })
      .forEach(g => {
        if (g.division) divs.add(g.division);
      });

    return Array.from(divs).sort();
  }, [selectedDept, selectedSem, insightsTree, insightsGroups, students]);

  // Dynamic Filtering: Compute the filtered list of students based on Dept -> Sem -> Div
  const filteredStudents = useMemo(() => {
    return studentList.filter(student => {
      // 1. Department match
      if (selectedDept !== 'All') {
        const sDept = (student.department || student.course || '').trim().toLowerCase();
        if (sDept !== selectedDept.trim().toLowerCase()) return false;
      }

      // 2. Semester match
      if (selectedSem !== 'All') {
        const sSem = (student.semester || '').trim().toLowerCase();
        if (sSem !== selectedSem.trim().toLowerCase()) return false;
      }

      // 3. Division match
      if (selectedDiv !== 'All') {
        const sDiv = (student.classSection || student.section || 'General').trim().toLowerCase();
        const targetDiv = selectedDiv.trim().toLowerCase();
        if (sDiv !== targetDiv) return false;
      }

      // 4. Search query
      if (searchTerm.trim()) {
        const q = searchTerm.trim().toLowerCase();
        const matchesName = (student.name || '').toLowerCase().includes(q);
        const matchesEnrollment = (student.enrollment || '').toLowerCase().includes(q);
        const matchesEmail = (student.email || '').toLowerCase().includes(q);
        if (!matchesName && !matchesEnrollment && !matchesEmail) return false;
      }

      return true;
    });
  }, [studentList, selectedDept, selectedSem, selectedDiv, searchTerm]);

  // Pagination State for Lazy Data Loading
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Automatically reset to page 1 on filter or dataset modifications
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedDept, selectedSem, selectedDiv, searchTerm, studentList.length]);

  const totalFilteredRecords = filteredStudents.length;
  const totalPages = Math.ceil(totalFilteredRecords / pageSize) || 1;

  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredStudents.slice(start, start + pageSize);
  }, [filteredStudents, currentPage, pageSize]);

  // Handle Department change (cascades: reset or validate child filters)
  const handleDepartmentChange = (dept) => {
    setSelectedDept(dept);
    setSelectedSem('All');
    setSelectedDiv('All');
  };

  // Handle Semester change (cascades: reset division)
  const handleSemesterChange = (sem) => {
    setSelectedSem(sem);
    setSelectedDiv('All');
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSelectedDept('All');
    setSelectedSem('All');
    setSelectedDiv('All');
    setSearchTerm('');
  };

  // Check if any filter is active
  const isAnyFilterActive = selectedDept !== 'All' || selectedSem !== 'All' || selectedDiv !== 'All' || searchTerm.trim() !== '';

  const handleCopyEnrollment = (enr) => {
    if (!enr) return;
    navigator.clipboard?.writeText(enr);
    setCopiedEnrollment(enr);
    setTimeout(() => setCopiedEnrollment(''), 2000);
  };

  return (
    <div className="space-y-6">
      {/* =========================================================================
          SECTION 1: INSIGHT CARDS (COUNTS BY DEPARTMENT, SEMESTER, AND DIVISION)
          ========================================================================= */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers size={16} className="text-indigo-600" />
              <span>Real-Time Enrollment Insights</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Exact student counts aggregated dynamically across departments, semesters, and divisions.
            </p>
          </div>
          <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">
            Backend Aggregation Active
          </span>
        </div>

        {/* Loading Skeletons */}
        {isLoadingInsights ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
            {[1, 2, 3, 4].map(idx => (
              <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="h-3 w-20 bg-slate-200 rounded" />
                  <div className="w-8 h-8 rounded-xl bg-slate-200" />
                </div>
                <div className="h-8 w-16 bg-slate-200 rounded" />
                <div className="h-2 w-32 bg-slate-100 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Total Enrolled Students */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-md transition-all flex flex-col justify-between group">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block">
                    Total Enrolled
                  </span>
                  <div className="text-3xl font-black text-slate-900 mt-1 tracking-tight">
                    {insightsData?.totalStudents ?? students.length}
                  </div>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <Users size={20} />
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Verified Records</span>
                <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md text-[10px]">
                  100% Synced
                </span>
              </div>
            </div>

            {/* Card 2: Department Distribution */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-md transition-all flex flex-col justify-between group">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block">
                    Departments
                  </span>
                  <div className="text-3xl font-black text-slate-900 mt-1 tracking-tight">
                    {insightsSummary.departments.length || 2}
                  </div>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <Building2 size={20} />
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-1.5">
                {insightsSummary.departments.map(dept => (
                  <button
                    key={dept.name}
                    type="button"
                    onClick={() => handleDepartmentChange(dept.name)}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${
                      selectedDept === dept.name
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                    }`}
                  >
                    <span>{dept.name}</span>
                    <span className="opacity-80">({dept.count})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Card 3: Semester Distribution */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-md transition-all flex flex-col justify-between group">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block">
                    Semesters Active
                  </span>
                  <div className="text-3xl font-black text-slate-900 mt-1 tracking-tight">
                    {insightsSummary.semesters.length || 2}
                  </div>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <Calendar size={20} />
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-1.5">
                {insightsSummary.semesters.slice(0, 3).map(sem => (
                  <button
                    key={sem.name}
                    type="button"
                    onClick={() => handleSemesterChange(sem.name)}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${
                      selectedSem === sem.name
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                    }`}
                  >
                    <span>{sem.name.replace('Semester ', 'Sem ')}</span>
                    <span className="opacity-80">({sem.count})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Card 4: Division / Section Distribution */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-md transition-all flex flex-col justify-between group">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block">
                    Divisions / Sections
                  </span>
                  <div className="text-3xl font-black text-slate-900 mt-1 tracking-tight">
                    {insightsSummary.divisions.length || 1}
                  </div>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <Layers size={20} />
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-1.5">
                {insightsSummary.divisions.map(div => (
                  <button
                    key={div.name}
                    type="button"
                    onClick={() => setSelectedDiv(div.name)}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${
                      selectedDiv === div.name
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    <span>{div.name}</span>
                    <span className="opacity-80">({div.count})</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Grouped Department -> Semester -> Division Interactive Matrix Pills */}
        {!isLoadingInsights && insightsGroups.length > 0 && (
          <div className="mt-3 p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/70 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1">
              Quick Filter Groups:
            </span>
            {insightsGroups.map((g, idx) => {
              const isMatch =
                selectedDept === g.department &&
                selectedSem === g.semester &&
                selectedDiv === g.division;

              return (
                <button
                  key={`${g.department}-${g.semester}-${g.division}-${idx}`}
                  type="button"
                  onClick={() => {
                    setSelectedDept(g.department);
                    setSelectedSem(g.semester);
                    setSelectedDiv(g.division);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold transition-all duration-150 ${
                    isMatch
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                      : 'bg-white text-slate-700 border border-slate-200/80 hover:border-indigo-300 hover:text-indigo-600'
                  }`}
                >
                  <span className="font-bold">{g.department}</span>
                  <span className="opacity-50">›</span>
                  <span>{g.semester.replace('Semester ', 'Sem ')}</span>
                  <span className="opacity-50">›</span>
                  <span>Div {g.division}</span>
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isMatch ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-indigo-700'
                    }`}
                  >
                    {g.count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* =========================================================================
          COLLAPSIBLE "ADD NEW STUDENT" FORM
          ========================================================================= */}
      {isFormOpen && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-[0_2px_10px_rgba(0,0,0,0.03)] transition-all">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <Plus size={16} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Enroll New Student</h3>
                <p className="text-xs text-slate-500">Add a new student profile to the campus directory</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="text-xs font-medium text-slate-400 hover:text-slate-600 px-2 py-1 rounded-lg hover:bg-slate-100"
            >
              Cancel
            </button>
          </div>

          {stSuccess && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
              <Check size={16} className="text-emerald-600 shrink-0" />
              <span>{stSuccess}</span>
            </div>
          )}

          <form onSubmit={handleAddStudent} noValidate className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Student Full Name *</label>
                <input
                  type="text"
                  value={stName}
                  onChange={(e) => {
                    setStName(e.target.value);
                    if (stErrors.name) setStErrors({ ...stErrors, name: '' });
                  }}
                  placeholder="e.g. Alex Johnson"
                  className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 ${
                    stErrors.name ? 'border-red-500' : 'border-slate-200'
                  }`}
                />
                {stErrors.name && <p className="text-[11px] text-red-500 font-medium mt-1">{stErrors.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Enrollment Number *</label>
                <input
                  type="text"
                  value={stEnrollment}
                  onChange={(e) => {
                    setStEnrollment(e.target.value);
                    if (stErrors.enrollment) setStErrors({ ...stErrors, enrollment: '' });
                  }}
                  placeholder="e.g. CS2026001"
                  className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 ${
                    stErrors.enrollment ? 'border-red-500' : 'border-slate-200'
                  }`}
                />
                {stErrors.enrollment && <p className="text-[11px] text-red-500 font-medium mt-1">{stErrors.enrollment}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Official Email *</label>
                <input
                  type="email"
                  value={stEmail}
                  onChange={(e) => {
                    setStEmail(e.target.value);
                    if (stErrors.email) setStErrors({ ...stErrors, email: '' });
                  }}
                  placeholder="alex.johnson@campus.edu"
                  className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 ${
                    stErrors.email ? 'border-red-500' : 'border-slate-200'
                  }`}
                />
                {stErrors.email && <p className="text-[11px] text-red-500 font-medium mt-1">{stErrors.email}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Department *</label>
                <select
                  value={stDepartment}
                  onChange={(e) => {
                    setStDepartment(e.target.value);
                    if (stErrors.department) setStErrors({ ...stErrors, department: '' });
                  }}
                  className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 ${
                    stErrors.department ? 'border-red-500' : 'border-slate-200'
                  }`}
                >
                  <option value="">Select Department</option>
                  <option value="AIML">AIML</option>
                  <option value="Cyber Security">Cyber Security</option>
                  <option value="All Departments">All Departments</option>
                </select>
                {stErrors.department && <p className="text-[11px] text-red-500 font-medium mt-1">{stErrors.department}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Degree / Course *</label>
                <select
                  value={stCourse}
                  onChange={(e) => {
                    setStCourse(e.target.value);
                    if (stErrors.course) setStErrors({ ...stErrors, course: '' });
                  }}
                  className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 ${
                    stErrors.course ? 'border-red-500' : 'border-slate-200'
                  }`}
                >
                  <option value="">Select Course</option>
                  <option value="AIML">AIML</option>
                  <option value="Cyber Security">Cyber Security</option>
                  <option value="All Departments">All Departments</option>
                </select>
                {stErrors.course && <p className="text-[11px] text-red-500 font-medium mt-1">{stErrors.course}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Semester *</label>
                <select
                  value={stSemester}
                  onChange={(e) => {
                    setStSemester(e.target.value);
                    if (stErrors.semester) setStErrors({ ...stErrors, semester: '' });
                  }}
                  className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 ${
                    stErrors.semester ? 'border-red-500' : 'border-slate-200'
                  }`}
                >
                  <option value="">Select Semester</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                    <option key={s} value={`Semester ${s}`}>Semester {s}</option>
                  ))}
                </select>
                {stErrors.semester && <p className="text-[11px] text-red-500 font-medium mt-1">{stErrors.semester}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Division / Section</label>
                <input
                  type="text"
                  value={stClassSection}
                  onChange={(e) => setStClassSection(e.target.value)}
                  placeholder="e.g. A, B, or General"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm shadow-indigo-600/20"
              >
                Enroll Student
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =========================================================================
          SECTION 2: INTERACTIVE FILTERING CONTROLS (DEPARTMENT -> SEMESTER -> DIVISION)
          ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Quick Search */}
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by student name, enrollment, or email..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ×
              </button>
            )}
          </div>

          {/* Cascading Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* 1. Department Dropdown */}
            <div className="flex flex-col">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Department
              </label>
              <div className="relative">
                <select
                  value={selectedDept}
                  onChange={(e) => handleDepartmentChange(e.target.value)}
                  className={`appearance-none pl-3 pr-8 py-2 bg-slate-50 border rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 cursor-pointer transition-all ${
                    selectedDept !== 'All' ? 'border-indigo-500 bg-indigo-50/50 text-indigo-900' : 'border-slate-200'
                  }`}
                >
                  <option value="All">All Departments</option>
                  {insightsSummary.departments.map(d => (
                    <option key={d.name} value={d.name}>
                      {d.name} ({d.count})
                    </option>
                  ))}
                  {/* Fallback if backend summary not loaded */}
                  {insightsSummary.departments.length === 0 && (
                    <>
                      <option value="AIML">AIML</option>
                      <option value="Cyber Security">Cyber Security</option>
                    </>
                  )}
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* 2. Semester Dropdown (Cascaded) */}
            <div className="flex flex-col">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Semester
              </label>
              <div className="relative">
                <select
                  value={selectedSem}
                  onChange={(e) => handleSemesterChange(e.target.value)}
                  className={`appearance-none pl-3 pr-8 py-2 bg-slate-50 border rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 cursor-pointer transition-all ${
                    selectedSem !== 'All' ? 'border-indigo-500 bg-indigo-50/50 text-indigo-900' : 'border-slate-200'
                  }`}
                >
                  <option value="All">All Semesters</option>
                  {availableSemesters.map(sem => {
                    // Try to calculate count
                    let count = 0;
                    if (selectedDept !== 'All') {
                      count = insightsTree[selectedDept]?.semesters?.[sem]?.total || 0;
                    } else {
                      count = insightsSummary.semesters.find(s => s.name === sem)?.count || 0;
                    }
                    return (
                      <option key={sem} value={sem}>
                        {sem} {count > 0 ? `(${count})` : ''}
                      </option>
                    );
                  })}
                  {availableSemesters.length === 0 && (
                    <>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                        <option key={s} value={`Semester ${s}`}>Semester {s}</option>
                      ))}
                    </>
                  )}
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* 3. Division Dropdown (Cascaded) */}
            <div className="flex flex-col">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Division / Section
              </label>
              <div className="relative">
                <select
                  value={selectedDiv}
                  onChange={(e) => setSelectedDiv(e.target.value)}
                  className={`appearance-none pl-3 pr-8 py-2 bg-slate-50 border rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 cursor-pointer transition-all ${
                    selectedDiv !== 'All' ? 'border-indigo-500 bg-indigo-50/50 text-indigo-900' : 'border-slate-200'
                  }`}
                >
                  <option value="All">All Divisions</option>
                  {availableDivisions.map(div => {
                    let count = 0;
                    if (selectedDept !== 'All' && selectedSem !== 'All') {
                      count = insightsTree[selectedDept]?.semesters?.[selectedSem]?.divisions?.[div] || 0;
                    } else {
                      count = insightsSummary.divisions.find(d => d.name === div)?.count || 0;
                    }
                    return (
                      <option key={div} value={div}>
                        {div} {count > 0 ? `(${count})` : ''}
                      </option>
                    );
                  })}
                  {availableDivisions.length === 0 && (
                    <>
                      <option value="General">General</option>
                      <option value="A">Section A</option>
                      <option value="B">Section B</option>
                    </>
                  )}
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Reset Filters Button */}
            {isAnyFilterActive && (
              <div className="flex flex-col justify-end">
                <label className="text-[10px] font-bold uppercase tracking-wider text-transparent mb-1">
                  Reset
                </label>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all"
                  title="Clear all filters"
                >
                  <RotateCcw size={13} />
                  <span>Reset</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Active Filter Chips */}
        {isAnyFilterActive && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Active Filters:
            </span>
            {selectedDept !== 'All' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                <span>Dept: {selectedDept}</span>
                <button type="button" onClick={() => handleDepartmentChange('All')} className="hover:text-indigo-900">×</button>
              </span>
            )}
            {selectedSem !== 'All' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-100">
                <span>Sem: {selectedSem}</span>
                <button type="button" onClick={() => setSelectedSem('All')} className="hover:text-amber-900">×</button>
              </span>
            )}
            {selectedDiv !== 'All' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-100">
                <span>Div: {selectedDiv}</span>
                <button type="button" onClick={() => setSelectedDiv('All')} className="hover:text-emerald-900">×</button>
              </span>
            )}
            {searchTerm && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700">
                <span>Query: "{searchTerm}"</span>
                <button type="button" onClick={() => setSearchTerm('')} className="hover:text-slate-900">×</button>
              </span>
            )}
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-[11px] font-semibold text-indigo-600 hover:underline ml-1"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* =========================================================================
          SECTION 3: FILTERED DATA TABLE
          ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.03)] overflow-hidden">
        {/* Table Header Bar */}
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <h3 className="text-sm font-bold text-slate-900">
              Manage Students Table
            </h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
              {filteredStudents.length} {filteredStudents.length === 1 ? 'student' : 'students'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">
              Total: <strong className="text-slate-900 font-bold">{studentList.length}</strong> registered
            </span>
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm shadow-indigo-600/20 flex items-center gap-1.5 transition-all"
            >
              <Plus size={14} />
              <span>+ Add New Student</span>
            </button>
          </div>
        </div>

        {/* Empty State */}
        {filteredStudents.length === 0 ? (
          <div className="py-16 text-center px-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
              <Users size={28} />
            </div>
            <h4 className="text-sm font-bold text-slate-800">No students match your criteria</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {isAnyFilterActive
                ? 'Try adjusting your Department, Semester, or Division filters, or clear your search term.'
                : 'No student records have been created yet. Click "+ Add New Student" above to enroll.'}
            </p>
            {isAnyFilterActive && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
              >
                Reset All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50/90 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200/70">
                <tr>
                  <th className="px-4 py-3.5 whitespace-nowrap">Student</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Enrollment No</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Department</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Semester</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Division / Section</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Email Contact</th>
                  <th className="px-4 py-3.5 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {paginatedStudents.map((s, index) => {
                  const studentDept = s.department || s.course || 'General';
                  const studentDiv = s.classSection || s.section || 'General';
                  const isCopied = copiedEnrollment === s.enrollment;

                  return (
                    <tr
                      key={s._id || s.id || s.enrollment || index}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      {/* Name + Avatar */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-indigo-700 text-white flex items-center justify-center font-bold text-xs shadow-xs ring-2 ring-indigo-50">
                            {(s.name || 'S').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block text-xs">
                              {s.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              ID: {(s._id || s.id || '').toString().slice(-6) || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Enrollment Badge with Copy shortcut */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 group">
                          <span className="font-mono font-bold text-indigo-700 bg-indigo-50/90 border border-indigo-100 px-2 py-0.5 rounded-md text-[11px]">
                            {s.enrollment}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyEnrollment(s.enrollment)}
                            className="text-slate-300 hover:text-indigo-600 transition-colors p-1"
                            title="Copy Enrollment Number"
                          >
                            {isCopied ? (
                              <CheckCheck size={12} className="text-emerald-600" />
                            ) : (
                              <Copy size={12} />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Department */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-100">
                          {studentDept}
                        </span>
                      </td>

                      {/* Semester */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-100">
                          {s.semester || 'Semester 1'}
                        </span>
                      </td>

                      {/* Division / Section */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                          {studentDiv}
                        </span>
                      </td>

                      {/* Email */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-slate-600">
                        {s.email ? (
                          <a
                            href={`mailto:${s.email}`}
                            className="text-slate-600 hover:text-indigo-600 hover:underline"
                          >
                            {s.email}
                          </a>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Dedicated Actions Column */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(s)}
                            className="p-1.5 text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                            title="Edit Student"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenDeleteModal(s)}
                            className="p-1.5 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                            title="Delete Student"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination Controls Footer */}
            {totalFilteredRecords > 0 && (
              <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-2 text-slate-500 font-medium">
                  <span>
                    Showing <strong className="text-slate-800 font-bold">{totalFilteredRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1}</strong> to{' '}
                    <strong className="text-slate-800 font-bold">{Math.min(currentPage * pageSize, totalFilteredRecords)}</strong> of{' '}
                    <strong className="text-slate-800 font-bold">{totalFilteredRecords}</strong> students
                  </span>
                  <span className="text-slate-300 hidden sm:inline">•</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">Per page:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none"
                    >
                      {[5, 10, 20, 50].map((size) => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Prev / Page Pills / Next */}
                <div className="flex items-center gap-1.5 self-center sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    className={`px-3 py-1.5 rounded-xl border flex items-center gap-1 font-semibold transition-all ${
                      currentPage <= 1
                        ? 'border-slate-200 text-slate-300 cursor-not-allowed bg-slate-50'
                        : 'border-slate-200 text-slate-700 hover:bg-white hover:border-slate-300 hover:shadow-2xs'
                    }`}
                  >
                    <ChevronLeft size={14} />
                    <span>Previous</span>
                  </button>

                  <div className="flex items-center gap-1 px-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                      .map((pageNum, idx, arr) => {
                        const prev = arr[idx - 1];
                        return (
                          <React.Fragment key={pageNum}>
                            {prev && pageNum - prev > 1 && (
                              <span className="text-slate-400 px-1">...</span>
                            )}
                            <button
                              type="button"
                              onClick={() => setCurrentPage(pageNum)}
                              className={`w-7 h-7 rounded-lg font-bold text-xs transition-all ${
                                currentPage === pageNum
                                  ? 'bg-indigo-600 text-white shadow-xs'
                                  : 'text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              {pageNum}
                            </button>
                          </React.Fragment>
                        );
                      })}
                  </div>

                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                    className={`px-3 py-1.5 rounded-xl border flex items-center gap-1 font-semibold transition-all ${
                      currentPage >= totalPages
                        ? 'border-slate-200 text-slate-300 cursor-not-allowed bg-slate-50'
                        : 'border-slate-200 text-slate-700 hover:bg-white hover:border-slate-300 hover:shadow-2xs'
                    }`}
                  >
                    <span>Next</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Toast Notification */}
      <Toast message={toastMessage} onClose={() => setToastMessage('')} />

      {/* SweetAlert-style Safe Deletion Confirm Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Delete Student Record"
        message="Are you sure you want to delete this record? This action cannot be undone."
        itemName={studentToDelete ? `${studentToDelete.name} (${studentToDelete.enrollment})` : ''}
        confirmText="Yes, Delete Student"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => {
          if (!isDeleting) {
            setIsDeleteModalOpen(false);
            setStudentToDelete(null);
          }
        }}
      />

      {/* Create & Update Popup Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  {editingStudent ? <Pencil size={15} /> : <Plus size={16} />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {editingStudent ? 'Edit Student Details' : 'Enroll New Student'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {editingStudent ? 'Update student academic and profile data' : 'Add a new student profile to MongoDB'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X size={16} />
              </button>
            </div>

            {modalErrors.submit && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl">
                {modalErrors.submit}
              </div>
            )}

            <form onSubmit={handleModalSubmit} noValidate className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={modalForm.name}
                    onChange={(e) => {
                      setModalForm({ ...modalForm, name: e.target.value });
                      if (modalErrors.name) setModalErrors({ ...modalErrors, name: '' });
                    }}
                    placeholder="e.g. Alex Johnson"
                    className={`w-full px-3.5 py-2 bg-slate-50 border rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-600 ${
                      modalErrors.name ? 'border-red-500' : 'border-slate-200'
                    }`}
                  />
                  {modalErrors.name && <p className="text-[11px] text-red-500 mt-0.5">{modalErrors.name}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Enrollment No *</label>
                  <input
                    type="text"
                    value={modalForm.enrollment}
                    onChange={(e) => {
                      setModalForm({ ...modalForm, enrollment: e.target.value });
                      if (modalErrors.enrollment) setModalErrors({ ...modalErrors, enrollment: '' });
                    }}
                    placeholder="e.g. 23018501210001"
                    className={`w-full px-3.5 py-2 bg-slate-50 border rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-600 ${
                      modalErrors.enrollment ? 'border-red-500' : 'border-slate-200'
                    }`}
                  />
                  {modalErrors.enrollment && <p className="text-[11px] text-red-500 mt-0.5">{modalErrors.enrollment}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={modalForm.email}
                  onChange={(e) => setModalForm({ ...modalForm, email: e.target.value })}
                  placeholder="e.g. student@campus.edu"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Department *</label>
                  <select
                    value={modalForm.department}
                    onChange={(e) => setModalForm({ ...modalForm, department: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                  >
                    {DEPARTMENT_OPTIONS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Semester *</label>
                  <select
                    value={modalForm.semester}
                    onChange={(e) => setModalForm({ ...modalForm, semester: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={`Semester ${s}`}>Semester {s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Division / Section</label>
                  <input
                    type="text"
                    value={modalForm.classSection}
                    onChange={(e) => setModalForm({ ...modalForm, classSection: e.target.value })}
                    placeholder="e.g. A, B"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password {editingStudent ? '(Leave blank to retain current)' : '(Optional)'}
                </label>
                <input
                  type="password"
                  value={modalForm.password}
                  onChange={(e) => setModalForm({ ...modalForm, password: e.target.value })}
                  placeholder={editingStudent ? '••••••••' : 'Default is enrollment number'}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      Saving...
                    </>
                  ) : (
                    <span>{editingStudent ? 'Save Changes' : 'Enroll Student'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
