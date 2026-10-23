import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  Clock,
  FileText,
  Calendar,
  AlertCircle,
  Eye,
  Search,
  Award,
  Save
} from 'lucide-react';
import assignmentService from '../services/assignmentService';

export default function AssignmentSubmissionsModal({ assignment, onClose, role = 'teacher' }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // 'all' | 'submitted' | 'not_submitted'
  const [search, setSearch] = useState('');
  const [selectedStudentSubmission, setSelectedStudentSubmission] = useState(null);
  const [gradingMarks, setGradingMarks] = useState('');
  const [gradingFeedback, setGradingFeedback] = useState('');
  const [gradingSaving, setGradingSaving] = useState(false);
  const [gradingSuccess, setGradingSuccess] = useState('');
  const [gradingError, setGradingError] = useState('');

  const assignmentId = assignment?._id || assignment?.id;

  const loadSubmissions = () => {
    if (!assignmentId) return;
    setLoading(true);
    setError('');

    assignmentService
      .getAssignmentSubmissions(assignmentId)
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load assignment submissions:', err);
        setError(err.response?.data?.message || err.message || 'Failed to load submissions.');
        setLoading(false);
      });
  };

  useEffect(() => {
    loadSubmissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignmentId]);

  if (!assignment) return null;

  const roster = data?.roster || [];
  const stats = data?.stats || {
    totalAssigned: roster.length,
    submittedCount: roster.filter((r) => r.isSubmitted).length,
    notSubmittedCount: roster.filter((r) => !r.isSubmitted).length,
    gradedCount: roster.filter((r) => r.status === 'Graded').length
  };

  const filteredRoster = roster.filter((item) => {
    if (
      search &&
      !item.studentName?.toLowerCase().includes(search.toLowerCase()) &&
      !item.studentEnrollment?.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    if (filter === 'submitted' && !item.isSubmitted) return false;
    if (filter === 'not_submitted' && item.isSubmitted) return false;
    return true;
  });

  const handleOpenStudentSubmission = (item) => {
    setSelectedStudentSubmission(item);
    setGradingMarks(item.marks || '');
    setGradingFeedback(item.feedback || '');
    setGradingSuccess('');
    setGradingError('');
  };

  const handleSaveGrade = async (e) => {
    e.preventDefault();
    if (!selectedStudentSubmission?.submissionId) {
      setGradingError('Cannot grade: student has not submitted yet.');
      return;
    }

    setGradingSaving(true);
    setGradingError('');
    setGradingSuccess('');

    try {
      await assignmentService.reviewSubmission(selectedStudentSubmission.submissionId, {
        marks: gradingMarks.trim(),
        feedback: gradingFeedback.trim()
      });
      setGradingSuccess('Grade and feedback saved successfully!');
      setTimeout(() => setGradingSuccess(''), 3000);
      loadSubmissions();
    } catch (err) {
      setGradingError(err.response?.data?.message || err.message || 'Failed to save grade.');
    } finally {
      setGradingSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-gray-100 p-6 sm:p-8 animate-in fade-in duration-200">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-bold px-2.5 py-0.5 bg-indigo-100 text-indigo-700 rounded-md uppercase">
                {assignment.department || assignment.targetDepartment || 'All Departments'}
              </span>
              <span className="text-[10px] font-bold px-2.5 py-0.5 bg-gray-100 text-gray-700 rounded-md">
                {assignment.subject}
              </span>
              {assignment.semester && (
                <span className="text-[10px] font-bold px-2.5 py-0.5 bg-blue-100 text-blue-700 rounded-md">
                  Semester {assignment.semester}
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">
              {assignment.title}
            </h2>
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
              <Calendar size={13} />
              Due: <strong>{assignment.dueDate}</strong> at <strong>{assignment.dueTime}</strong>
              <span className="text-gray-300">•</span>
              Created By: <strong>{assignment.createdBy || 'Faculty'}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 my-6">
          <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl">
            <span className="text-xs text-gray-500 font-medium block">Total Assigned</span>
            <span className="text-2xl font-black text-gray-900 mt-1 block">
              {stats.totalAssigned}
            </span>
          </div>
          <div className="p-4 bg-emerald-50/60 border border-emerald-100 rounded-2xl">
            <span className="text-xs text-emerald-700 font-semibold block">Submitted</span>
            <span className="text-2xl font-black text-emerald-800 mt-1 block">
              {stats.submittedCount}
            </span>
          </div>
          <div className="p-4 bg-amber-50/60 border border-amber-100 rounded-2xl">
            <span className="text-xs text-amber-700 font-semibold block">Not Submitted</span>
            <span className="text-2xl font-black text-amber-800 mt-1 block">
              {stats.notSubmittedCount}
            </span>
          </div>
          <div className="p-4 bg-purple-50/60 border border-purple-100 rounded-2xl">
            <span className="text-xs text-purple-700 font-semibold block">Graded & Reviewed</span>
            <span className="text-2xl font-black text-purple-800 mt-1 block">
              {stats.gradedCount || 0}
            </span>
          </div>
        </div>

        {/* Search & Tabs */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student name or enrollment..."
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl self-start sm:self-auto">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                filter === 'all'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All ({roster.length})
            </button>
            <button
              onClick={() => setFilter('submitted')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                filter === 'submitted'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Submitted ({stats.submittedCount})
            </button>
            <button
              onClick={() => setFilter('not_submitted')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                filter === 'not_submitted'
                  ? 'bg-white text-amber-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Pending ({stats.notSubmittedCount})
            </button>
          </div>
        </div>

        {/* Loading / Error States */}
        {loading ? (
          <div className="py-16 text-center text-gray-400 text-xs">
            <div className="animate-spin w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full mx-auto mb-2" />
            Loading student submissions...
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl flex items-center gap-2">
            <AlertCircle size={16} /> {error}
          </div>
        ) : filteredRoster.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-xs bg-gray-50 rounded-2xl border border-gray-100">
            No students found matching this criteria.
          </div>
        ) : (
          /* Student Roster Table */
          <div className="overflow-x-auto border border-gray-200/80 rounded-2xl">
            <table className="min-w-full text-left text-xs text-gray-700">
              <thead className="bg-gray-50 text-gray-900 font-bold border-b border-gray-200/80">
                <tr>
                  <th className="p-3.5">Student Name</th>
                  <th className="p-3.5">Enrollment No</th>
                  <th className="p-3.5">Department</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Marks / Score</th>
                  <th className="p-3.5">Submitted At</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {filteredRoster.map((item) => (
                  <tr key={item.studentEnrollment || item.studentId} className="hover:bg-gray-50/80 transition-colors">
                    <td className="p-3.5 font-bold text-gray-900">{item.studentName}</td>
                    <td className="p-3.5 font-mono text-gray-600">{item.studentEnrollment}</td>
                    <td className="p-3.5">{item.studentDepartment}</td>
                    <td className="p-3.5">
                      {item.status === 'Graded' ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 inline-flex items-center gap-1">
                          <Award size={11} /> Graded
                        </span>
                      ) : item.isSubmitted ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 inline-flex items-center gap-1">
                          <CheckCircle2 size={11} /> Submitted
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 inline-flex items-center gap-1">
                          <Clock size={11} /> Not Submitted
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 font-bold text-gray-800">
                      {item.marks ? `${item.marks} / ${assignment.totalMarks || 10}` : '—'}
                    </td>
                    <td className="p-3.5 text-gray-500 text-[11px]">
                      {item.submittedAt
                        ? new Date(item.submittedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
                        : '—'}
                    </td>
                    <td className="p-3.5 text-right">
                      {item.isSubmitted ? (
                        <button
                          type="button"
                          onClick={() => handleOpenStudentSubmission(item)}
                          className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold transition-colors inline-flex items-center gap-1.5"
                        >
                          <Eye size={13} /> {item.status === 'Graded' ? 'Review & Edit Grade' : 'Grade & View'}
                        </button>
                      ) : (
                        <span className="text-gray-400 text-xs italic">Awaiting</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Selected Student Answers Modal & Grading Form */}
        {selectedStudentSubmission && (
          <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[88vh] overflow-y-auto shadow-2xl p-6 sm:p-7 border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-gray-100">
                <div>
                  <h3 className="text-lg font-black text-gray-900">
                    {selectedStudentSubmission.studentName}'s Submission
                  </h3>
                  <p className="text-xs text-gray-500 font-mono mt-0.5">
                    Enrollment: <strong>{selectedStudentSubmission.studentEnrollment}</strong> • Department: <strong>{selectedStudentSubmission.studentDepartment}</strong>
                  </p>
                  <p className="text-[11px] text-emerald-700 mt-1 font-semibold flex items-center gap-1">
                    <CheckCircle2 size={12} /> Submitted on: {new Date(selectedStudentSubmission.submittedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedStudentSubmission(null)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Student Answers Display (Question by Question) */}
              <div className="my-5 space-y-4">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Submitted Answers:
                </h4>

                {Array.isArray(selectedStudentSubmission.answersList) && selectedStudentSubmission.answersList.length > 0 ? (
                  <div className="space-y-3">
                    {selectedStudentSubmission.answersList.map((item, idx) => (
                      <div key={item.questionId || idx} className="p-4 bg-gray-50 rounded-2xl border border-gray-200/80">
                        <div className="text-xs font-bold text-gray-900 mb-1.5 flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px]">
                            {idx + 1}
                          </span>
                          <span>{item.question || `Question ${idx + 1}`}</span>
                        </div>
                        <div className="pl-7 text-xs sm:text-sm text-gray-800 whitespace-pre-line leading-relaxed bg-white p-3 rounded-xl border border-gray-100">
                          {item.answer || <span className="text-gray-400 italic">No answer provided.</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl text-xs sm:text-sm text-gray-800 whitespace-pre-line leading-relaxed">
                    {selectedStudentSubmission.answers || 'No answer text entered.'}
                  </div>
                )}
              </div>

              {selectedStudentSubmission.fileName && (
                <div className="p-3.5 bg-indigo-50/50 border border-indigo-100 rounded-2xl flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-indigo-600" />
                    <span className="text-xs font-bold text-gray-800">{selectedStudentSubmission.fileName}</span>
                  </div>
                  {selectedStudentSubmission.fileData && (
                    <a
                      href={selectedStudentSubmission.fileData}
                      download={selectedStudentSubmission.fileName}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700"
                    >
                      Download File
                    </a>
                  )}
                </div>
              )}

              {/* Grading & Feedback Section */}
              <form onSubmit={handleSaveGrade} className="p-5 bg-purple-50/40 border border-purple-100 rounded-2xl space-y-4">
                <div className="flex items-center gap-2">
                  <Award size={18} className="text-purple-600" />
                  <h4 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider">
                    Grading & Faculty Feedback
                  </h4>
                </div>

                {gradingSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
                    <CheckCircle2 size={14} /> {gradingSuccess}
                  </div>
                )}
                {gradingError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs font-semibold rounded-xl flex items-center gap-2">
                    <AlertCircle size={14} /> {gradingError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Awarded Marks (Out of {assignment.totalMarks || 10})
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 8 or 8.5"
                      value={gradingMarks}
                      onChange={(e) => setGradingMarks(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Faculty Feedback
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Good explanation. Add more examples next time."
                      value={gradingFeedback}
                      onChange={(e) => setGradingFeedback(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={gradingSaving}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Save size={14} /> {gradingSaving ? 'Saving Grade...' : 'Save Grade & Feedback'}
                  </button>
                </div>
              </form>

              <div className="flex justify-end pt-4">
                <button
                  onClick={() => setSelectedStudentSubmission(null)}
                  className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition-colors"
                >
                  Back to Submissions List
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end pt-6 border-t border-gray-100 mt-6">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
