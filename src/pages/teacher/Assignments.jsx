import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from '../../components/Layout';
import {
  Plus,
  GraduationCap,
  ClipboardList,
  Users,
  Eye,
  FileText,
  Search,
  Edit3,
  Trash2,
  MessageSquare,
  X,
  Send,
  AlertCircle,
  CheckCircle2,
  Save
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import assignmentService from '../../services/assignmentService';
import messageService from '../../services/messageService';
import AssignmentSubmissionsModal from '../../components/AssignmentSubmissionsModal';
import { DEPARTMENT_OPTIONS } from '../../constants/departments';

export default function TeacherAssignments({ currentUser, assignments = [] }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedAssignmentForReview, setSelectedAssignmentForReview] = useState(null);

  // Edit Assignment Modal State
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editSubject, setEditSubject] = useState('');
  const [editDepartment, setEditDepartment] = useState('AIML');
  const [editSemester, setEditSemester] = useState('7');
  const [editClass, setEditClass] = useState('');
  const [editInstructions, setEditInstructions] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editDueTime, setEditDueTime] = useState('23:59');
  const [editTotalMarks, setEditTotalMarks] = useState('10');
  const [editQuestionsList, setEditQuestionsList] = useState([]);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');

  // Delete Assignment Modal State
  const [deletingAssignment, setDeletingAssignment] = useState(null);

  // Broadcast Message Modal State (Requirement 18)
  const [broadcastTarget, setBroadcastTarget] = useState(null);
  const [broadcastText, setBroadcastText] = useState('');
  const [broadcastSending, setBroadcastSending] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState('');
  const [broadcastError, setBroadcastError] = useState('');

  // Fetch only this faculty's own assignments from MongoDB (enforced by backend)
  const { data: dbAssignments = [], isLoading } = useQuery({
    queryKey: ['assignments'],
    queryFn: () => assignmentService.getAssignments()
  });
  const activeAssignments = dbAssignments.length > 0 ? dbAssignments : assignments;

  const filteredAssignments = activeAssignments.filter((a) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      a.title?.toLowerCase().includes(q) ||
      a.subject?.toLowerCase().includes(q) ||
      a.department?.toLowerCase().includes(q) ||
      a.class?.toLowerCase().includes(q)
    );
  });

  // Open Edit Modal
  const handleOpenEdit = (a) => {
    setEditingAssignment(a);
    setEditTitle(a.title || '');
    setEditSubject(a.subject || '');
    setEditDepartment(a.department || 'AIML');
    setEditSemester(String(a.semester || 7));
    setEditClass(a.class || '');
    setEditInstructions(a.instructions || a.description || '');
    setEditDueDate(a.dueDate || '');
    setEditDueTime(a.dueTime || '23:59');
    setEditTotalMarks(String(a.totalMarks || 10));
    setEditError('');

    let qList = [];
    if (Array.isArray(a.questionsList) && a.questionsList.length > 0) {
      qList = a.questionsList.map((q) => ({ ...q }));
    } else if (a.questions) {
      const lines = a.questions.split('\n').map((l) => l.trim()).filter(Boolean);
      qList = lines.map((line, idx) => ({
        id: `q-${idx + 1}-${Date.now()}`,
        question: line.replace(/^Q?\d+[.:\s-]+/i, '').trim() || line,
        marks: 5
      }));
    } else {
      qList = [{ id: `q-1-${Date.now()}`, question: a.description || '', marks: 10 }];
    }
    setEditQuestionsList(qList);
  };

  // Add question to edit modal
  const handleAddEditQuestion = () => {
    setEditQuestionsList((prev) => [
      ...prev,
      { id: `q-${prev.length + 1}-${Date.now()}`, question: '', marks: 5 }
    ]);
  };

  const handleRemoveEditQuestion = (index) => {
    if (editQuestionsList.length <= 1) return;
    setEditQuestionsList((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Save Edit
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editTitle.trim()) {
      setEditError('Title is required.');
      return;
    }
    if (!editSubject.trim()) {
      setEditError('Subject is required.');
      return;
    }
    if (!editDueDate || !editDueTime) {
      setEditError('Due date and time are required.');
      return;
    }

    const validQuestions = editQuestionsList.filter((q) => q.question.trim());
    if (validQuestions.length === 0) {
      setEditError('Please enter at least one question.');
      return;
    }

    setEditSaving(true);
    setEditError('');

    try {
      await assignmentService.updateAssignment(editingAssignment._id || editingAssignment.id, {
        title: editTitle.trim(),
        subject: editSubject.trim(),
        department: editDepartment,
        semester: Number(editSemester),
        class: editClass.trim() || `${editDepartment} - Sem ${editSemester}`,
        instructions: editInstructions.trim(),
        description: editInstructions.trim(),
        questionsList: validQuestions,
        questions: validQuestions.map((q, i) => `Q${i + 1}. ${q.question}`).join('\n'),
        dueDate: editDueDate,
        dueTime: editDueTime,
        totalMarks: Number(editTotalMarks) || validQuestions.reduce((acc, q) => acc + (q.marks || 5), 0)
      });

      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      setEditingAssignment(null);
    } catch (err) {
      setEditError(err.response?.data?.message || err.message || 'Failed to update assignment.');
    } finally {
      setEditSaving(false);
    }
  };

  // Delete Assignment Mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => assignmentService.deleteAssignment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      setDeletingAssignment(null);
    },
    onError: (err) => {
      alert(err.response?.data?.message || err.message || 'Failed to delete assignment.');
    }
  });

  const handleConfirmDelete = () => {
    if (!deletingAssignment) return;
    deleteMutation.mutate(deletingAssignment._id || deletingAssignment.id);
  };

  // Open Broadcast Message Modal (Requirement 18)
  const handleOpenBroadcast = (asg) => {
    setBroadcastTarget(asg);
    setBroadcastText(`Regarding "${asg.title}": `);
    setBroadcastSuccess('');
    setBroadcastError('');
  };

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastText.trim()) {
      setBroadcastError('Please enter message content.');
      return;
    }

    setBroadcastSending(true);
    setBroadcastError('');
    setBroadcastSuccess('');

    try {
      const res = await messageService.sendMessage({
        senderId: currentUser?._id || currentUser?.username || 'faculty',
        senderName: currentUser?.name || 'Faculty',
        senderRole: 'teacher',
        broadcast: true,
        department: broadcastTarget?.department,
        semester: broadcastTarget?.semester,
        assignmentId: broadcastTarget?._id || broadcastTarget?.id,
        subject: broadcastTarget?.subject,
        message: broadcastText.trim()
      });

      setBroadcastSuccess(res.message || 'Message sent to all students in this class successfully!');
      setTimeout(() => {
        setBroadcastTarget(null);
        setBroadcastSuccess('');
      }, 2500);
    } catch (err) {
      setBroadcastError(err.response?.data?.message || err.message || 'Failed to broadcast message.');
    } finally {
      setBroadcastSending(false);
    }
  };

  return (
    <Layout role="teacher" currentUser={currentUser}>
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold tracking-wider text-indigo-600 uppercase">
              FACULTY PORTAL
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">My Assignments</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Manage your coursework, evaluate student answers, and broadcast notices to your classes.
          </p>
        </div>

        <button
          onClick={() => navigate('/teacher/assignments/create')}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-sm transition-all self-start sm:self-auto"
        >
          <Plus size={16} /> Create New Assignment
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, subject, class..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
          />
        </div>
        <div className="text-xs text-gray-500 font-medium">
          My Assignments: <strong className="text-gray-900">{activeAssignments.length}</strong>
        </div>
      </div>

      {/* Main Assignments List */}
      <div className="bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-8 shadow-sm">
        <h2 className="text-base font-extrabold text-gray-900 mb-5">Published Coursework</h2>

        {isLoading && activeAssignments.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-xs">
            <div className="animate-spin w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full mx-auto mb-2" />
            Loading your assignments...
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div className="py-14 text-center text-gray-400">
            <ClipboardList size={40} className="mx-auto mb-2 opacity-50 text-indigo-500" />
            <p className="text-base font-bold text-gray-800">No assignments created yet</p>
            <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
              Click &quot;Create New Assignment&quot; to publish questions and coursework for your students.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAssignments.map((a) => {
              const submittedCount = Array.isArray(a.submittedBy) ? a.submittedBy.length : (a.submissions?.length || 0);
              return (
                <div
                  key={a._id || a.id}
                  className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] font-bold px-2.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-lg uppercase tracking-wider">
                        {a.department || 'AIML'} • Sem {a.semester || 7}
                      </span>
                      <span className="text-[10px] font-semibold text-gray-400">
                        {a.targetRole || 'Students'}
                      </span>
                    </div>

                    <h3 className="font-extrabold text-gray-900 text-lg leading-snug mb-1">{a.title}</h3>

                    <p className="text-xs text-indigo-600 font-bold flex items-center gap-1.5 mb-3">
                      <GraduationCap size={14} /> {a.class} • {a.subject}
                    </p>

                    <p className="text-gray-500 text-xs mb-4 line-clamp-3 leading-relaxed">
                      {a.questions || a.description}
                    </p>

                    <div className="space-y-1.5 text-xs text-gray-600 bg-gray-50/80 p-3.5 rounded-2xl mb-4 border border-gray-100">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 font-medium">Due:</span>
                        <span className="font-bold text-gray-800">
                          {a.dueDate} {a.dueTime}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-gray-200/50">
                        <span className="text-gray-400 font-medium">Submissions:</span>
                        <span className="font-bold text-emerald-700 inline-flex items-center gap-1">
                          <Users size={12} /> {submittedCount} submitted
                        </span>
                      </div>
                      {a.fileName && (
                        <div className="flex items-center justify-between pt-1 border-t border-gray-200/50 truncate">
                          <span className="text-gray-400 font-medium">Attached:</span>
                          <span className="text-indigo-600 truncate max-w-[140px] inline-flex items-center gap-1 font-semibold">
                            <FileText size={11} /> {a.fileName}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 border-t border-gray-100 space-y-2">
                    <button
                      type="button"
                      onClick={() => setSelectedAssignmentForReview(a)}
                      className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2"
                    >
                      <Eye size={14} /> View Submissions & Review
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenBroadcast(a)}
                        className="flex-1 py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                        title="Broadcast message to this class"
                      >
                        <MessageSquare size={13} /> Message Class
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEdit(a)}
                        className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 rounded-xl transition-colors"
                        title="Edit Assignment"
                      >
                        <Edit3 size={15} />
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeletingAssignment(a)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                        title="Delete Assignment"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Submissions Review Modal */}
      {selectedAssignmentForReview && (
        <AssignmentSubmissionsModal
          assignment={selectedAssignmentForReview}
          onClose={() => setSelectedAssignmentForReview(null)}
          role="teacher"
        />
      )}

      {/* Edit Assignment Modal */}
      {editingAssignment && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 border border-gray-100 animate-in fade-in duration-200">
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-xl font-extrabold text-gray-900">Edit Assignment</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Update assignment metadata, instructions, and questions list.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingAssignment(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 my-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Assignment Title *</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Subject *</label>
                  <input
                    type="text"
                    value={editSubject}
                    onChange={(e) => setEditSubject(e.target.value)}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Class / Section</label>
                  <input
                    type="text"
                    value={editClass}
                    onChange={(e) => setEditClass(e.target.value)}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Department</label>
                  <select
                    value={editDepartment}
                    onChange={(e) => setEditDepartment(e.target.value)}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
                  >
                    {DEPARTMENT_OPTIONS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Semester</label>
                  <select
                    value={editSemester}
                    onChange={(e) => setEditSemester(e.target.value)}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={String(s)}>Sem {s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Total Marks</label>
                  <input
                    type="number"
                    value={editTotalMarks}
                    onChange={(e) => setEditTotalMarks(e.target.value)}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Due Date *</label>
                  <input
                    type="date"
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Due Time *</label>
                  <input
                    type="time"
                    value={editDueTime}
                    onChange={(e) => setEditDueTime(e.target.value)}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
                  />
                </div>
              </div>

              {/* Questions List */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-extrabold text-gray-900 uppercase">
                    Questions List ({editQuestionsList.length})
                  </label>
                  <button
                    type="button"
                    onClick={handleAddEditQuestion}
                    className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                  >
                    <Plus size={13} /> Add Question
                  </button>
                </div>

                {editQuestionsList.map((q, idx) => (
                  <div key={q.id || idx} className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      value={q.question}
                      onChange={(e) => {
                        const copy = [...editQuestionsList];
                        copy[idx].question = e.target.value;
                        setEditQuestionsList(copy);
                      }}
                      className="flex-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium"
                      placeholder={`Question ${idx + 1}...`}
                    />
                    <input
                      type="number"
                      value={q.marks}
                      onChange={(e) => {
                        const copy = [...editQuestionsList];
                        copy[idx].marks = Number(e.target.value) || 0;
                        setEditQuestionsList(copy);
                      }}
                      className="w-14 px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-center"
                      title="Marks"
                    />
                    {editQuestionsList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveEditQuestion(idx)}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Instructions / Guidelines</label>
                <textarea
                  rows={3}
                  value={editInstructions}
                  onChange={(e) => setEditInstructions(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium"
                  placeholder="Optional instructions for students..."
                />
              </div>

              {editError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                  <AlertCircle size={15} /> {editError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingAssignment(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                >
                  <Save size={14} /> {editSaving ? 'Saving Changes...' : 'Save Updates'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingAssignment && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mb-4">
              <Trash2 size={24} />
            </div>
            <h3 className="text-lg font-extrabold text-gray-900 mb-1">Delete Assignment?</h3>
            <p className="text-xs text-gray-500 leading-relaxed mb-4">
              Are you sure you want to delete <strong className="text-gray-800">"{deletingAssignment.title}"</strong>? If students have already submitted answers, the system will safely archive the assignment to preserve student submission history.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setDeletingAssignment(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleteMutation.isLoading}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                {deleteMutation.isLoading ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Class Broadcast Message Modal (Requirement 18) */}
      {broadcastTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-extrabold text-gray-900">
                  Message Students: {broadcastTarget.subject}
                </h3>
                <p className="text-xs text-indigo-600 font-semibold mt-0.5">
                  Target: {broadcastTarget.department || 'AIML'} Sem {broadcastTarget.semester || 7} ({broadcastTarget.class || 'All Students'})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBroadcastTarget(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSendBroadcast} className="space-y-4 my-4">
              <p className="text-xs text-gray-500">
                This notice will be dispatched directly to all students enrolled in this class ({broadcastTarget.department} Sem {broadcastTarget.semester}).
              </p>

              <textarea
                rows={4}
                value={broadcastText}
                onChange={(e) => {
                  setBroadcastText(e.target.value);
                  if (broadcastError) setBroadcastError('');
                }}
                placeholder="e.g. Tomorrow's MERN assignment submission deadline is 11:59 PM..."
                className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs sm:text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />

              {broadcastError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-center gap-1.5">
                  <AlertCircle size={14} /> {broadcastError}
                </div>
              )}

              {broadcastSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-1.5">
                  <CheckCircle2 size={14} /> {broadcastSuccess}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setBroadcastTarget(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={broadcastSending}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                >
                  <Send size={13} /> {broadcastSending ? 'Dispatching...' : 'Dispatch to Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
