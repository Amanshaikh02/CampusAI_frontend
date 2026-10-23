import React, { useState, useMemo, useEffect } from 'react';
import {
  GraduationCap, Building2, Search, Filter, RotateCcw,
  LayoutGrid, List, Plus, Check, Mail, BookOpen, Layers,
  Pencil, Trash2, X, AlertTriangle, ChevronLeft, ChevronRight
} from 'lucide-react';
import { DEPARTMENT_OPTIONS } from '../constants/departments';
import facultyService from '../services/facultyService';
import ConfirmModal from './common/ConfirmModal';
import Toast from './common/Toast';

export default function FacultyDirectorySection({
  faculty = [],
  // Form props
  isFormOpen,
  setIsFormOpen,
  faName, setFaName,
  faUsername, setFaUsername,
  faEmail, setFaEmail,
  faDepartment, setFaDepartment,
  faSemester, setFaSemester,
  faClassSection, setFaClassSection,
  faAssignedSubject, setFaAssignedSubject,
  faPassword, setFaPassword,
  faErrors, setFaErrors,
  faSuccess,
  handleAddFaculty
}) {
  // Local synchronized faculty list state
  const [facultyList, setFacultyList] = useState(faculty);

  useEffect(() => {
    if (faculty && Array.isArray(faculty)) {
      setFacultyList(faculty);
    }
  }, [faculty]);

  // Modal State (Add / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState(null);
  const [modalForm, setModalForm] = useState({
    name: '',
    username: '',
    email: '',
    department: 'AIML',
    semester: 'Semester 1',
    classSection: 'A',
    assignedSubject: '',
    password: ''
  });
  const [modalErrors, setModalErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Confirmation State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [facultyToDelete, setFacultyToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState('');

  const [selectedDept, setSelectedDept] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'

  const handleOpenCreateModal = () => {
    setEditingFaculty(null);
    setModalForm({
      name: '',
      username: '',
      email: '',
      department: selectedDept !== 'All' ? selectedDept : 'AIML',
      semester: 'Semester 1',
      classSection: 'A',
      assignedSubject: '',
      password: ''
    });
    setModalErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (fac) => {
    setEditingFaculty(fac);
    setModalForm({
      name: fac.name || '',
      username: fac.username || '',
      email: fac.email || '',
      department: fac.department || 'AIML',
      semester: fac.semester || 'Semester 1',
      classSection: fac.classSection || fac.section || 'A',
      assignedSubject: fac.assignedSubject || fac.subject || '',
      password: ''
    });
    setModalErrors({});
    setIsModalOpen(true);
  };

  const handleOpenDeleteModal = (fac) => {
    setFacultyToDelete(fac);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!facultyToDelete) return;
    try {
      setIsDeleting(true);
      const facId = facultyToDelete._id || facultyToDelete.id;
      await facultyService.deleteFaculty(facId);
      setFacultyList((prev) => prev.filter((f) => (f._id || f.id) !== facId));
      setToastMessage(`Faculty '${facultyToDelete.name}' deleted successfully!`);
      setIsDeleteModalOpen(false);
      setFacultyToDelete(null);
    } catch (err) {
      console.error('Error deleting faculty:', err);
      alert(err.response?.data?.message || err.message || 'Failed to delete faculty.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!modalForm.name.trim()) errs.name = 'Full name is required.';
    if (!modalForm.department) errs.department = 'Department is required.';

    if (Object.keys(errs).length > 0) {
      setModalErrors(errs);
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingFaculty) {
        const facId = editingFaculty._id || editingFaculty.id;
        const res = await facultyService.updateFaculty(facId, modalForm);
        const updated = res.data || res;
        setFacultyList((prev) =>
          prev.map((f) => ((f._id || f.id) === facId ? { ...f, ...updated } : f))
        );
        setToastMessage(`Faculty '${modalForm.name}' updated successfully!`);
      } else {
        const res = await facultyService.createFaculty(modalForm);
        const created = res.data || res;
        setFacultyList((prev) => [created, ...prev]);
        setToastMessage(`Faculty '${modalForm.name}' created successfully!`);
      }
      setIsModalOpen(false);
      setEditingFaculty(null);
    } catch (err) {
      console.error('Error saving faculty:', err);
      setModalErrors({
        submit: err.response?.data?.message || err.message || 'Failed to save faculty.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate distinct department counts from the faculty list
  const deptCounts = useMemo(() => {
    const counts = {};
    facultyList.forEach(f => {
      const dept = f.department || 'General';
      counts[dept] = (counts[dept] || 0) + 1;
    });
    return counts;
  }, [facultyList]);

  // Distinct departments present
  const availableDepts = useMemo(() => {
    const set = new Set(DEPARTMENT_OPTIONS);
    Object.keys(deptCounts).forEach(d => set.add(d));
    return Array.from(set).filter(Boolean);
  }, [deptCounts]);

  // Filtered faculty list based on department and search term
  const filteredFaculty = useMemo(() => {
    return facultyList.filter(f => {
      // Department filter
      if (selectedDept !== 'All') {
        const fDept = (f.department || '').trim().toLowerCase();
        if (fDept !== selectedDept.trim().toLowerCase()) return false;
      }

      // Search term filter
      if (searchTerm.trim()) {
        const q = searchTerm.trim().toLowerCase();
        const matchesName = (f.name || '').toLowerCase().includes(q);
        const matchesUsername = (f.username || '').toLowerCase().includes(q);
        const matchesEmail = (f.email || '').toLowerCase().includes(q);
        const matchesSubject = (f.assignedSubject || f.subject || '').toLowerCase().includes(q);
        if (!matchesName && !matchesUsername && !matchesEmail && !matchesSubject) return false;
      }

      return true;
    });
  }, [facultyList, selectedDept, searchTerm]);

  const isAnyFilterActive = selectedDept !== 'All' || searchTerm.trim() !== '';

  // Pagination State for Lazy Data Loading
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedDept, searchTerm, facultyList.length]);

  const totalFilteredRecords = filteredFaculty.length;
  const totalPages = Math.ceil(totalFilteredRecords / pageSize) || 1;

  const paginatedFaculty = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredFaculty.slice(start, start + pageSize);
  }, [filteredFaculty, currentPage, pageSize]);

  const handleResetFilters = () => {
    setSelectedDept('All');
    setSearchTerm('');
  };

  return (
    <div className="space-y-6">
      {/* =========================================================================
          FACULTY INSIGHT METRIC CARDS
          ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Faculty Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-md transition-all flex items-center justify-between group">
          <div>
            <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block">
              Total Faculty Staff
            </span>
            <div className="text-3xl font-black text-slate-900 mt-1 tracking-tight">
              {faculty.length}
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] text-purple-600 font-semibold mt-1">
              ✓ Appointed & Active
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
            <GraduationCap size={22} />
          </div>
        </div>

        {/* Departments Represented */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-md transition-all flex items-center justify-between group">
          <div>
            <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block">
              Academic Departments
            </span>
            <div className="text-3xl font-black text-slate-900 mt-1 tracking-tight">
              {Object.keys(deptCounts).length || 2}
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-medium mt-1">
              Active instructional faculties
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
            <Building2 size={22} />
          </div>
        </div>

        {/* Department Quick Filter Tags Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-md transition-all flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block">
              Department Breakdown
            </span>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {Object.entries(deptCounts).map(([dept, count]) => (
                <button
                  key={dept}
                  type="button"
                  onClick={() => setSelectedDept(dept)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    selectedDept === dept
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                  }`}
                >
                  <span>{dept}</span>
                  <span className="opacity-80">({count})</span>
                </button>
              ))}
              {Object.keys(deptCounts).length === 0 && (
                <span className="text-xs text-slate-400">No departments assigned yet.</span>
              )}
            </div>
          </div>
          <div className="text-[10px] text-slate-400 font-medium mt-2">
            Click any tag to filter directory
          </div>
        </div>
      </div>

      {/* =========================================================================
          COLLAPSIBLE "ADD NEW FACULTY" FORM
          ========================================================================= */}
      {isFormOpen && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-[0_2px_10px_rgba(0,0,0,0.03)] transition-all">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <Plus size={16} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Add Faculty Member</h3>
                <p className="text-xs text-slate-500">Register and assign course subjects to a new faculty staff</p>
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

          {faSuccess && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
              <Check size={16} className="text-emerald-600 shrink-0" />
              <span>{faSuccess}</span>
            </div>
          )}

          <form onSubmit={handleAddFaculty} noValidate className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Faculty Full Name *</label>
                <input
                  type="text"
                  value={faName}
                  onChange={(e) => {
                    setFaName(e.target.value);
                    if (faErrors.name) setFaErrors({ ...faErrors, name: '' });
                  }}
                  placeholder="e.g. Dr. Robert Vance"
                  className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 ${
                    faErrors.name ? 'border-red-500' : 'border-slate-200'
                  }`}
                />
                {faErrors.name && <p className="text-[11px] text-red-500 font-medium mt-1">{faErrors.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Username *</label>
                <input
                  type="text"
                  value={faUsername}
                  onChange={(e) => {
                    setFaUsername(e.target.value);
                    if (faErrors.username) setFaErrors({ ...faErrors, username: '' });
                  }}
                  placeholder="e.g. rvance"
                  className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 ${
                    faErrors.username ? 'border-red-500' : 'border-slate-200'
                  }`}
                />
                {faErrors.username && <p className="text-[11px] text-red-500 font-medium mt-1">{faErrors.username}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Default Password</label>
                <input
                  type="password"
                  value={faPassword}
                  onChange={(e) => setFaPassword(e.target.value)}
                  placeholder="Default: Faculty@123"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email Address *</label>
                <input
                  type="email"
                  value={faEmail}
                  onChange={(e) => {
                    setFaEmail(e.target.value);
                    if (faErrors.email) setFaErrors({ ...faErrors, email: '' });
                  }}
                  placeholder="robert.vance@campus.edu"
                  className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 ${
                    faErrors.email ? 'border-red-500' : 'border-slate-200'
                  }`}
                />
                {faErrors.email && <p className="text-[11px] text-red-500 font-medium mt-1">{faErrors.email}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Department *</label>
                <select
                  value={faDepartment}
                  onChange={(e) => {
                    setFaDepartment(e.target.value);
                    if (faErrors.department) setFaErrors({ ...faErrors, department: '' });
                  }}
                  className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 ${
                    faErrors.department ? 'border-red-500' : 'border-slate-200'
                  }`}
                >
                  <option value="">Select Department</option>
                  {DEPARTMENT_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                {faErrors.department && <p className="text-[11px] text-red-500 font-medium mt-1">{faErrors.department}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Semester Assigned *</label>
                <select
                  value={faSemester}
                  onChange={(e) => {
                    setFaSemester(e.target.value);
                    if (faErrors.semester) setFaErrors({ ...faErrors, semester: '' });
                  }}
                  className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 ${
                    faErrors.semester ? 'border-red-500' : 'border-slate-200'
                  }`}
                >
                  <option value="">Select Semester</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                    <option key={s} value={`Semester ${s}`}>Semester {s}</option>
                  ))}
                </select>
                {faErrors.semester && <p className="text-[11px] text-red-500 font-medium mt-1">{faErrors.semester}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Class / Section *</label>
                <input
                  type="text"
                  value={faClassSection}
                  onChange={(e) => {
                    setFaClassSection(e.target.value);
                    if (faErrors.classSection) setFaErrors({ ...faErrors, classSection: '' });
                  }}
                  placeholder="e.g. A or Section A"
                  className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 ${
                    faErrors.classSection ? 'border-red-500' : 'border-slate-200'
                  }`}
                />
                {faErrors.classSection && <p className="text-[11px] text-red-500 font-medium mt-1">{faErrors.classSection}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Assigned Subject *</label>
                <input
                  type="text"
                  value={faAssignedSubject}
                  onChange={(e) => {
                    setFaAssignedSubject(e.target.value);
                    if (faErrors.assignedSubject) setFaErrors({ ...faErrors, assignedSubject: '' });
                  }}
                  placeholder="e.g. MERN Stack or Cloud Computing"
                  className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 ${
                    faErrors.assignedSubject ? 'border-red-500' : 'border-slate-200'
                  }`}
                />
                {faErrors.assignedSubject && <p className="text-[11px] text-red-500 font-medium mt-1">{faErrors.assignedSubject}</p>}
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
                Register Faculty
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =========================================================================
          FACULTY FILTERS & VIEW MODE TOOLBAR
          ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Quick Search */}
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search faculty by name, username, subject, or email..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all"
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

          <div className="flex items-center gap-3">
            {/* Department Filter Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 whitespace-nowrap flex items-center gap-1.5">
                <Filter size={13} className="text-slate-400" />
                <span>Department:</span>
              </span>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className={`px-3 py-2 bg-slate-50 border rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 cursor-pointer ${
                  selectedDept !== 'All' ? 'border-purple-500 bg-purple-50/50 text-purple-900 font-bold' : 'border-slate-200'
                }`}
              >
                <option value="All">All Departments</option>
                {availableDepts.map(d => (
                  <option key={d} value={d}>
                    {d} {deptCounts[d] ? `(${deptCounts[d]})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* View Mode Toggle (Table / Grid) */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'table'
                    ? 'bg-white text-indigo-700 shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Table View"
              >
                <List size={16} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white text-indigo-700 shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Grid Cards View"
              >
                <LayoutGrid size={16} />
              </button>
            </div>

            {/* Reset Button */}
            {isAnyFilterActive && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all"
                title="Clear all filters"
              >
                <RotateCcw size={13} />
                <span>Reset</span>
              </button>
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
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-100">
                <span>Dept: {selectedDept}</span>
                <button type="button" onClick={() => setSelectedDept('All')} className="hover:text-purple-900">×</button>
              </span>
            )}
            {searchTerm && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700">
                <span>Search: "{searchTerm}"</span>
                <button type="button" onClick={() => setSearchTerm('')} className="hover:text-slate-900">×</button>
              </span>
            )}
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-[11px] font-semibold text-purple-600 hover:underline ml-1"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* =========================================================================
          FACULTY DATA PRESENTATION: TABLE OR CARD GRID
          ========================================================================= */}
      {filteredFaculty.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-16 text-center shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 mx-auto flex items-center justify-center mb-3">
            <GraduationCap size={28} />
          </div>
          <h4 className="text-sm font-bold text-slate-800">No faculty members found</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {isAnyFilterActive
              ? 'No faculty match your selected department filter or search criteria.'
              : 'No faculty members are registered yet. Click "Add Faculty" above to begin.'}
          </p>
          {isAnyFilterActive && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.03)] overflow-hidden">
          {/* Table Header Bar */}
          <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/50">
            <div className="flex items-center gap-2.5">
              <h3 className="text-sm font-bold text-slate-900">
                Manage Faculties Table
              </h3>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-100">
                {filteredFaculty.length} {filteredFaculty.length === 1 ? 'member' : 'members'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                Showing <strong className="text-slate-900 font-bold">{filteredFaculty.length}</strong> of{' '}
                <strong className="text-slate-900 font-bold">{facultyList.length}</strong> registered
              </span>
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-sm shadow-purple-600/20 flex items-center gap-1.5 transition-all"
              >
                <Plus size={14} />
                <span>+ Add New Faculty</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50/90 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200/70">
                <tr>
                  <th className="px-4 py-3.5 whitespace-nowrap">Faculty Member</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Username</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Department</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Semester</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Class / Section</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Assigned Subject</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Email Contact</th>
                  <th className="px-4 py-3.5 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {paginatedFaculty.map((f, index) => (
                  <tr
                    key={f._id || f.id || f.username || index}
                    className="hover:bg-purple-50/30 transition-colors"
                  >
                    {/* Name + Avatar */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs ring-2 ring-purple-50">
                          {(f.name || 'F').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block text-xs">
                            {f.name}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Verified Faculty
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Username */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="font-mono font-bold text-purple-700 bg-purple-50/90 border border-purple-100 px-2 py-0.5 rounded-md text-[11px]">
                        @{f.username}
                      </span>
                    </td>

                    {/* Department */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {f.department || 'General'}
                      </span>
                    </td>

                    {/* Semester */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-100">
                        {f.semester || 'All Semesters'}
                      </span>
                    </td>

                    {/* Class / Section */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                        {f.classSection || f.section || 'General'}
                      </span>
                    </td>

                    {/* Assigned Subject */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-purple-50 text-purple-800 border border-purple-100">
                        {f.assignedSubject || f.subject || '-'}
                      </span>
                    </td>

                    {/* Email */}
                    <td className="px-4 py-3.5 whitespace-nowrap text-slate-600">
                      {f.email ? (
                        <a
                          href={`mailto:${f.email}`}
                          className="text-slate-600 hover:text-purple-600 hover:underline"
                        >
                          {f.email}
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
                          onClick={() => handleOpenEditModal(f)}
                          className="p-1.5 text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-100"
                          title="Edit Faculty"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenDeleteModal(f)}
                          className="p-1.5 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-100"
                          title="Delete Faculty"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Controls Footer (Table View) */}
            {totalFilteredRecords > 0 && (
              <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-2 text-slate-500 font-medium">
                  <span>
                    Showing <strong className="text-slate-800 font-bold">{(currentPage - 1) * pageSize + 1}</strong> to{' '}
                    <strong className="text-slate-800 font-bold">{Math.min(currentPage * pageSize, totalFilteredRecords)}</strong> of{' '}
                    <strong className="text-slate-800 font-bold">{totalFilteredRecords}</strong> faculty
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

                <div className="flex items-center gap-1.5 self-center sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    className={`px-3 py-1.5 rounded-xl border flex items-center gap-1 font-semibold transition-all ${
                      currentPage <= 1
                        ? 'border-slate-200 text-slate-300 cursor-not-allowed bg-slate-50'
                        : 'border-slate-200 text-slate-700 hover:bg-white hover:border-slate-300'
                    }`}
                  >
                    <ChevronLeft size={14} />
                    <span>Previous</span>
                  </button>

                  <span className="text-xs font-bold text-slate-700 px-2">
                    Page {currentPage} of {totalPages}
                  </span>

                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                    className={`px-3 py-1.5 rounded-xl border flex items-center gap-1 font-semibold transition-all ${
                      currentPage >= totalPages
                        ? 'border-slate-200 text-slate-300 cursor-not-allowed bg-slate-50'
                        : 'border-slate-200 text-slate-700 hover:bg-white hover:border-slate-300'
                    }`}
                  >
                    <span>Next</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* GRID CARDS VIEW */
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {paginatedFaculty.map((f, index) => (
              <div
                key={f._id || f.id || f.username || index}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs ring-4 ring-purple-50">
                        {(f.name || 'F').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm group-hover:text-purple-600 transition-colors">
                          {f.name}
                        </h4>
                        <span className="font-mono text-[11px] text-purple-600 font-semibold block">
                          @{f.username}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(f)}
                        className="p-1.5 text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                        title="Edit Faculty"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenDeleteModal(f)}
                        className="p-1.5 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                        title="Delete Faculty"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Subject Details */}
                  <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 space-y-2 mb-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium flex items-center gap-1.5">
                        <BookOpen size={13} className="text-indigo-600" />
                        <span>Subject:</span>
                      </span>
                      <strong className="text-slate-900 font-bold truncate max-w-[150px]">
                        {f.assignedSubject || f.subject || 'Not allocated'}
                      </strong>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium flex items-center gap-1.5">
                        <Layers size={13} className="text-amber-600" />
                        <span>Semester & Class:</span>
                      </span>
                      <span className="text-slate-700 font-semibold">
                        {f.semester || 'N/A'} • Div {f.classSection || f.section || 'General'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contact Footer */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-500 truncate">
                    <Mail size={13} className="shrink-0 text-slate-400" />
                    <span className="truncate">{f.email || 'No email provided'}</span>
                  </div>
                  {f.email && (
                    <a
                      href={`mailto:${f.email}`}
                      className="text-[11px] font-bold text-purple-600 hover:text-purple-800 shrink-0 ml-2"
                    >
                      Email →
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls (Grid View) */}
          {totalFilteredRecords > 0 && (
            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
              <span className="text-slate-500 font-medium text-center sm:text-left">
                Page <strong className="text-slate-800 font-bold">{currentPage}</strong> of{' '}
                <strong className="text-slate-800 font-bold">{totalPages}</strong> ({totalFilteredRecords} faculty)
              </span>
              <div className="flex items-center gap-2 self-center sm:self-auto">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className={`px-3 py-1.5 rounded-xl border flex items-center gap-1 font-semibold transition-all ${
                    currentPage <= 1
                      ? 'border-slate-200 text-slate-300 cursor-not-allowed bg-slate-50'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <ChevronLeft size={14} />
                  <span>Previous</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className={`px-3 py-1.5 rounded-xl border flex items-center gap-1 font-semibold transition-all ${
                    currentPage >= totalPages
                      ? 'border-slate-200 text-slate-300 cursor-not-allowed bg-slate-50'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
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

      {/* Toast Notification */}
      <Toast message={toastMessage} onClose={() => setToastMessage('')} />

      {/* SweetAlert-style Safe Deletion Confirm Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Delete Faculty Record"
        message="Are you sure you want to delete this record? This action cannot be undone."
        itemName={facultyToDelete ? `${facultyToDelete.name} (@${facultyToDelete.username})` : ''}
        confirmText="Yes, Delete Faculty"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => {
          if (!isDeleting) {
            setIsDeleteModalOpen(false);
            setFacultyToDelete(null);
          }
        }}
      />

      {/* Create & Update Popup Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                  {editingFaculty ? <Pencil size={15} /> : <Plus size={16} />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {editingFaculty ? 'Edit Faculty Details' : 'Add New Faculty'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {editingFaculty ? 'Update faculty appointment and assigned subjects' : 'Register and assign course subjects to a new faculty staff'}
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
                    placeholder="e.g. Dr. Robert Vance"
                    className={`w-full px-3.5 py-2 bg-slate-50 border rounded-xl text-xs text-slate-900 focus:outline-none focus:border-purple-600 ${
                      modalErrors.name ? 'border-red-500' : 'border-slate-200'
                    }`}
                  />
                  {modalErrors.name && <p className="text-[11px] text-red-500 mt-0.5">{modalErrors.name}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Username *</label>
                  <input
                    type="text"
                    value={modalForm.username}
                    onChange={(e) => {
                      setModalForm({ ...modalForm, username: e.target.value });
                      if (modalErrors.username) setModalErrors({ ...modalErrors, username: '' });
                    }}
                    placeholder="e.g. rvance"
                    className={`w-full px-3.5 py-2 bg-slate-50 border rounded-xl text-xs text-slate-900 focus:outline-none focus:border-purple-600 ${
                      modalErrors.username ? 'border-red-500' : 'border-slate-200'
                    }`}
                  />
                  {modalErrors.username && <p className="text-[11px] text-red-500 mt-0.5">{modalErrors.username}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={modalForm.email}
                    onChange={(e) => setModalForm({ ...modalForm, email: e.target.value })}
                    placeholder="e.g. robert.vance@campus.edu"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Department *</label>
                  <select
                    value={modalForm.department}
                    onChange={(e) => {
                      setModalForm({ ...modalForm, department: e.target.value });
                      if (modalErrors.department) setModalErrors({ ...modalErrors, department: '' });
                    }}
                    className={`w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs text-slate-900 focus:outline-none focus:border-purple-600 ${
                      modalErrors.department ? 'border-red-500' : 'border-slate-200'
                    }`}
                  >
                    {DEPARTMENT_OPTIONS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  {modalErrors.department && <p className="text-[11px] text-red-500 mt-0.5">{modalErrors.department}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Semester Assigned</label>
                  <select
                    value={modalForm.semester}
                    onChange={(e) => setModalForm({ ...modalForm, semester: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-purple-600"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={`Semester ${s}`}>Semester {s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Class / Section</label>
                  <input
                    type="text"
                    value={modalForm.classSection}
                    onChange={(e) => setModalForm({ ...modalForm, classSection: e.target.value })}
                    placeholder="e.g. A, B"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-purple-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Subject</label>
                <input
                  type="text"
                  value={modalForm.assignedSubject}
                  onChange={(e) => setModalForm({ ...modalForm, assignedSubject: e.target.value })}
                  placeholder="e.g. Deep Learning, Data Structures"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password {editingFaculty ? '(Leave blank to retain current)' : '(Default: Faculty@123)'}
                </label>
                <input
                  type="password"
                  value={modalForm.password}
                  onChange={(e) => setModalForm({ ...modalForm, password: e.target.value })}
                  placeholder={editingFaculty ? '••••••••' : 'Faculty@123'}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-purple-600"
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
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      Saving...
                    </>
                  ) : (
                    <span>{editingFaculty ? 'Save Changes' : 'Create Faculty'}</span>
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
