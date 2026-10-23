import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from '../../components/Layout';
import {
  Search,
  BookOpen,
  ClipboardList,
  CheckCircle2,
  Clock,
  FileText,
  AlertCircle,
  X,
  Send,
  GraduationCap,
  ChevronRight,
  ArrowLeft,
  Edit3,
  Award,
  MessageSquare,
  HelpCircle
} from 'lucide-react';
import assignmentService from '../../services/assignmentService';
import messageService from '../../services/messageService';
import {
  isDuePassed,
  isAssignmentSubmitted
} from '../../utils/visibility';

export default function StudentAssignments({ currentUser }) {
  const queryClient = useQueryClient();
  const studentEnrollment = currentUser?.enrollment || '';
  const studentDepartment = currentUser?.department || currentUser?.course || '';

  // Navigation state: selected teacher (null = Teachers list view, object = Teacher's assignments view)
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [teacherSearch, setTeacherSearch] = useState('');
  const [assignmentSearch, setAssignmentSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'pending' | 'submitted' | 'closed'

  // Assignment Details & Submission Modal
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [mySubmission, setMySubmission] = useState(null);
  const [isLoadingSubmission, setIsLoadingSubmission] = useState(false);
  const [isEditingAnswers, setIsEditingAnswers] = useState(false);

  // Question-by-question answer map: { [questionId]: answerText }
  const [questionAnswers, setQuestionAnswers] = useState({});
  const [generalAnswer, setGeneralAnswer] = useState('');
  const [submissionFile, setSubmissionFile] = useState(null);
  const [submissionFileData, setSubmissionFileData] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  // Message Teacher Modal State
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageTeacherTarget, setMessageTeacherTarget] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [messageSending, setMessageSending] = useState(false);
  const [messageSuccess, setMessageSuccess] = useState('');
  const [messageError, setMessageError] = useState('');

  // 1. Fetch relevant teachers for this student (Teacher-first view)
  const {
    data: teachers = [],
    isLoading: isLoadingTeachers
  } = useQuery({
    queryKey: ['studentTeachers', studentDepartment, studentEnrollment],
    queryFn: () => assignmentService.getTeachers()
  });

  // 2. Fetch all assignments applicable to this student
  const {
    data: allStudentAssignments = []
  } = useQuery({
    queryKey: ['assignments', studentDepartment, studentEnrollment],
    queryFn: () => assignmentService.getAssignments()
  });

  // Filter teachers by search
  const filteredTeachers = teachers.filter((t) => {
    if (!teacherSearch) return true;
    const q = teacherSearch.toLowerCase();
    return (
      t.facultyName?.toLowerCase().includes(q) ||
      t.subject?.toLowerCase().includes(q) ||
      t.department?.toLowerCase().includes(q)
    );
  });

  // Filter assignments for the selected teacher
  const teacherAssignments = allStudentAssignments.filter((a) => {
    if (!selectedTeacher) return false;
    const authorName = (a.createdBy || '').trim().toLowerCase();
    const authorUsername = (a.facultyUsername || '').trim().toLowerCase();
    const teacherName = (selectedTeacher.facultyName || '').trim().toLowerCase();
    const teacherUsername = (selectedTeacher.facultyUsername || '').trim().toLowerCase();
    const subjectName = (selectedTeacher.subject || '').trim().toLowerCase();

    const matchesTeacher =
      (selectedTeacher.facultyId && a.facultyId && String(a.facultyId) === String(selectedTeacher.facultyId)) ||
      (teacherName && authorName === teacherName) ||
      (teacherUsername && authorUsername === teacherUsername);

    const matchesSubject = !selectedTeacher.subject || (a.subject || '').trim().toLowerCase() === subjectName;

    return matchesTeacher || (authorName === teacherName && matchesSubject);
  });

  // Filter assignments by status and search
  const displayedAssignments = teacherAssignments.filter((a) => {
    if (
      assignmentSearch &&
      !a.title?.toLowerCase().includes(assignmentSearch.toLowerCase()) &&
      !a.subject?.toLowerCase().includes(assignmentSearch.toLowerCase())
    ) {
      return false;
    }

    const isSubmitted = a.isSubmitted || isAssignmentSubmitted(a, studentEnrollment);
    const isPast = a.isDuePassed || isDuePassed(a.dueDate, a.dueTime);

    if (statusFilter === 'pending' && (isSubmitted || isPast)) return false;
    if (statusFilter === 'submitted' && !isSubmitted) return false;
    if (statusFilter === 'closed' && (isSubmitted || !isPast)) return false;

    return true;
  });

  // Compute stats across all assignments
  const totalPending = allStudentAssignments.filter(
    (a) => !isAssignmentSubmitted(a, studentEnrollment) && !isDuePassed(a.dueDate, a.dueTime)
  ).length;
  const totalSubmitted = allStudentAssignments.filter((a) =>
    isAssignmentSubmitted(a, studentEnrollment)
  ).length;

  // Open assignment details & fetch student submission
  const handleOpenAssignment = async (assignment) => {
    setSelectedAssignment(assignment);
    setQuestionAnswers({});
    setGeneralAnswer('');
    setSubmissionFile(null);
    setSubmissionFileData('');
    setSubmitError('');
    setSubmitSuccess('');
    setIsEditingAnswers(false);
    setIsLoadingSubmission(true);

    try {
      const sub = await assignmentService.getMySubmission(assignment._id || assignment.id);
      setMySubmission(sub);

      if (sub) {
        if (Array.isArray(sub.answersList) && sub.answersList.length > 0) {
          const answerMap = {};
          sub.answersList.forEach((item) => {
            if (item.questionId) {
              answerMap[item.questionId] = item.answer || '';
            }
          });
          setQuestionAnswers(answerMap);
        } else if (sub.answers) {
          setGeneralAnswer(sub.answers);
        }
      } else {
        // Initialize blank answers map for questionsList
        const qList = getResolvedQuestionsList(assignment);
        const initialAnswers = {};
        qList.forEach((q) => {
          initialAnswers[q.id] = '';
        });
        setQuestionAnswers(initialAnswers);
      }
    } catch (err) {
      console.warn('Could not fetch student submission:', err);
      setMySubmission(null);
    } finally {
      setIsLoadingSubmission(false);
    }
  };

  const handleCloseAssignmentModal = () => {
    setSelectedAssignment(null);
    setMySubmission(null);
    setQuestionAnswers({});
    setGeneralAnswer('');
    setSubmitError('');
    setSubmitSuccess('');
    setIsEditingAnswers(false);
  };

  // Helper: Normalize questions list
  const getResolvedQuestionsList = (asg) => {
    if (!asg) return [];
    if (Array.isArray(asg.questionsList) && asg.questionsList.length > 0) {
      return asg.questionsList;
    }
    if (asg.questions) {
      const lines = asg.questions
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);
      return lines.map((q, idx) => ({
        id: `q-${idx + 1}`,
        question: q.replace(/^Q?\d+[.:\s-]+/i, '').trim() || q,
        marks: 5
      }));
    }
    if (asg.description) {
      return [
        {
          id: 'q-1',
          question: asg.description.trim(),
          marks: asg.totalMarks || 10
        }
      ];
    }
    return [];
  };

  // Submit Answer Mutation
  const submitMutation = useMutation({
    mutationFn: ({ id, payload }) => assignmentService.submitAssignment(id, payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['studentTeachers'] });
      setSubmitSuccess('Assignment submitted successfully!');
      setSubmitError('');
      setMySubmission(res.data);
      setIsEditingAnswers(false);

      // Dispatch event to update any dashboard pending count instantly
      window.dispatchEvent(
        new CustomEvent('assignment-status-changed', {
          detail: {
            assignmentId: selectedAssignment?._id || selectedAssignment?.id,
            studentEnrollment,
            isSubmitted: true
          }
        })
      );
    },
    onError: (err) => {
      setSubmitError(err.response?.data?.message || err.message || 'Failed to submit assignment.');
    }
  });

  const handleSubmitForm = (e) => {
    e.preventDefault();
    if (!selectedAssignment) return;

    const assignmentId = selectedAssignment._id || selectedAssignment.id;
    const questionsList = getResolvedQuestionsList(selectedAssignment);

    // Build answers list
    const preparedAnswersList = questionsList.map((q) => ({
      questionId: q.id,
      question: q.question,
      answer: (questionAnswers[q.id] || '').trim()
    }));

    // Check if at least one question has been answered
    const hasAnyAnswer =
      preparedAnswersList.some((a) => a.answer.length > 0) || generalAnswer.trim().length > 0;

    if (!hasAnyAnswer) {
      setSubmitError('Please write your answers before submitting.');
      return;
    }

    const payload = {
      answersList: preparedAnswersList,
      answers: preparedAnswersList
        .map((a, i) => `${a.question ? `Q${i + 1}: ${a.question}` : `Q${i + 1}`}\nAnswer: ${a.answer}`)
        .join('\n\n') || generalAnswer.trim(),
      fileName: submissionFile ? submissionFile.name : undefined,
      fileType: submissionFile ? submissionFile.name.split('.').pop().toUpperCase() : undefined,
      fileSize: submissionFile ? (submissionFile.size / 1024).toFixed(1) + ' KB' : undefined,
      fileData: submissionFileData || undefined
    };

    submitMutation.mutate({ id: assignmentId, payload });
  };

  const handleSubmissionFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      setSubmissionFile(null);
      setSubmissionFileData('');
      return;
    }
    setSubmissionFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setSubmissionFileData(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Open Message Teacher Modal
  const handleOpenMessageModal = (teacher, assignment = null) => {
    setMessageTeacherTarget({
      name: teacher?.facultyName || assignment?.createdBy || 'Faculty',
      id: teacher?.facultyUsername || teacher?.facultyId || assignment?.facultyUsername || assignment?.createdBy,
      subject: teacher?.subject || assignment?.subject || '',
      assignmentId: assignment?._id || assignment?.id || null,
      assignmentTitle: assignment?.title || ''
    });
    setMessageText('');
    setMessageSuccess('');
    setMessageError('');
    setShowMessageModal(true);
  };

  // Send Message Mutation
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim()) {
      setMessageError('Please enter your message.');
      return;
    }
    if (!messageTeacherTarget?.id) {
      setMessageError('Teacher recipient identifier not found.');
      return;
    }

    setMessageSending(true);
    setMessageError('');
    setMessageSuccess('');

    try {
      await messageService.sendMessage({
        senderId: studentEnrollment || currentUser?._id || 'student',
        senderName: currentUser?.name || 'Student',
        senderRole: 'student',
        receiverId: String(messageTeacherTarget.id).trim(),
        receiverName: messageTeacherTarget.name,
        receiverRole: 'teacher',
        assignmentId: messageTeacherTarget.assignmentId,
        subject: messageTeacherTarget.subject,
        department: studentDepartment,
        semester: currentUser?.semester ? Number(String(currentUser.semester).replace(/[^0-9]/g, '')) : null,
        message: messageText.trim()
      });

      setMessageSuccess(`Message sent to ${messageTeacherTarget.name} successfully!`);
      setMessageText('');
      setTimeout(() => {
        setShowMessageModal(false);
        setMessageSuccess('');
      }, 2000);
    } catch (err) {
      setMessageError(err.response?.data?.message || err.message || 'Failed to send message.');
    } finally {
      setMessageSending(false);
    }
  };

  return (
    <Layout role="student" currentUser={currentUser}>
      {/* Top Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold tracking-wider text-indigo-600 uppercase">
              GOOGLE CLASSROOM HUB
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            {selectedTeacher ? `${selectedTeacher.facultyName}'s Coursework` : 'Assignments'}
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {selectedTeacher
              ? `Review questions, solve assignments, and submit solutions for ${selectedTeacher.subject}.`
              : 'Select your instructor to access department coursework, solve questions, and submit assignments.'}
          </p>
        </div>

        {/* Global Stats */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-3.5 py-1.5 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm">
            <Clock size={14} className="text-amber-600" /> Pending: {totalPending}
          </span>
          <span className="px-3.5 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm">
            <CheckCircle2 size={14} className="text-emerald-600" /> Submitted: {totalSubmitted}
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: TEACHER-FIRST LIST VIEW (Requirement 6)                           */}
      {/* ========================================================================= */}
      {!selectedTeacher ? (
        <div className="space-y-6">
          {/* Search bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
              <input
                type="text"
                value={teacherSearch}
                onChange={(e) => setTeacherSearch(e.target.value)}
                placeholder="Search by instructor or subject..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
              />
            </div>
            <div className="text-xs text-gray-500 font-medium">
              Applicable Instructors: <strong className="text-gray-900">{filteredTeachers.length}</strong>
            </div>
          </div>

          {/* Teachers Grid */}
          {isLoadingTeachers ? (
            <div className="py-20 text-center text-gray-400 text-xs">
              <div className="animate-spin w-7 h-7 border-2 border-indigo-600 border-t-transparent rounded-full mx-auto mb-2" />
              Loading your faculty instructors...
            </div>
          ) : filteredTeachers.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-200/80 p-12 text-center text-gray-400 shadow-sm">
              <GraduationCap size={44} className="mx-auto mb-3 opacity-40 text-indigo-500" />
              <p className="text-base font-bold text-gray-800">No teachers found</p>
              <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                No faculty members are assigned to your department ({studentDepartment || 'All'}) and semester yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTeachers.map((teacher, idx) => {
                return (
                  <div
                    key={`${teacher.facultyName}_${teacher.subject}_${idx}`}
                    className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* Department / Semester pill */}
                      <div className="flex items-center justify-between gap-2 mb-4">
                        <span className="text-[10px] font-bold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg uppercase tracking-wider">
                          {teacher.department || studentDepartment || 'AIML'}
                        </span>
                        <span className="text-[10px] font-bold px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg">
                          Sem {teacher.semester || 7}
                        </span>
                      </div>

                      {/* Instructor Avatar + Name */}
                      <div className="flex items-center gap-3.5 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-black text-base flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                          {teacher.facultyName?.charAt(0) || 'F'}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-extrabold text-gray-900 text-base leading-tight truncate">
                            {teacher.facultyName}
                          </h3>
                          <p className="text-xs font-semibold text-indigo-600 truncate mt-0.5">
                            {teacher.subject}
                          </p>
                        </div>
                      </div>

                      {/* Academic Stats Box */}
                      <div className="grid grid-cols-2 gap-2 p-3 bg-gray-50 rounded-2xl border border-gray-100 text-xs mb-5">
                        <div className="p-2 bg-white rounded-xl border border-gray-100/80 text-center">
                          <span className="text-[10px] text-gray-400 font-semibold block">Total</span>
                          <span className="text-base font-extrabold text-gray-800">
                            {teacher.totalAssignments}
                          </span>
                        </div>
                        <div className="p-2 bg-white rounded-xl border border-gray-100/80 text-center">
                          <span className="text-[10px] text-amber-600 font-semibold block">Pending</span>
                          <span className="text-base font-extrabold text-amber-700">
                            {teacher.pendingAssignments}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Button: View Assignments */}
                    <div className="pt-2 border-t border-gray-100 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedTeacher(teacher)}
                        className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2"
                      >
                        <BookOpen size={14} /> View Assignments <ChevronRight size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenMessageModal(teacher)}
                        className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors"
                        title={`Message ${teacher.facultyName}`}
                      >
                        <MessageSquare size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ========================================================================= */
        /* VIEW 2: TEACHER'S APPLICABLE ASSIGNMENTS VIEW (Requirement 7)             */
        /* ========================================================================= */
        <div className="space-y-6">
          {/* Back Navigation & Teacher Banner */}
          <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <button
                type="button"
                onClick={() => setSelectedTeacher(null)}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 mb-2 transition-colors"
              >
                <ArrowLeft size={14} /> Back to All Teachers
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                  {selectedTeacher.facultyName?.charAt(0) || 'F'}
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-gray-900 leading-snug">
                    {selectedTeacher.facultyName}
                  </h2>
                  <p className="text-xs text-gray-500 font-medium">
                    Subject: <strong className="text-indigo-600">{selectedTeacher.subject}</strong> • {selectedTeacher.department || studentDepartment} (Sem {selectedTeacher.semester || 7})
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 self-stretch sm:self-auto">
              <button
                type="button"
                onClick={() => handleOpenMessageModal(selectedTeacher)}
                className="flex-1 sm:flex-none px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border border-indigo-200"
              >
                <MessageSquare size={15} /> Message Teacher
              </button>
            </div>
          </div>

          {/* Search & Status Filter Tabs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
              <input
                type="text"
                value={assignmentSearch}
                onChange={(e) => setAssignmentSearch(e.target.value)}
                placeholder="Search coursework title..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
              />
            </div>

            <div className="flex items-center gap-1 bg-gray-100/90 p-1 rounded-2xl self-start sm:self-auto">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  statusFilter === 'all'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                All ({teacherAssignments.length})
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  statusFilter === 'pending'
                    ? 'bg-white text-amber-800 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Pending ({teacherAssignments.filter((a) => !isAssignmentSubmitted(a, studentEnrollment) && !isDuePassed(a.dueDate, a.dueTime)).length})
              </button>
              <button
                onClick={() => setStatusFilter('submitted')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  statusFilter === 'submitted'
                    ? 'bg-white text-emerald-800 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Submitted ({teacherAssignments.filter((a) => isAssignmentSubmitted(a, studentEnrollment)).length})
              </button>
              <button
                onClick={() => setStatusFilter('closed')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  statusFilter === 'closed'
                    ? 'bg-white text-red-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Closed ({teacherAssignments.filter((a) => !isAssignmentSubmitted(a, studentEnrollment) && isDuePassed(a.dueDate, a.dueTime)).length})
              </button>
            </div>
          </div>

          {/* Teacher Assignments Grid */}
          {displayedAssignments.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-200/80 p-12 text-center text-gray-400 shadow-sm">
              <ClipboardList size={40} className="mx-auto mb-2 opacity-40 text-indigo-500" />
              <p className="text-base font-bold text-gray-800">No assignments found</p>
              <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                {statusFilter === 'pending'
                  ? `Great job! You have no pending coursework for ${selectedTeacher.subject}.`
                  : statusFilter === 'submitted'
                  ? `You have not submitted any assignments for ${selectedTeacher.subject} yet.`
                  : `No assignments currently published by ${selectedTeacher.facultyName} match this criteria.`}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedAssignments.map((asg) => {
                const isSubmitted = asg.isSubmitted || isAssignmentSubmitted(asg, studentEnrollment);
                const isPast = asg.isDuePassed || isDuePassed(asg.dueDate, asg.dueTime);
                const isGraded = asg.status === 'Graded' || (asg.marks !== undefined && asg.marks !== null && asg.marks !== '');

                let badge = (
                  <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-amber-100 text-amber-800 inline-flex items-center gap-1">
                    <Clock size={11} /> Pending
                  </span>
                );

                if (isGraded) {
                  badge = (
                    <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-purple-100 text-purple-800 inline-flex items-center gap-1">
                      <Award size={11} /> Graded ({asg.marks} / {asg.totalMarks || 10})
                    </span>
                  );
                } else if (isSubmitted) {
                  badge = (
                    <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-100 text-emerald-800 inline-flex items-center gap-1">
                      <CheckCircle2 size={11} /> Submitted
                    </span>
                  );
                } else if (isPast) {
                  badge = (
                    <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-red-100 text-red-800 inline-flex items-center gap-1">
                      <AlertCircle size={11} /> Closed
                    </span>
                  );
                }

                return (
                  <div
                    key={asg._id || asg.id}
                    className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        {badge}
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md">
                          {asg.subject}
                        </span>
                      </div>

                      <h3 className="font-bold text-gray-900 text-lg leading-snug mb-1">
                        {asg.title}
                      </h3>

                      <p className="text-gray-500 text-xs mb-4 line-clamp-3 leading-relaxed">
                        {asg.questions || asg.description}
                      </p>

                      <div className="space-y-1.5 text-xs text-gray-600 bg-gray-50/80 p-3.5 rounded-2xl mb-4 border border-gray-100">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400 font-medium">Due Date:</span>
                          <span className={`font-semibold ${isPast && !isSubmitted ? 'text-red-600' : 'text-gray-800'}`}>
                            {asg.dueDate} at {asg.dueTime}
                          </span>
                        </div>
                        {asg.fileName && (
                          <div className="flex items-center justify-between pt-1 border-t border-gray-200/50 truncate">
                            <span className="text-gray-400 font-medium">Attachment:</span>
                            <span className="text-indigo-600 font-medium truncate max-w-[150px] inline-flex items-center gap-1">
                              <FileText size={12} /> {asg.fileName}
                            </span>
                          </div>
                        )}
                        {isGraded && asg.marks && (
                          <div className="flex items-center justify-between pt-1 border-t border-purple-200 text-purple-700 font-bold">
                            <span>Marks Awarded:</span>
                            <span>{asg.marks} / {asg.totalMarks || 10}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-gray-100 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenAssignment(asg)}
                        className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2 ${
                          isSubmitted
                            ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : isPast
                            ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        }`}
                      >
                        {isSubmitted ? (
                          <>
                            <CheckCircle2 size={14} /> View Submission & Score
                          </>
                        ) : isPast ? (
                          <>
                            <AlertCircle size={14} /> View Questions (Closed)
                          </>
                        ) : (
                          <>
                            <Send size={14} /> Open & Submit Answers <ChevronRight size={14} />
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenMessageModal(selectedTeacher, asg)}
                        className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors"
                        title="Message teacher about this assignment"
                      >
                        <MessageSquare size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: ASSIGNMENT DETAILS & SOLVE/SUBMISSION MODAL (Requirements 9,10,11)  */}
      {/* ========================================================================= */}
      {selectedAssignment && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-gray-100 p-6 sm:p-8 animate-in fade-in duration-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-gray-100">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold px-2.5 py-0.5 bg-indigo-100 text-indigo-700 rounded-md uppercase">
                    {selectedAssignment.department || 'All Departments'}
                  </span>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 bg-gray-100 text-gray-700 rounded-md">
                    {selectedAssignment.subject}
                  </span>
                  {selectedAssignment.semester && (
                    <span className="text-[10px] font-bold px-2.5 py-0.5 bg-blue-100 text-blue-700 rounded-md">
                      Semester {selectedAssignment.semester}
                    </span>
                  )}
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 leading-snug">
                  {selectedAssignment.title}
                </h2>
                <p className="text-xs text-gray-500 mt-1 flex flex-wrap items-center gap-2">
                  <span>Instructor: <strong className="text-gray-800">{selectedAssignment.createdBy || 'Faculty'}</strong></span>
                  <span className="text-gray-300">•</span>
                  <span>Class: <strong>{selectedAssignment.class || 'Regular'}</strong></span>
                  <span className="text-gray-300">•</span>
                  <span>Due: <strong className={isDuePassed(selectedAssignment.dueDate, selectedAssignment.dueTime) ? 'text-red-600' : 'text-gray-800'}>
                    {selectedAssignment.dueDate} at {selectedAssignment.dueTime}
                  </strong></span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenMessageModal(selectedTeacher || { facultyName: selectedAssignment.createdBy }, selectedAssignment)}
                  className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                  title="Ask teacher a question regarding this assignment"
                >
                  <MessageSquare size={19} />
                </button>
                <button
                  type="button"
                  onClick={handleCloseAssignmentModal}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Reference Attachment (if any) */}
            {selectedAssignment.fileData && (
              <div className="my-4 p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                    <FileText size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">{selectedAssignment.fileName || 'Attached Coursework Resource'}</p>
                    <p className="text-[11px] text-gray-500">{selectedAssignment.fileSize || selectedAssignment.fileType || 'Document'}</p>
                  </div>
                </div>
                <a
                  href={selectedAssignment.fileData}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={selectedAssignment.fileName || 'assignment_document'}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  <FileText size={13} /> View / Download
                </a>
              </div>
            )}

            {/* Instructions (if any) */}
            {selectedAssignment.instructions && selectedAssignment.instructions !== selectedAssignment.questions && (
              <div className="my-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Instructions & Guidelines:
                </h4>
                <p className="text-xs text-gray-600 whitespace-pre-line leading-relaxed">
                  {selectedAssignment.instructions}
                </p>
              </div>
            )}

            {/* Loading Submission state */}
            {isLoadingSubmission ? (
              <div className="py-12 text-center text-gray-400 text-xs">
                <div className="animate-spin w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full mx-auto mb-2" />
                Loading your submission details...
              </div>
            ) : mySubmission && !isEditingAnswers ? (
              /* ========================================================================= */
              /* SUBMITTED VIEW: Show student's submitted answers, marks, and feedback      */
              /* ========================================================================= */
              <div className="space-y-6 my-4">
                {/* Submitted Banner */}
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <CheckCircle2 size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-emerald-900">Assignment Submitted</h4>
                      <p className="text-xs text-emerald-700">
                        Submitted at: {new Date(mySubmission.submittedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                      </p>
                    </div>
                  </div>

                  {/* Allow edit/resubmit if due date has NOT passed */}
                  {!isDuePassed(selectedAssignment.dueDate, selectedAssignment.dueTime) ? (
                    <button
                      type="button"
                      onClick={() => setIsEditingAnswers(true)}
                      className="px-3.5 py-2 bg-white hover:bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 self-start sm:self-auto"
                    >
                      <Edit3 size={13} /> Edit Submission
                    </button>
                  ) : (
                    <span className="text-[11px] font-semibold text-gray-400">
                      Submissions closed
                    </span>
                  )}
                </div>

                {/* Faculty Evaluation / Marks Banner (if reviewed) */}
                {mySubmission.status === 'Graded' || (mySubmission.marks && mySubmission.marks !== '') ? (
                  <div className="p-5 bg-purple-50/60 border border-purple-200 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2">
                      <Award size={18} className="text-purple-600" />
                      <h4 className="text-xs font-extrabold text-purple-900 uppercase tracking-wider">
                        Faculty Evaluation & Marks
                      </h4>
                    </div>
                    <div className="flex items-baseline gap-2 pt-1">
                      <span className="text-2xl font-black text-purple-900">
                        {mySubmission.marks}
                      </span>
                      <span className="text-xs font-bold text-purple-600">
                        / {selectedAssignment.totalMarks || 10} Marks
                      </span>
                    </div>
                    {mySubmission.feedback && (
                      <div className="pt-2 border-t border-purple-100 text-xs text-purple-900">
                        <span className="font-bold block mb-0.5">Faculty Feedback:</span>
                        <p className="bg-white/70 p-3 rounded-xl border border-purple-100 leading-relaxed font-medium">
                          {mySubmission.feedback}
                        </p>
                      </div>
                    )}
                  </div>
                ) : null}

                {/* Submitted Answers Display (Question by Question) */}
                <div className="space-y-4">
                  <h4 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <BookOpen size={15} className="text-indigo-600" /> Your Submitted Answers
                  </h4>

                  {Array.isArray(mySubmission.answersList) && mySubmission.answersList.length > 0 ? (
                    <div className="space-y-3">
                      {mySubmission.answersList.map((item, idx) => (
                        <div key={item.questionId || idx} className="p-4 bg-gray-50 rounded-2xl border border-gray-200/80">
                          <div className="text-xs font-bold text-gray-900 mb-2 flex items-center gap-2">
                            <span className="w-5 h-5 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px]">
                              {idx + 1}
                            </span>
                            <span>{item.question || `Question ${idx + 1}`}</span>
                          </div>
                          <div className="pl-7 text-xs sm:text-sm text-gray-800 whitespace-pre-line leading-relaxed bg-white p-3.5 rounded-xl border border-gray-100 font-medium">
                            {item.answer || <span className="text-gray-400 italic">No answer submitted.</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 text-xs sm:text-sm text-gray-800 whitespace-pre-line leading-relaxed font-medium">
                      {mySubmission.answers}
                    </div>
                  )}
                </div>

                {/* Attached solution file */}
                {mySubmission.fileName && (
                  <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-2xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-indigo-600" />
                      <span className="font-bold text-gray-800">{mySubmission.fileName}</span>
                    </div>
                    {mySubmission.fileData && (
                      <a
                        href={mySubmission.fileData}
                        download={mySubmission.fileName}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors"
                      >
                        Download
                      </a>
                    )}
                  </div>
                )}
              </div>
            ) : isDuePassed(selectedAssignment.dueDate, selectedAssignment.dueTime) && !isEditingAnswers ? (
              /* ========================================================================= */
              /* DUE DATE PASSED - SUBMISSION CLOSED (Requirement 12)                       */
              /* ========================================================================= */
              <div className="space-y-6 my-4">
                <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-center space-y-2">
                  <AlertCircle size={36} className="mx-auto text-red-500" />
                  <h4 className="text-base font-extrabold text-red-900">Due Date has Passed</h4>
                  <p className="text-xs text-red-700 max-w-md mx-auto leading-relaxed">
                    Due date has passed. Submission is closed for this assignment. The submission deadline was {selectedAssignment.dueDate} at {selectedAssignment.dueTime}.
                  </p>
                </div>

                {/* Questions preview */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Questions List:
                  </h4>
                  {getResolvedQuestionsList(selectedAssignment).map((q, idx) => (
                    <div key={q.id || idx} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-xs text-gray-800">
                      <span className="font-bold text-gray-900 block mb-1">
                        Question {idx + 1}: {q.question} ({q.marks || 5} Marks)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* ========================================================================= */
              /* ACTIVE SOLVING & SUBMISSION FORM (Requirements 10, 11, 14)                 */
              /* ========================================================================= */
              <form onSubmit={handleSubmitForm} className="space-y-6 my-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                    <HelpCircle size={15} className="text-indigo-600" />
                    {isEditingAnswers ? 'Edit Your Answers' : 'Solve Questions & Submit Answers'}
                  </h3>
                  {isEditingAnswers && (
                    <button
                      type="button"
                      onClick={() => setIsEditingAnswers(false)}
                      className="text-xs font-bold text-gray-500 hover:text-gray-900 underline"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>

                {/* Render questions list question-by-question */}
                <div className="space-y-4">
                  {getResolvedQuestionsList(selectedAssignment).map((q, idx) => (
                    <div
                      key={q.id || idx}
                      className="p-4 sm:p-5 bg-gray-50/80 rounded-2xl border border-gray-200/80 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <h4 className="text-xs sm:text-sm font-bold text-gray-900 leading-snug">
                            {q.question}
                          </h4>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-md shrink-0">
                          {q.marks || 5} Marks
                        </span>
                      </div>

                      <textarea
                        rows={4}
                        value={questionAnswers[q.id] || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setQuestionAnswers((prev) => ({ ...prev, [q.id]: val }));
                          if (submitError) setSubmitError('');
                        }}
                        placeholder={`Write your detailed answer for Question ${idx + 1}...`}
                        className="w-full p-3.5 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium"
                      />
                    </div>
                  ))}
                </div>

                {/* Optional File Attachment */}
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200/80">
                  <label className="block text-xs font-bold text-gray-800 mb-1">
                    Attach Solution File (Optional)
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                    onChange={handleSubmissionFileChange}
                    className="text-xs text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                  {submissionFile && (
                    <p className="text-[11px] text-gray-600 mt-1.5 font-semibold">
                      Attached: {submissionFile.name} ({(submissionFile.size / 1024).toFixed(1)} KB)
                    </p>
                  )}
                </div>

                {submitError && (
                  <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-2xl flex items-center gap-2">
                    <AlertCircle size={16} /> {submitError}
                  </div>
                )}

                {submitSuccess && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center gap-2">
                    <CheckCircle2 size={16} /> {submitSuccess}
                  </div>
                )}

                {/* Submit Actions */}
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleCloseAssignmentModal}
                    className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={submitMutation.isPending}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-2"
                  >
                    {submitMutation.isPending ? (
                      <>Submitting Answers...</>
                    ) : (
                      <>
                        <Send size={14} /> {isEditingAnswers ? 'Save Updated Answers' : 'Submit Assignment'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Modal Footer */}
            <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleOpenMessageModal(selectedTeacher || { facultyName: selectedAssignment.createdBy }, selectedAssignment)}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 transition-colors"
              >
                <MessageSquare size={14} /> Have a question? Message Teacher
              </button>

              <button
                type="button"
                onClick={handleCloseAssignmentModal}
                className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MESSAGE TEACHER MODAL (Requirement 17)                                    */}
      {/* ========================================================================= */}
      {showMessageModal && messageTeacherTarget && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-extrabold text-gray-900">
                  Message {messageTeacherTarget.name}
                </h3>
                <p className="text-xs text-indigo-600 font-semibold mt-0.5">
                  Subject: {messageTeacherTarget.subject || 'Coursework'}
                  {messageTeacherTarget.assignmentTitle && ` • Re: ${messageTeacherTarget.assignmentTitle}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowMessageModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSendMessage} className="space-y-4 my-4">
              <p className="text-xs text-gray-500">
                Send a question, doubt, or clarification to your teacher. This message will appear in your Messages thread.
              </p>

              <textarea
                rows={4}
                value={messageText}
                onChange={(e) => {
                  setMessageText(e.target.value);
                  if (messageError) setMessageError('');
                }}
                placeholder="e.g. Sir, I have a doubt regarding Question 2..."
                className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs sm:text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />

              {messageError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-center gap-1.5">
                  <AlertCircle size={14} /> {messageError}
                </div>
              )}

              {messageSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-1.5">
                  <CheckCircle2 size={14} /> {messageSuccess}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMessageModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={messageSending}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                >
                  <Send size={13} /> {messageSending ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
