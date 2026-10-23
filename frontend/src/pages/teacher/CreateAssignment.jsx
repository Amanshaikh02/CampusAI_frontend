import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Layout from '../../components/Layout';
import {
  UploadCloud,
  FileText,
  Send,
  Plus,
  Trash2,
  Clock,
  BookOpen,
  HelpCircle,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import assignmentService from '../../services/assignmentService';
import attendanceService from '../../services/attendanceService';
import { DEPARTMENT_OPTIONS } from '../../constants/departments';

export default function TeacherCreateAssignment({ currentUser, assignments = [], setAssignments }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch faculty's authorized subjects
  const { data: mySubjects = [] } = useQuery({
    queryKey: ['mySubjects'],
    queryFn: () => attendanceService.getMySubjects()
  });

  const [title, setTitle] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [subject, setSubject] = useState('');
  const [department, setDepartment] = useState(currentUser?.department || 'AIML');
  const [semester, setSemester] = useState('7');
  const [selectedClass, setSelectedClass] = useState('Section A');
  const [instructions, setInstructions] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('23:59');
  const [totalMarks, setTotalMarks] = useState('10');
  const [audience, setAudience] = useState('Students');
  const priority = 'Med';
  const allowLate = false;
  const notify = true;

  // Dynamic questions list
  const [questionsList, setQuestionsList] = useState([
    { id: 'q-1', question: '', marks: 5 },
    { id: 'q-2', question: '', marks: 5 }
  ]);

  const [selectedFile, setSelectedFile] = useState(null);
  const [fileDataUrl, setFileDataUrl] = useState('');
  const [fileError, setFileError] = useState('');
  const [errors, setErrors] = useState({});

  // Auto-fill when assigned subject is selected
  const handleSubjectChange = (subjName) => {
    setSubject(subjName);
    const found = mySubjects.find((s) => s.subject === subjName);
    if (found) {
      if (found.department) setDepartment(found.department);
      if (found.semester) setSemester(String(found.semester));
      if (found.classSection) setSelectedClass(found.classSection);
      setSelectedSubjectId(found._id);
    }
  };

  React.useEffect(() => {
    if (mySubjects.length > 0 && !subject) {
      handleSubjectChange(mySubjects[0].subject);
    } else if (!subject && currentUser?.assignedSubject) {
      setSubject(currentUser.assignedSubject);
      if (currentUser.department) setDepartment(currentUser.department);
      if (currentUser.semester) setSemester(String(currentUser.semester).replace(/[^0-9]/g, '') || '7');
      if (currentUser.classSection) setSelectedClass(currentUser.classSection);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mySubjects, currentUser]);

  // Add new question field
  const handleAddQuestion = () => {
    setQuestionsList((prev) => [
      ...prev,
      { id: `q-${prev.length + 1}-${Date.now()}`, question: '', marks: 5 }
    ]);
  };

  // Remove question field
  const handleRemoveQuestion = (index) => {
    if (questionsList.length <= 1) return;
    setQuestionsList((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Update specific question
  const handleQuestionTextChange = (index, value) => {
    setQuestionsList((prev) => {
      const copy = [...prev];
      copy[index].question = value;
      return copy;
    });
  };

  const handleQuestionMarksChange = (index, value) => {
    setQuestionsList((prev) => {
      const copy = [...prev];
      copy[index].marks = Number(value) || 0;
      return copy;
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      setSelectedFile(null);
      setFileDataUrl('');
      return;
    }

    const allowedTypes = ['.pdf', '.ppt', '.pptx', '.doc', '.docx', '.png', '.jpg'];
    const fileNameLower = file.name.toLowerCase();
    const isAllowed = allowedTypes.some((ext) => fileNameLower.endsWith(ext));

    if (!isAllowed) {
      setFileError('Allowed formats: PDF, PPT, PPTX, DOC, DOCX, PNG, JPG.');
      setSelectedFile(null);
      setFileDataUrl('');
      return;
    }

    setFileError('');
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = () => {
      setFileDataUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFileDataUrl('');
    setFileError('');
  };

  const createAssignmentMutation = useMutation({
    mutationFn: (data) => assignmentService.createAssignment(data),
    onSuccess: (newRec) => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      if (setAssignments) setAssignments((prev) => [newRec, ...prev]);
      navigate('/teacher/assignments');
    },
    onError: (err) => {
      alert(err.response?.data?.message || err.message || 'Failed to publish assignment.');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!title.trim()) newErrors.title = 'Assignment title is required.';
    if (!subject.trim()) newErrors.subject = 'Subject is required.';
    if (!dueDate) newErrors.dueDate = 'Due date is required.';
    if (!dueTime) newErrors.dueTime = 'Due time is required.';

    const validQuestions = questionsList.filter((q) => q.question.trim());
    if (validQuestions.length === 0) {
      newErrors.questions = 'Please enter at least one assignment question.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const ext = selectedFile ? selectedFile.name.split('.').pop().toUpperCase() : null;

    createAssignmentMutation.mutate({
      title: title.trim(),
      subject: subject.trim(),
      subjectId: selectedSubjectId || null,
      department,
      semester: Number(semester),
      class: selectedClass.trim() || `${department} - Sem ${semester}`,
      instructions: instructions.trim(),
      description: instructions.trim(),
      questionsList: validQuestions,
      questions: validQuestions.map((q, i) => `Q${i + 1}. ${q.question}`).join('\n'),
      totalMarks: Number(totalMarks) || validQuestions.reduce((acc, q) => acc + (q.marks || 5), 0),
      dueDate,
      dueTime,
      priority,
      status: 'Published',
      targetDepartment: department,
      targetRole: audience,
      audience,
      targetType: department === 'All Departments' ? 'all' : 'department',
      fileName: selectedFile ? selectedFile.name : null,
      fileType: ext,
      fileSize: selectedFile ? (selectedFile.size / 1024).toFixed(1) + ' KB' : null,
      fileData: fileDataUrl || null,
      allowLate,
      notify,
      createdBy: currentUser?.name || 'Faculty',
      createdByRole: 'faculty'
    });
  };

  return (
    <Layout role="teacher" currentUser={currentUser}>
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold tracking-wider text-indigo-600 uppercase">
              FACULTY COURSEWORK
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Create & Publish Assignment
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Formulate assignment questions, configure due dates, and dispatch coursework to your student cohort.
          </p>
        </div>
      </div>

      {/* Main Form Card */}
      <form
        onSubmit={handleSubmit}
        noValidate
        className="bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-8 shadow-sm max-w-4xl space-y-8"
      >
        {/* Section 1: Basic Details */}
        <div className="space-y-4">
          <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-3 flex items-center gap-2">
            <BookOpen size={16} className="text-indigo-600" /> Coursework Metadata
          </h2>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Assignment Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) setErrors({ ...errors, title: '' });
              }}
              placeholder="e.g., MERN Assignment 1: Components and State Management"
              className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 ${
                errors.title ? 'border-red-500' : 'border-gray-200 focus:ring-indigo-500/20'
              }`}
            />
            {errors.title && <p className="text-xs text-red-500 font-medium mt-1">{errors.title}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Subject *
              </label>
              {mySubjects.length > 0 ? (
                <select
                  value={subject}
                  onChange={(e) => {
                    handleSubjectChange(e.target.value);
                    if (errors.subject) setErrors({ ...errors, subject: '' });
                  }}
                  className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl text-xs font-medium text-gray-800 focus:outline-none ${
                    errors.subject ? 'border-red-500' : 'border-gray-200'
                  }`}
                >
                  <option value="">-- Choose Subject --</option>
                  {mySubjects.map((s) => (
                    <option key={s._id} value={s.subject}>
                      {s.subject} ({s.department} Sem {s.semester})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => {
                    setSubject(e.target.value);
                    if (errors.subject) setErrors({ ...errors, subject: '' });
                  }}
                  placeholder="e.g. MERN"
                  className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl text-xs font-medium text-gray-800 focus:outline-none ${
                    errors.subject ? 'border-red-500' : 'border-gray-200'
                  }`}
                />
              )}
              {errors.subject && <p className="text-xs text-red-500 font-medium mt-1">{errors.subject}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Department *
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:outline-none"
              >
                {DEPARTMENT_OPTIONS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Semester *
              </label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:outline-none"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>
                    Semester {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Class / Section
              </label>
              <input
                type="text"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                placeholder="e.g. Section A or AIML - Sem 7"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Target Audience
              </label>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:outline-none"
              >
                <option value="Students">Students Only</option>
                <option value="Students & Faculty">Students & Faculty</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Questions Builder */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <HelpCircle size={16} className="text-indigo-600" /> Assignment Questions
            </h2>
            <button
              type="button"
              onClick={handleAddQuestion}
              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
            >
              <Plus size={14} /> Add Another Question
            </button>
          </div>

          <p className="text-xs text-gray-500">
            Formulate each question for the student. Students will be required to answer each question individually.
          </p>

          {errors.questions && (
            <p className="text-xs text-red-500 font-semibold">{errors.questions}</p>
          )}

          <div className="space-y-3">
            {questionsList.map((q, index) => (
              <div
                key={q.id || index}
                className="p-4 bg-gray-50 rounded-2xl border border-gray-200/80 flex flex-col sm:flex-row items-start sm:items-center gap-3 transition-all"
              >
                <span className="w-7 h-7 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  {index + 1}
                </span>

                <div className="flex-1 w-full">
                  <input
                    type="text"
                    placeholder={`e.g. Question ${index + 1}: Explain React components.`}
                    value={q.question}
                    onChange={(e) => handleQuestionTextChange(index, e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] text-gray-500 font-medium">Marks:</span>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={q.marks}
                    onChange={(e) => handleQuestionMarksChange(index, e.target.value)}
                    className="w-16 px-2 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-center focus:outline-none"
                  />

                  {questionsList.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(index)}
                      className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                      title="Remove question"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Additional Instructions / Guidelines (Optional)
            </label>
            <textarea
              rows={3}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. Please provide well-commented code snippets or concise paragraphs for your answers."
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        {/* Section 3: Due Dates & Configuration */}
        <div className="space-y-4">
          <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-3 flex items-center gap-2">
            <Clock size={16} className="text-indigo-600" /> Deadline & Evaluation
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Due Date *
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => {
                  setDueDate(e.target.value);
                  if (errors.dueDate) setErrors({ ...errors, dueDate: '' });
                }}
                className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl text-xs font-medium text-gray-800 focus:outline-none ${
                  errors.dueDate ? 'border-red-500' : 'border-gray-200'
                }`}
              />
              {errors.dueDate && <p className="text-xs text-red-500 font-medium mt-1">{errors.dueDate}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Due Time *
              </label>
              <input
                type="time"
                value={dueTime}
                onChange={(e) => {
                  setDueTime(e.target.value);
                  if (errors.dueTime) setErrors({ ...errors, dueTime: '' });
                }}
                className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl text-xs font-medium text-gray-800 focus:outline-none ${
                  errors.dueTime ? 'border-red-500' : 'border-gray-200'
                }`}
              />
              {errors.dueTime && <p className="text-xs text-red-500 font-medium mt-1">{errors.dueTime}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Total Marks
              </label>
              <input
                type="number"
                min="1"
                value={totalMarks}
                onChange={(e) => setTotalMarks(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 4: File Attachment */}
        <div className="space-y-4">
          <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-3 flex items-center gap-2">
            <UploadCloud size={16} className="text-indigo-600" /> Reference Material / Attachment (Optional)
          </h2>

          {!selectedFile ? (
            <div className="border-2 border-dashed border-gray-200 hover:border-indigo-400 rounded-2xl p-6 text-center transition-colors">
              <UploadCloud size={32} className="mx-auto text-gray-400 mb-2" />
              <p className="text-xs font-bold text-gray-700">Upload assignment reference file</p>
              <p className="text-[11px] text-gray-400 mt-0.5">PDF, DOC, DOCX, PPT, PPTX up to 10MB</p>
              <input
                type="file"
                id="assignment-file"
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.ppt,.pptx,.doc,.docx,.png,.jpg"
              />
              <label
                htmlFor="assignment-file"
                className="mt-3 inline-block px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl cursor-pointer transition-colors"
              >
                Browse File
              </label>
            </div>
          ) : (
            <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileText size={20} className="text-indigo-600" />
                <div>
                  <span className="text-xs font-bold text-gray-900 block">{selectedFile.name}</span>
                  <span className="text-[10px] text-gray-500">{(selectedFile.size / 1024).toFixed(1)} KB</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRemoveFile}
                className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {fileError && <p className="text-xs text-red-500 font-medium">{fileError}</p>}
        </div>

        {/* Action Buttons */}
        <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
          <button
            type="button"
            onClick={() => navigate('/teacher/assignments')}
            className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createAssignmentMutation.isLoading}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Send size={15} />
            {createAssignmentMutation.isLoading ? 'Publishing Coursework...' : 'Publish Assignment'}
          </button>
        </div>
      </form>
    </Layout>
  );
}
