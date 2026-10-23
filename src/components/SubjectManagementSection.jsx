import React, { useState, useEffect, useMemo } from 'react';
import {
  BookMarked, Plus, Pencil, Trash2, Search, X, Check,
  BookOpen, Building2, Filter, Layers, CheckCircle2, ChevronLeft, ChevronRight
} from 'lucide-react';
import academicService from '../services/academicService';
import ConfirmModal from './common/ConfirmModal';
import Toast from './common/Toast';
import { DEPARTMENT_OPTIONS } from '../constants/departments';

export default function SubjectManagementSection({
  initialSubjects = []
}) {
  const [subjects, setSubjects] = useState(initialSubjects);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedType, setSelectedType] = useState('All');

  // Modal State (Add / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [modalForm, setModalForm] = useState({
    code: '',
    name: '',
    dept: 'All Departments',
    type: 'Core'
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Confirmation State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState('');

  // Fetch subjects on mount
  useEffect(() => {
    let isMounted = true;
    const fetchSubjects = async () => {
      try {
        setLoading(true);
        const data = await academicService.getSubjects();
        if (isMounted && Array.isArray(data)) {
          setSubjects(data);
        }
      } catch (err) {
        console.error('Error loading subjects:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchSubjects();
    return () => {
      isMounted = false;
    };
  }, []);

  // Sync if initialSubjects changes and local list is empty
  useEffect(() => {
    if (initialSubjects.length > 0 && subjects.length === 0) {
      setSubjects(initialSubjects);
    }
  }, [initialSubjects]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingSubject(null);
    setModalForm({
      code: '',
      name: '',
      dept: 'All Departments',
      type: 'Core'
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Open Edit Modal with auto-populated data
  const handleOpenEditModal = (sub) => {
    setEditingSubject(sub);
    setModalForm({
      code: sub.code || '',
      name: sub.name || '',
      dept: sub.dept || 'All Departments',
      type: sub.type || 'Core'
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Open Delete Confirmation
  const handleOpenDeleteModal = (sub) => {
    setSubjectToDelete(sub);
    setIsDeleteModalOpen(true);
  };

  // Handle Form Submit (POST / PUT)
  const handleModalSubmit = async (e) => {
    e.preventDefault();
    const errors = {};

    if (!modalForm.code.trim()) errors.code = 'Subject code is required.';
    if (!modalForm.name.trim()) errors.name = 'Subject name is required.';
    if (!modalForm.dept) errors.dept = 'Department is required.';
    if (!modalForm.type) errors.type = 'Type is required.';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingSubject) {
        // PUT update
        const updated = await academicService.updateSubject(editingSubject._id || editingSubject.id, modalForm);
        const updatedItem = updated || { ...editingSubject, ...modalForm };
        setSubjects((prev) =>
          prev.map((s) => ((s._id || s.id) === (editingSubject._id || editingSubject.id) ? updatedItem : s))
        );
        setToastMessage(`Subject '${modalForm.name}' updated successfully!`);
      } else {
        // POST create
        const created = await academicService.createSubject(modalForm);
        const newItem = created || { ...modalForm, _id: Date.now().toString() };
        setSubjects((prev) => [newItem, ...prev]);
        setToastMessage(`Subject '${modalForm.name}' created successfully!`);
      }

      setIsModalOpen(false);
      setEditingSubject(null);
    } catch (err) {
      console.error('Error saving subject:', err);
      setFormErrors({
        submit: err.response?.data?.message || err.message || 'Failed to save subject.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Confirmation (DELETE)
  const handleConfirmDelete = async () => {
    if (!subjectToDelete) return;
    try {
      setIsDeleting(true);
      await academicService.deleteSubject(subjectToDelete._id || subjectToDelete.id);
      setSubjects((prev) =>
        prev.filter((s) => (s._id || s.id) !== (subjectToDelete._id || subjectToDelete.id))
      );
      setToastMessage(`Subject '${subjectToDelete.name}' deleted successfully!`);
      setIsDeleteModalOpen(false);
      setSubjectToDelete(null);
    } catch (err) {
      console.error('Error deleting subject:', err);
      alert(err.response?.data?.message || err.message || 'Failed to delete subject.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered list
  const filteredSubjects = useMemo(() => {
    return subjects.filter((s) => {
      if (selectedDept !== 'All') {
        const d = (s.dept || '').toLowerCase();
        if (d !== selectedDept.toLowerCase() && d !== 'all departments') return false;
      }
      if (selectedType !== 'All') {
        if ((s.type || '').toLowerCase() !== selectedType.toLowerCase()) return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.trim().toLowerCase();
        const codeMatch = (s.code || '').toLowerCase().includes(q);
        const nameMatch = (s.name || '').toLowerCase().includes(q);
        const deptMatch = (s.dept || '').toLowerCase().includes(q);
        if (!codeMatch && !nameMatch && !deptMatch) return false;
      }
      return true;
    });
  }, [subjects, selectedDept, selectedType, searchTerm]);

  // Pagination State for Lazy Data Loading
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedDept, selectedType, searchTerm, subjects.length]);

  const totalFilteredRecords = filteredSubjects.length;
  const totalPages = Math.ceil(totalFilteredRecords / pageSize) || 1;

  const paginatedSubjects = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSubjects.slice(start, start + pageSize);
  }, [filteredSubjects, currentPage, pageSize]);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      <Toast message={toastMessage} onClose={() => setToastMessage('')} />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Delete Subject"
        message="Are you sure you want to delete this record? This action cannot be undone."
        itemName={subjectToDelete ? `${subjectToDelete.code} - ${subjectToDelete.name}` : ''}
        confirmText="Yes, Delete Subject"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => {
          if (!isDeleting) {
            setIsDeleteModalOpen(false);
            setSubjectToDelete(null);
          }
        }}
      />

      {/* Header with Prominent "+ Add New Subject" Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold tracking-wider text-indigo-600 uppercase">
            ACADEMIC CONFIGURATION
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
            Manage Subjects
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Configure core curriculum, electives, and department subjects with full CRUD capabilities.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 flex items-center gap-2 self-start sm:self-auto transition-all"
        >
          <Plus size={16} />
          <span>+ Add New Subject</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Subjects
            </span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">
              {subjects.length}
            </span>
            <span className="text-xs text-indigo-600 font-semibold">Active in system</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <BookMarked size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Core Modules
            </span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">
              {subjects.filter((s) => (s.type || '').toLowerCase() === 'core').length}
            </span>
            <span className="text-xs text-emerald-600 font-semibold">Compulsory courses</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <BookOpen size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Electives & Labs
            </span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">
              {subjects.filter((s) => (s.type || '').toLowerCase() !== 'core').length}
            </span>
            <span className="text-xs text-purple-600 font-semibold">Specialized tracks</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Layers size={22} />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by code, subject name, or department..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-600"
          >
            <option value="All">All Departments</option>
            {DEPARTMENT_OPTIONS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-600"
          >
            <option value="All">All Types</option>
            <option value="Core">Core</option>
            <option value="Elective">Elective</option>
            <option value="Lab">Lab</option>
          </select>

          {(selectedDept !== 'All' || selectedType !== 'All' || searchTerm) && (
            <button
              type="button"
              onClick={() => {
                setSelectedDept('All');
                setSelectedType('All');
                setSearchTerm('');
              }}
              className="text-xs text-indigo-600 font-bold hover:underline px-2 py-1"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* HTML Data Table with Dedicated Actions Column */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">Subjects Directory Table</h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
              {filteredSubjects.length} records
            </span>
          </div>
        </div>

        {filteredSubjects.length === 0 ? (
          <div className="py-16 text-center px-4">
            <BookMarked size={36} className="mx-auto mb-2 text-slate-300" />
            <h4 className="text-sm font-bold text-slate-700">No subjects found</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              No subject matches the selected filters. Click "+ Add New Subject" above to add one.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50/90 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200/70">
                <tr>
                  <th className="px-4 py-3.5 whitespace-nowrap">Subject Code</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Subject Name</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Department</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Type</th>
                  <th className="px-4 py-3.5 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {paginatedSubjects.map((sub) => (
                  <tr key={sub._id || sub.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="font-mono font-bold text-indigo-700 bg-indigo-50/80 border border-indigo-100 px-2 py-0.5 rounded-md text-[11px]">
                        {sub.code}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap font-bold text-slate-900">
                      {sub.name}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-100">
                        {sub.dept || 'All Departments'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                          sub.type === 'Core'
                            ? 'bg-blue-50 text-blue-700 border border-blue-100'
                            : sub.type === 'Lab'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            : 'bg-amber-50 text-amber-700 border border-amber-100'
                        }`}
                      >
                        {sub.type || 'Core'}
                      </span>
                    </td>
                    {/* Dedicated Actions Column */}
                    <td className="px-4 py-3.5 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(sub)}
                          className="p-1.5 text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Edit Subject"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenDeleteModal(sub)}
                          className="p-1.5 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                          title="Delete Subject"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Controls Footer */}
            {totalFilteredRecords > 0 && (
              <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-2 text-slate-500 font-medium">
                  <span>
                    Showing <strong className="text-slate-800 font-bold">{(currentPage - 1) * pageSize + 1}</strong> to{' '}
                    <strong className="text-slate-800 font-bold">{Math.min(currentPage * pageSize, totalFilteredRecords)}</strong> of{' '}
                    <strong className="text-slate-800 font-bold">{totalFilteredRecords}</strong> subjects
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
        )}
      </div>

      {/* =========================================================================
          POPUP MODAL: ADD / EDIT SUBJECT
          ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  {editingSubject ? <Pencil size={15} /> : <Plus size={16} />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {editingSubject ? 'Edit Subject' : 'Add New Subject'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {editingSubject ? 'Modify existing subject configuration' : 'Create a new course subject module'}
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

            {formErrors.submit && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl">
                {formErrors.submit}
              </div>
            )}

            {/* Modal Form */}
            <form onSubmit={handleModalSubmit} noValidate className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Subject Code *</label>
                <input
                  type="text"
                  value={modalForm.code}
                  onChange={(e) => {
                    setModalForm({ ...modalForm, code: e.target.value });
                    if (formErrors.code) setFormErrors({ ...formErrors, code: '' });
                  }}
                  placeholder="e.g. CS201"
                  className={`w-full px-3.5 py-2 bg-slate-50 border rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-600 ${
                    formErrors.code ? 'border-red-500' : 'border-slate-200'
                  }`}
                />
                {formErrors.code && <p className="text-[11px] text-red-500 mt-0.5">{formErrors.code}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Subject Name *</label>
                <input
                  type="text"
                  value={modalForm.name}
                  onChange={(e) => {
                    setModalForm({ ...modalForm, name: e.target.value });
                    if (formErrors.name) setFormErrors({ ...formErrors, name: '' });
                  }}
                  placeholder="e.g. Deep Learning & Neural Networks"
                  className={`w-full px-3.5 py-2 bg-slate-50 border rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-600 ${
                    formErrors.name ? 'border-red-500' : 'border-slate-200'
                  }`}
                />
                {formErrors.name && <p className="text-[11px] text-red-500 mt-0.5">{formErrors.name}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Department *</label>
                  <select
                    value={modalForm.dept}
                    onChange={(e) => {
                      setModalForm({ ...modalForm, dept: e.target.value });
                      if (formErrors.dept) setFormErrors({ ...formErrors, dept: '' });
                    }}
                    className={`w-full px-3.5 py-2 bg-slate-50 border rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-600 ${
                      formErrors.dept ? 'border-red-500' : 'border-slate-200'
                    }`}
                  >
                    {DEPARTMENT_OPTIONS.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                  {formErrors.dept && <p className="text-[11px] text-red-500 mt-0.5">{formErrors.dept}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Type *</label>
                  <select
                    value={modalForm.type}
                    onChange={(e) => {
                      setModalForm({ ...modalForm, type: e.target.value });
                      if (formErrors.type) setFormErrors({ ...formErrors, type: '' });
                    }}
                    className={`w-full px-3.5 py-2 bg-slate-50 border rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-600 ${
                      formErrors.type ? 'border-red-500' : 'border-slate-200'
                    }`}
                  >
                    <option value="Core">Core</option>
                    <option value="Elective">Elective</option>
                    <option value="Lab">Lab</option>
                  </select>
                  {formErrors.type && <p className="text-[11px] text-red-500 mt-0.5">{formErrors.type}</p>}
                </div>
              </div>

              {/* Action Buttons */}
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
                    <span>{editingSubject ? 'Save Changes' : 'Create Subject'}</span>
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
