import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from '../../components/Layout';
import { Plus, FileText, UploadCloud, Download } from 'lucide-react';
import materialService from '../../services/materialService';
import attendanceService from '../../services/attendanceService';

export default function TeacherMaterials({ currentUser, materials = [], setMaterials }) {
  const facultyDepartment = currentUser?.department || '';

  // Query faculty's authorized subjects
  const { data: mySubjects = [] } = useQuery({
    queryKey: ['mySubjects'],
    queryFn: () => attendanceService.getMySubjects()
  });

  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState(currentUser?.assignedSubject || '');
  const [category, setCategory] = useState('');
  const [targetType, setTargetType] = useState('department'); // 'all' | 'department' | 'individual'
  const [targetDepartment, setTargetDepartment] = useState(facultyDepartment || 'AIML');
  const [targetStudentEnrollment, setTargetStudentEnrollment] = useState('');
  const [audience, setAudience] = useState('Students');
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileDataUrl, setFileDataUrl] = useState('');
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (mySubjects.length > 0 && !subject) {
      setSubject(mySubjects[0].subject);
    } else if (!subject && currentUser?.assignedSubject) {
      setSubject(currentUser.assignedSubject);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mySubjects, currentUser]);

  const queryClient = useQueryClient();

  const { data: dbMaterials = [] } = useQuery({
    queryKey: ['materials', facultyDepartment],
    queryFn: () => materialService.getMaterials(facultyDepartment),
    initialData: materials
  });
  const activeMaterials = dbMaterials.length > 0 ? dbMaterials : materials;

  const createMaterialMutation = useMutation({
    mutationFn: (data) => materialService.createMaterial(data),
    onSuccess: (newMat) => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      if (setMaterials) setMaterials(prev => [newMat, ...prev]);
      setTitle('');
      setSubject('');
      setCategory('');
      setTargetStudentEnrollment('');
      setSelectedFile(null);
      setFileDataUrl('');
      setErrors({});
      setSuccess('Study material published successfully!');
      setTimeout(() => setSuccess(''), 4000);
    },
    onError: (err) => {
      alert(err.message || 'Failed to publish material.');
    }
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      setSelectedFile(null);
      setFileDataUrl('');
      return;
    }

    const allowedTypes = ['.pdf', '.ppt', '.pptx', '.doc', '.docx'];
    const fileNameLower = file.name.toLowerCase();
    const isAllowed = allowedTypes.some(ext => fileNameLower.endsWith(ext));

    if (!isAllowed) {
      setErrors(prev => ({ ...prev, file: 'Only PDF, PPT, PPTX, DOC and DOCX files are allowed.' }));
      setSelectedFile(null);
      setFileDataUrl('');
      return;
    }

    if (errors.file) setErrors(prev => ({ ...prev, file: '' }));
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = () => {
      setFileDataUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleAddMaterial = (e) => {
    e.preventDefault();
    const errs = {};
    if (!title.trim()) errs.title = 'Material title is required.';
    if (!subject.trim()) errs.subject = 'Subject is required.';
    if (!category) errs.category = 'Please select category.';
    if (targetType === 'individual' && !targetStudentEnrollment.trim()) {
      errs.targetStudentEnrollment = 'Student enrollment is required for individual target.';
    }
    if (!selectedFile) errs.file = 'Please select a file.';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      setSuccess('');
      return;
    }

    const ext = selectedFile ? selectedFile.name.split('.').pop().toUpperCase() : null;
    const resolvedEnrollment = targetType === 'individual' ? targetStudentEnrollment.trim() : '';

    createMaterialMutation.mutate({
      title: title.trim(),
      subject: subject.trim(),
      category,
      targetType,
      targetDepartment: targetType === 'all' ? 'All Departments' : targetDepartment,
      targetStudentEnrollment: resolvedEnrollment,
      student: resolvedEnrollment,
      audience,
      fileName: selectedFile ? selectedFile.name : null,
      fileType: ext,
      fileSize: selectedFile ? (selectedFile.size / 1024).toFixed(1) + ' KB' : null,
      fileData: fileDataUrl || null,
      description: fileDataUrl ? `File: ${selectedFile.name}` : '',
      uploadedBy: currentUser?.name || 'Faculty'
    });
  };

  return (
    <Layout role="teacher" currentUser={currentUser}>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Materials & Resource Library</h1>
          <p className="text-gray-500 text-sm mt-1">Upload and distribute course study materials.</p>
        </div>
      </div>

      {/* Upload Form */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm mb-8">
        <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Plus size={18} className="text-indigo-600" />
          Add Study Material
        </h2>
        {success && <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-xl">{success}</div>}

        <form onSubmit={handleAddMaterial} noValidate className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Material Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => { setTitle(e.target.value); if (errors.title) setErrors({...errors, title: ''}); }}
                placeholder="e.g. Chapter 1 Notes"
                className={`w-full px-3.5 py-2 bg-gray-50 border rounded-xl text-xs text-gray-900 focus:outline-none ${errors.title ? 'border-red-500' : 'border-gray-200'}`}
              />
              {errors.title && <p className="text-xs text-red-500 font-medium mt-1">{errors.title}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Subject *</label>
              {mySubjects.length > 0 ? (
                <select
                  value={subject}
                  onChange={(e) => { setSubject(e.target.value); if (errors.subject) setErrors({...errors, subject: ''}); }}
                  className={`w-full px-3.5 py-2 bg-gray-50 border rounded-xl text-xs text-gray-900 focus:outline-none ${errors.subject ? 'border-red-500' : 'border-gray-200'}`}
                >
                  <option value="">Select Assigned Subject</option>
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
                  onChange={(e) => { setSubject(e.target.value); if (errors.subject) setErrors({...errors, subject: ''}); }}
                  placeholder="e.g. MERN"
                  className={`w-full px-3.5 py-2 bg-gray-50 border rounded-xl text-xs text-gray-900 focus:outline-none ${errors.subject ? 'border-red-500' : 'border-gray-200'}`}
                />
              )}
              {errors.subject && <p className="text-xs text-red-500 font-medium mt-1">{errors.subject}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Category *</label>
              <select
                value={category}
                onChange={(e) => { setCategory(e.target.value); if (errors.category) setErrors({...errors, category: ''}); }}
                className={`w-full px-3.5 py-2 bg-gray-50 border rounded-xl text-xs text-gray-900 focus:outline-none ${errors.category ? 'border-red-500' : 'border-gray-200'}`}
              >
                <option value="">Select Category</option>
                <option value="Lecture Notes">Lecture Notes</option>
                <option value="Lab Manual">Lab Manual</option>
                <option value="Syllabus">Syllabus</option>
                <option value="Reference Text">Reference Text</option>
              </select>
              {errors.category && <p className="text-xs text-red-500 font-medium mt-1">{errors.category}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Target Scope *</label>
              <select
                value={targetType}
                onChange={(e) => {
                  setTargetType(e.target.value);
                  if (errors.targetStudentEnrollment) setErrors({ ...errors, targetStudentEnrollment: '' });
                }}
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none"
              >
                <option value="department">Specific Department</option>
                <option value="individual">Individual Student</option>
                <option value="all">All Departments (Public)</option>
              </select>
            </div>

            {targetType === 'individual' ? (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Target Student Enrollment *</label>
                <input
                  type="text"
                  value={targetStudentEnrollment}
                  onChange={(e) => {
                    setTargetStudentEnrollment(e.target.value);
                    if (errors.targetStudentEnrollment) setErrors({ ...errors, targetStudentEnrollment: '' });
                  }}
                  placeholder="e.g. ABC001"
                  className={`w-full px-3.5 py-2 bg-gray-50 border rounded-xl text-xs text-gray-900 focus:outline-none ${
                    errors.targetStudentEnrollment ? 'border-red-500' : 'border-gray-200'
                  }`}
                />
                {errors.targetStudentEnrollment && (
                  <p className="text-xs text-red-500 font-medium mt-1">{errors.targetStudentEnrollment}</p>
                )}
              </div>
            ) : targetType === 'department' ? (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Department *</label>
                <select
                  value={targetDepartment}
                  onChange={(e) => setTargetDepartment(e.target.value)}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none"
                >
                  <option value="AIML">AIML</option>
                  <option value="Cyber Security">Cyber Security</option>
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Audience</label>
                <select
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none"
                >
                  <option value="Students">Students Only</option>
                  <option value="Students & Faculty">Students & Faculty</option>
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Select File * (PDF, PPT, PPTX, DOC, DOCX)</label>
            <input
              type="file"
              accept=".pdf,.ppt,.pptx,.doc,.docx"
              onChange={handleFileChange}
              className={`w-full px-3.5 py-1.5 bg-gray-50 border rounded-xl text-xs text-gray-900 focus:outline-none ${errors.file ? 'border-red-500' : 'border-gray-200'}`}
            />
            {errors.file && <p className="text-xs text-red-500 font-medium mt-1">{errors.file}</p>}
          </div>

          <button type="submit" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm flex items-center gap-1.5">
            <UploadCloud size={16} /> Publish Material
          </button>
        </form>
      </div>

      {/* Materials List */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm">
        <h2 className="text-base font-bold text-gray-900 mb-4">Uploaded Course Materials</h2>
        {activeMaterials.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <FileText size={36} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold text-gray-600">No materials added yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeMaterials.map((m) => (
              <div key={m._id || m.id} className="p-4 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-900 text-xs">{m.title}</h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {m.subject} • {m.category} {m.fileName ? `• File: ${m.fileName}` : ''} {m.fileSize ? `(${m.fileSize})` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">{m.fileType || m.category}</span>
                  {m.fileData && (
                    <a
                      href={m.fileData}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={m.fileName}
                      className="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1"
                    >
                      <Download size={14} /> Download / View
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
