import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from '../../components/Layout';
import {
  Users, GraduationCap, BookOpen, BookMarked, SlidersHorizontal,
  ClipboardList, Megaphone, Settings, ArrowRight, Plus, FolderKanban, Calendar, Trash2
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { DEPARTMENT_OPTIONS, TARGET_DEPARTMENT_OPTIONS } from '../../constants/departments';
import timetableService from '../../services/timetableService';
import noticeService from '../../services/noticeService';
import eventService from '../../services/eventService';
import materialService from '../../services/materialService';
import markService from '../../services/markService';
import assignmentService from '../../services/assignmentService';
import academicService from '../../services/academicService';
import announcementService from '../../services/announcementService';
import authService from '../../services/authService';
import AssignmentSubmissionsModal from '../../components/AssignmentSubmissionsModal';
import AdminAttendance from './AdminAttendance';
import AdminAdvancedSearch from '../../components/AdminAdvancedSearch';
import DirectoryTabs from '../../components/DirectoryTabs';
import StudentDirectorySection from '../../components/StudentDirectorySection';
import FacultyDirectorySection from '../../components/FacultyDirectorySection';
import AdminTimetableSection from '../../components/AdminTimetableSection';
import ExpirationPicker, { formatFriendlyDateTime } from '../../components/ExpirationPicker';
import BulkMarksEntryGrid from '../../components/BulkMarksEntryGrid';
import StudentPerformanceDashboard from '../../components/analytics/StudentPerformanceDashboard';
import SubjectManagementSection from '../../components/SubjectManagementSection';
import ChatInterface from '../../components/chat/ChatInterface';

export default function AdminDashboard({
  currentUser,
  setCurrentUser,
  students = [], setStudents,
  faculty = [], setFaculty,
  courses = [], setCourses,
  subjects = [], setSubjects,
  classes = [], setClasses,
  attendance = [], setAttendance,
  marks = [], setMarks,
  notices = [], setNotices,
  announcements = [], setAnnouncements,
  materials = [], setMaterials,
  assignments = [], setAssignments,
  events = [], setEvents,
  timetables = [], setTimetables,
  sentTimetables = [], setSentTimetables
}) {
  const location = useLocation();
  const path = location.pathname;

  // Timetable State
  const [ttDate, setTtDate] = useState('');
  const [ttDay, setTtDay] = useState('');
  const [ttStartTime, setTtStartTime] = useState('');
  const [ttEndTime, setTtEndTime] = useState('');
  const [ttSubject, setTtSubject] = useState('');
  const [ttDepartment, setTtDepartment] = useState('AIML');
  const [ttSemester, setTtSemester] = useState('Semester 7');
  const [ttDivision, setTtDivision] = useState('A');
  const [ttFaculty, setTtFaculty] = useState('');
  const [ttRoomNumber, setTtRoomNumber] = useState('');
  const [ttSessionType, setTtSessionType] = useState('Theory');
  const [ttIsBreak, setTtIsBreak] = useState(false);
  const [ttErrors, setTtErrors] = useState({});
  const [ttSuccess, setTtSuccess] = useState('');
  const [sendTtModalOpen, setSendTtModalOpen] = useState(false);

  const [sendTtDept, setSendTtDept] = useState('AIML');
  const [sendTtAudience, setSendTtAudience] = useState('Students & Faculty');
  const [sendTtSemester, setSendTtSemester] = useState('Semester 7');
  const [sendTtDivision, setSendTtDivision] = useState('A');


  // Department Overview State
  const [selectedDeptView, setSelectedDeptView] = useState(null);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [adminMarksTab, setAdminMarksTab] = useState('analytics');

  // Student State
  const [stName, setStName] = useState('');
  const [stEnrollment, setStEnrollment] = useState('');
  const [stEmail, setStEmail] = useState('');
  const [stCourse, setStCourse] = useState('');
  const [stSemester, setStSemester] = useState('');
  const [stDepartment, setStDepartment] = useState('');
  const [stClassSection, setStClassSection] = useState('');
  const [stErrors, setStErrors] = useState({});
  const [stSuccess, setStSuccess] = useState('');
  const [isStudentFormOpen, setIsStudentFormOpen] = useState(false);

  // Faculty State
  const [faName, setFaName] = useState('');
  const [faUsername, setFaUsername] = useState('');
  const [faEmail, setFaEmail] = useState('');
  const [faDepartment, setFaDepartment] = useState('');
  const [faSemester, setFaSemester] = useState('');
  const [faClassSection, setFaClassSection] = useState('');
  const [faAssignedSubject, setFaAssignedSubject] = useState('');
  const [faPassword, setFaPassword] = useState('');
  const [faErrors, setFaErrors] = useState({});
  const [faSuccess, setFaSuccess] = useState('');
  const [isFacultyFormOpen, setIsFacultyFormOpen] = useState(false);


  // Courses State
  const [coCode, setCoCode] = useState('');
  const [coTitle, setCoTitle] = useState('');
  const [coDept, setCoDept] = useState('');
  const [coCredits, setCoCredits] = useState('');
  const [coErrors, setCoErrors] = useState({});
  const [coSuccess, setCoSuccess] = useState('');

  // Subjects State
  const [suCode, setSuCode] = useState('');
  const [suName, setSuName] = useState('');
  const [suDept, setSuDept] = useState('');
  const [suType, setSuType] = useState('');
  const [suErrors, setSuErrors] = useState({});
  const [suSuccess, setSuSuccess] = useState('');

  // Classes State
  const [clName, setClName] = useState('');
  const [clSection, setClSection] = useState('');
  const [clRoom, setClRoom] = useState('');
  const [clFaculty, setClFaculty] = useState('');
  const [clErrors, setClErrors] = useState({});
  const [clSuccess, setClSuccess] = useState('');



  // Marks State
  const [mkStudent, setMkStudent] = useState('');
  const [mkSubject, setMkSubject] = useState('');
  const [mkExam, setMkExam] = useState('');
  const [mkScore, setMkScore] = useState('');
  const [mkErrors, setMkErrors] = useState({});
  const [mkSuccess, setMkSuccess] = useState('');

  // Notices State
  const [noTitle, setNoTitle] = useState('');
  const [noCategory, setNoCategory] = useState('');
  const [noAudience, setNoAudience] = useState('');
  const [noTargetType, setNoTargetType] = useState('all');
  const [noTargetDepartment, setNoTargetDepartment] = useState('');
  const [noStudent, setNoStudent] = useState('');
  const [noContent, setNoContent] = useState('');
  const [noExpiresAt, setNoExpiresAt] = useState('');
  const [noErrors, setNoErrors] = useState({});
  const [noSuccess, setNoSuccess] = useState('');

  // Announcements State
  const [anTitle, setAnTitle] = useState('');
  const [anMessage, setAnMessage] = useState('');
  const [anDepartment, setAnDepartment] = useState('All Departments');
  const [anTargetRole, setAnTargetRole] = useState('Students & Faculty');
  const [anDate, setAnDate] = useState('');
  const [anTime, setAnTime] = useState('');
  const [anExpiresAt, setAnExpiresAt] = useState('');
  const [anFile, setAnFile] = useState(null);
  const [anErrors, setAnErrors] = useState({});
  const [anSuccess, setAnSuccess] = useState('');

  // Materials State
  const [maTitle, setMaTitle] = useState('');
  const [maSubject, setMaSubject] = useState('');
  const [maCategory, setMaCategory] = useState('');
  const [maTargetType, setMaTargetType] = useState('all');
  const [maTargetDepartment, setMaTargetDepartment] = useState('');
  const [maStudent, setMaStudent] = useState('');
  const [maLink, setMaLink] = useState('');
  const [maErrors, setMaErrors] = useState({});
  const [maSuccess, setMaSuccess] = useState('');

  // Assignments State
  const [asTitle, setAsTitle] = useState('');
  const [asClass, setAsClass] = useState('');
  const [asSubject, setAsSubject] = useState('');
  const [asDescription, setAsDescription] = useState('');
  const [asDueDate, setAsDueDate] = useState('');
  const [asDueTime, setAsDueTime] = useState('');
  const [asTargetType, setAsTargetType] = useState('all');
  const [asTargetDepartment, setAsTargetDepartment] = useState('');
  const [asStudent, setAsStudent] = useState('');
  const [asAudience, setAsAudience] = useState('Students');
  const [asSelectedAssignmentForReview, setAsSelectedAssignmentForReview] = useState(null);
  const [asFile, setAsFile] = useState(null);
  const [asFileData, setAsFileData] = useState('');
  const [asErrors, setAsErrors] = useState({});
  const [asSuccess, setAsSuccess] = useState('');

  // Settings State
  const [seInstName, setSeInstName] = useState('');
  const [seAcadYear, setSeAcadYear] = useState('');
  const [seEmail, setSeEmail] = useState('');
  const [seErrors, setSeErrors] = useState({});
  const [seSuccess, setSeSuccess] = useState('');

  // Event State
  const [evTitle, setEvTitle] = useState('');
  const [evCategory, setEvCategory] = useState('');
  const [evDate, setEvDate] = useState('');
  const [evStartTime, setEvStartTime] = useState('');
  const [evEndTime, setEvEndTime] = useState('');
  const [evVenue, setEvVenue] = useState('');
  const [evDescription, setEvDescription] = useState('');
  const [evOrganizer, setEvOrganizer] = useState('');
  const [evTargetType, setEvTargetType] = useState('all');
  const [evTargetDepartment, setEvTargetDepartment] = useState('');
  const [evStudent, setEvStudent] = useState('');
  const [evExpiresAt, setEvExpiresAt] = useState('');
  const [evErrors, setEvErrors] = useState({});
  const [evSuccess, setEvSuccess] = useState('');

  // Handlers
  const queryClient = useQueryClient();

  const { data: dbTimetableEntries = [] } = useQuery({
    queryKey: ['timetableEntries'],
    queryFn: timetableService.getEntries
  });

  const activeTimetables = Array.isArray(dbTimetableEntries) ? dbTimetableEntries : [];

  const createTimetableMutation = useMutation({
    mutationFn: (data) => timetableService.createEntry(data),
    onSuccess: (newEntry) => {
      queryClient.invalidateQueries({ queryKey: ['timetableEntries'] });
      setTimetables(prev => [newEntry, ...prev]);
      setTtSuccess(ttIsBreak ? 'Break slot added successfully.' : 'Timetable slot created successfully.');
      setTtStartTime(''); setTtEndTime(''); setTtSubject(''); setTtFaculty(''); setTtRoomNumber(''); setTtIsBreak(false); setTtErrors({});
      setTimeout(() => setTtSuccess(''), 4000);
    },
    onError: (err) => {
      alert(err.message || 'Failed to save timetable entry.');
    }
  });

  const deleteTimetableMutation = useMutation({
    mutationFn: (id) => timetableService.deleteEntry(id),
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['timetableEntries'] });
      setTimetables(prev => prev.filter(t => (t._id || t.id) !== deletedId));
    },
    onError: (err) => {
      alert(err.message || 'Failed to delete entry.');
    }
  });

  const sendTimetableMutation = useMutation({
    mutationFn: (data) => timetableService.sendTimetable(data),
    onSuccess: (sentDoc) => {
      queryClient.invalidateQueries({ queryKey: ['sentTimetables'] });
      setSentTimetables(prev => [...prev, sentDoc]);
      setTtSuccess(`Complete timetable sent successfully to ${sendTtDept} ${sendTtAudience}.`);
      setSendTtModalOpen(false);
      setSendTtDept('');
      setSendTtAudience('');
      setTimeout(() => setTtSuccess(''), 4000);
    },
    onError: (err) => {
      alert(err.message || 'Failed to send timetable.');
    }
  });

  // Students & Faculty Queries from MongoDB
  const { data: dbStudents = [] } = useQuery({
    queryKey: ['students'],
    queryFn: () => authService.getStudents()
  });
  const activeStudents = Array.isArray(dbStudents) ? dbStudents : [];

  const { data: dbFaculty = [] } = useQuery({
    queryKey: ['faculty'],
    queryFn: () => authService.getFaculty()
  });
  const activeFaculty = Array.isArray(dbFaculty) ? dbFaculty : [];

  const createStudentMutation = useMutation({
    mutationFn: (data) => authService.registerStudent(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['studentInsights'] });
      if (setStudents && res?.user) setStudents(prev => [...prev, res.user]);
      setStName(''); setStEnrollment(''); setStEmail(''); setStCourse(''); setStSemester(''); setStDepartment(''); setStClassSection('');
      setStErrors({}); setStSuccess('Student added successfully!');
      setIsStudentFormOpen(false);
      setTimeout(() => setStSuccess(''), 4000);
    },
    onError: (err) => {
      alert(err.response?.data?.message || err.message || 'Failed to add student.');
    }
  });

  const createFacultyMutation = useMutation({
    mutationFn: (data) => authService.registerFaculty(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['faculty'] });
      if (setFaculty && res?.user) setFaculty(prev => [...prev, res.user]);
      setFaName(''); setFaUsername(''); setFaEmail(''); setFaDepartment('');
      setFaSemester(''); setFaClassSection(''); setFaAssignedSubject(''); setFaPassword('');
      setFaErrors({}); setFaSuccess('Faculty member registered and mapped successfully!');
      setIsFacultyFormOpen(false);
      setTimeout(() => setFaSuccess(''), 4000);
    },
    onError: (err) => {
      alert(err.response?.data?.message || err.message || 'Failed to add faculty member.');
    }
  });

  // Notices Queries & Mutations
  const { data: dbNotices = [] } = useQuery({
    queryKey: ['notices'],
    queryFn: () => noticeService.getNotices()
  });
  const activeNotices = Array.isArray(dbNotices) ? dbNotices : [];

  const createNoticeMutation = useMutation({
    mutationFn: (data) => noticeService.createNotice(data),
    onSuccess: (newNotice) => {
      queryClient.invalidateQueries({ queryKey: ['notices'] });
      if (setNotices) setNotices(prev => [newNotice, ...prev]);
      setNoTitle(''); setNoCategory(''); setNoAudience(''); setNoTargetDepartment(''); setNoContent('');
      setNoExpiresAt('');
      setNoErrors({}); setNoSuccess('Notice published successfully!');
      setTimeout(() => setNoSuccess(''), 4000);
    },
    onError: (err) => {
      alert(err.message || 'Failed to publish notice.');
    }
  });

  // Announcements Queries & Mutations
  const { data: dbAnnouncements = [] } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => announcementService.getAnnouncements()
  });
  const activeAnnouncements = Array.isArray(dbAnnouncements) ? dbAnnouncements : [];

  const createAnnouncementMutation = useMutation({
    mutationFn: (data) => announcementService.createAnnouncement(data),
    onSuccess: (newAnnouncement) => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      if (setAnnouncements) setAnnouncements(prev => [newAnnouncement, ...prev]);
      setAnTitle('');
      setAnMessage('');
      setAnDepartment('All Departments');
      setAnTargetRole('Students & Faculty');
      setAnDate('');
      setAnTime('');
      setAnExpiresAt('');
      setAnFile(null);
      setAnErrors({});
      setAnSuccess('Announcement published successfully!');
      setTimeout(() => setAnSuccess(''), 4000);
    },
    onError: (err) => {
      alert(err.response?.data?.message || err.message || 'Failed to publish announcement.');
    }
  });

  const deleteAnnouncementMutation = useMutation({
    mutationFn: (id) => announcementService.deleteAnnouncement(id),
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      if (setAnnouncements) setAnnouncements(prev => prev.filter(a => (a._id || a.id) !== deletedId));
    },
    onError: (err) => {
      alert(err.response?.data?.message || err.message || 'Failed to delete announcement.');
    }
  });

  const handleAnnouncementFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setAnFile(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setAnFile({
        fileName: file.name,
        fileType: file.type || 'application/octet-stream',
        fileSize: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        fileData: reader.result
      });
    };
    reader.readAsDataURL(file);
  };

  const handleAddAnnouncement = (e) => {
    e.preventDefault();
    const errors = {};
    if (!anTitle.trim()) errors.title = 'Title is required';
    if (!anMessage.trim()) errors.message = 'Description / Message is required';
    if (!anDepartment) errors.department = 'Department is required';
    if (!anTargetRole) errors.targetRole = 'Target Role is required';
    if (!anExpiresAt) {
      errors.expiresAt = 'Expiration date & time is mandatory.';
    } else {
      const exp = new Date(anExpiresAt);
      if (isNaN(exp.getTime()) || exp <= new Date()) {
        errors.expiresAt = 'Expiration time must be set in the future.';
      }
    }

    if (Object.keys(errors).length > 0) {
      setAnErrors(errors);
      return;
    }

    createAnnouncementMutation.mutate({
      title: anTitle.trim(),
      message: anMessage.trim(),
      department: anDepartment,
      targetRole: anTargetRole,
      date: anDate || new Date().toLocaleDateString('en-IN'),
      time: anTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      expiresAt: anExpiresAt ? new Date(anExpiresAt).toISOString() : undefined,
      fileName: anFile?.fileName || '',
      fileType: anFile?.fileType || '',
      fileSize: anFile?.fileSize || '',
      fileData: anFile?.fileData || ''
    });
  };

  // Events Queries & Mutations
  const { data: dbEvents = [] } = useQuery({
    queryKey: ['events'],
    queryFn: () => eventService.getEvents()
  });
  const activeEvents = Array.isArray(dbEvents) ? dbEvents : [];

  const createEventMutation = useMutation({
    mutationFn: (data) => eventService.createEvent(data),
    onSuccess: (newEvent) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      if (setEvents) setEvents(prev => [newEvent, ...prev]);
      setEvTitle(''); setEvCategory(''); setEvDate(''); setEvStartTime(''); setEvEndTime('');
      setEvVenue(''); setEvDescription(''); setEvOrganizer(''); setEvTargetDepartment('');
      setEvExpiresAt('');
      setEvErrors({}); setEvSuccess('Event added successfully!');
      setTimeout(() => setEvSuccess(''), 4000);
    },
    onError: (err) => {
      alert(err.message || 'Failed to add event.');
    }
  });

  // Materials Queries & Mutations
  const { data: dbMaterials = [] } = useQuery({
    queryKey: ['materials'],
    queryFn: () => materialService.getMaterials()
  });
  const activeMaterials = Array.isArray(dbMaterials) ? dbMaterials : [];

  const createMaterialMutation = useMutation({
    mutationFn: (data) => materialService.createMaterial(data),
    onSuccess: (newMat) => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      if (setMaterials) setMaterials(prev => [newMat, ...prev]);
      setMaTitle(''); setMaSubject(''); setMaCategory(''); setMaTargetDepartment(''); setMaLink('');
      setMaErrors({}); setMaSuccess('Material added successfully!');
      setTimeout(() => setMaSuccess(''), 4000);
    },
    onError: (err) => {
      alert(err.message || 'Failed to add material.');
    }
  });

  // Marks Queries & Mutations
  const { data: dbMarks = [] } = useQuery({
    queryKey: ['marks'],
    queryFn: () => markService.getMarks()
  });
  const activeMarks = Array.isArray(dbMarks) ? dbMarks : [];

  const createMarkMutation = useMutation({
    mutationFn: (data) => markService.createMark(data),
    onSuccess: (newRec) => {
      queryClient.invalidateQueries({ queryKey: ['marks'] });
      if (setMarks) setMarks(prev => [newRec, ...prev]);
      setMkStudent(''); setMkSubject(''); setMkExam(''); setMkScore('');
      setMkErrors({}); setMkSuccess('Marks record added successfully!');
      setTimeout(() => setMkSuccess(''), 4000);
    },
    onError: (err) => {
      alert(err.message || 'Failed to add marks record.');
    }
  });

  // Assignments Queries & Mutations
  const { data: dbAssignments = [] } = useQuery({
    queryKey: ['assignments'],
    queryFn: () => assignmentService.getAssignments()
  });
  const activeAssignments = Array.isArray(dbAssignments) ? dbAssignments : [];

  const createAssignmentMutation = useMutation({
    mutationFn: (data) => assignmentService.createAssignment(data),
    onSuccess: (newRec) => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      if (setAssignments) setAssignments(prev => [newRec, ...prev]);
      setAsTitle(''); setAsClass(''); setAsSubject(''); setAsDescription(''); setAsDueDate(''); setAsDueTime(''); setAsTargetDepartment(''); setAsStudent(''); setAsAudience('Students'); setAsFile(null); setAsFileData('');
      setAsErrors({}); setAsSuccess('Assignment created successfully!');
      setTimeout(() => setAsSuccess(''), 4000);
    },
    onError: (err) => {
      alert(err.message || 'Failed to create assignment.');
    }
  });

  const deleteAssignmentMutation = useMutation({
    mutationFn: (id) => assignmentService.deleteAssignment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
    },
    onError: (err) => {
      alert(err.response?.data?.message || err.message || 'Failed to delete assignment.');
    }
  });

  // Courses Queries & Mutations
  const { data: dbCourses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: () => academicService.getCourses()
  });
  const activeCourses = Array.isArray(dbCourses) ? dbCourses : [];

  const createCourseMutation = useMutation({
    mutationFn: (data) => academicService.createCourse(data),
    onSuccess: (newRec) => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      if (setCourses) setCourses(prev => [newRec, ...prev]);
      setCoCode(''); setCoTitle(''); setCoDept(''); setCoCredits('');
      setCoErrors({}); setCoSuccess('Course added successfully!');
      setTimeout(() => setCoSuccess(''), 4000);
    },
    onError: (err) => {
      alert(err.message || 'Failed to add course.');
    }
  });

  // Subjects Queries & Mutations
  const { data: dbSubjects = [] } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => academicService.getSubjects()
  });
  const activeSubjects = Array.isArray(dbSubjects) ? dbSubjects : [];

  const createSubjectMutation = useMutation({
    mutationFn: (data) => academicService.createSubject(data),
    onSuccess: (newRec) => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      if (setSubjects) setSubjects(prev => [newRec, ...prev]);
      setSuCode(''); setSuName(''); setSuDept(''); setSuType('');
      setSuErrors({}); setSuSuccess('Subject added successfully!');
      setTimeout(() => setSuSuccess(''), 4000);
    },
    onError: (err) => {
      alert(err.message || 'Failed to add subject.');
    }
  });

  // Classes Queries & Mutations
  const { data: dbClasses = [] } = useQuery({
    queryKey: ['classes'],
    queryFn: () => academicService.getClasses()
  });
  const activeClasses = Array.isArray(dbClasses) ? dbClasses : [];

  const createClassMutation = useMutation({
    mutationFn: (data) => academicService.createClass(data),
    onSuccess: (newRec) => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      if (setClasses) setClasses(prev => [newRec, ...prev]);
      setClName(''); setClSection(''); setClRoom(''); setClFaculty('');
      setClErrors({}); setClSuccess('Class added successfully!');
      setTimeout(() => setClSuccess(''), 4000);
    },
    onError: (err) => {
      alert(err.message || 'Failed to add class.');
    }
  });

  const handleAddTimetable = (e) => {
    e.preventDefault();
    const errs = {};
    if (!ttDay) errs.day = 'Day is required.';
    if (!ttStartTime) errs.startTime = 'Start time is required.';
    if (!ttEndTime) errs.endTime = 'End time is required.';
    if (!ttDepartment) errs.department = 'Department is required.';

    if (!ttIsBreak && (!ttSubject || ttSubject.trim() === '')) {
      errs.subject = 'Subject is required.';
    }

    if (Object.keys(errs).length > 0) {
      setTtErrors(errs);
      return;
    }

    createTimetableMutation.mutate({
      date: ttDate || new Date().toISOString().split('T')[0],
      day: ttDay,
      dayOfWeek: ttDay,
      startTime: ttStartTime,
      endTime: ttEndTime,
      subject: ttIsBreak ? (ttSubject || 'Break') : ttSubject,
      department: ttDepartment,
      semester: ttSemester || 'Semester 1',
      division: ttDivision || 'A',
      faculty: ttIsBreak ? '' : ttFaculty,
      roomNumber: ttIsBreak ? '' : ttRoomNumber,
      sessionType: ttIsBreak ? 'Break' : (ttSessionType || 'Theory'),
      isBreak: Boolean(ttIsBreak)
    });
  };

  const handleDeleteTimetable = (id) => {
    if (window.confirm("Are you sure you want to delete this timetable entry?")) {
      deleteTimetableMutation.mutate(id);
    }
  };

  const handleSendTimetable = () => {
    if (!sendTtDept || !sendTtAudience) {
      alert("Please select both Department and Audience.");
      return;
    }
    
    sendTimetableMutation.mutate({
      department: sendTtDept,
      semester: sendTtSemester || 'All',
      division: sendTtDivision || 'All',
      audience: sendTtAudience
    });
    setSendTtModalOpen(false);
  };



  const handleAddEvent = (e) => {
    e.preventDefault();
    const errs = {};
    if (!evTitle.trim()) errs.title = 'Event title is required.';
    if (!evCategory) errs.category = 'Please select event category.';
    if (!evDate) errs.date = 'Event date is required.';
    if (!evStartTime) errs.startTime = 'Start time is required.';
    if (!evVenue.trim()) errs.venue = 'Venue is required.';
    if (!evDescription.trim()) errs.description = 'Description is required.';
    if (!evTargetDepartment) errs.targetDepartment = 'Please select a target department.';
    if (!evExpiresAt) {
      errs.expiresAt = 'Expiration date & time is mandatory.';
    } else {
      const exp = new Date(evExpiresAt);
      if (isNaN(exp.getTime()) || exp <= new Date()) {
        errs.expiresAt = 'Expiration time must be set in the future.';
      }
    }

    if (Object.keys(errs).length > 0) {
      setEvErrors(errs);
      setEvSuccess('');
      return;
    }

    const resolvedEnrollment = evTargetType === 'individual' ? evStudent.trim() : '';
    createEventMutation.mutate({
      title: evTitle.trim(),
      category: evCategory,
      date: evDate,
      startTime: evStartTime,
      endTime: evEndTime,
      venue: evVenue.trim(),
      description: evDescription.trim(),
      organizer: evOrganizer.trim() || 'Administration',
      targetType: evTargetType,
      targetDepartment: evTargetType === 'all' ? 'All Departments' : (evTargetDepartment || 'All Departments'),
      targetStudentEnrollment: resolvedEnrollment,
      student: resolvedEnrollment,
      audience: evTargetDepartment === 'All Departments' ? 'Everyone' : evTargetDepartment,
      expiresAt: evExpiresAt ? new Date(evExpiresAt).toISOString() : undefined
    });
  };

  const handleAddStudent = (e) => {
    e.preventDefault();
    const errs = {};
    if (!stName.trim()) errs.name = 'Student name is required.';
    if (!stEnrollment.trim()) {
      errs.enrollment = 'Enrollment number is required.';
    } else if (activeStudents.some(s => s.enrollment?.toLowerCase() === stEnrollment.trim().toLowerCase())) {
      errs.enrollment = 'Enrollment number already exists.';
    }
    if (!stEmail.trim()) {
      errs.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(stEmail.trim())) {
      errs.email = 'Please enter a valid email address.';
    }
    if (!stCourse) errs.course = 'Please select a course.';
    if (!stSemester) errs.semester = 'Please select a semester.';
    if (!stDepartment) errs.department = 'Please select a department.';

    if (Object.keys(errs).length > 0) {
      setStErrors(errs);
      setStSuccess('');
      return;
    }

    createStudentMutation.mutate({
      name: stName.trim(),
      enrollment: stEnrollment.trim(),
      email: stEmail.trim(),
      course: stCourse,
      semester: stSemester,
      department: stDepartment,
      classSection: stClassSection.trim(),
      section: stClassSection.trim()
    });
  };

  const handleAddFaculty = (e) => {
    e.preventDefault();
    const errs = {};
    if (!faName.trim()) errs.name = 'Faculty name is required.';
    if (!faUsername.trim()) {
      errs.username = 'Username is required.';
    } else if (activeFaculty.some(f => f.username?.toLowerCase() === faUsername.trim().toLowerCase())) {
      errs.username = 'Username already exists.';
    }
    if (!faEmail.trim()) {
      errs.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(faEmail.trim())) {
      errs.email = 'Please enter a valid email address.';
    }
    if (!faDepartment) errs.department = 'Please select a department.';
    if (!faSemester) errs.semester = 'Please select a semester.';
    if (!faClassSection.trim()) errs.classSection = 'Class/Section is required (e.g., A).';
    if (!faAssignedSubject.trim()) errs.assignedSubject = 'Assigned/Elective Subject is required (e.g., MERN).';

    if (Object.keys(errs).length > 0) {
      setFaErrors(errs);
      setFaSuccess('');
      return;
    }

    createFacultyMutation.mutate({
      name: faName.trim(),
      username: faUsername.trim(),
      email: faEmail.trim(),
      department: faDepartment,
      semester: faSemester,
      classSection: faClassSection.trim(),
      section: faClassSection.trim(),
      assignedSubject: faAssignedSubject.trim(),
      subject: faAssignedSubject.trim(),
      password: faPassword.trim() || 'Faculty@123'
    });
  };

  const handleAddCourse = (e) => {
    e.preventDefault();
    const errs = {};
    if (!coCode.trim()) errs.code = 'Course code is required.';
    if (!coTitle.trim()) errs.title = 'Course title is required.';
    if (!coDept) errs.dept = 'Please select a department.';
    if (!coCredits) errs.credits = 'Credits is required.';

    if (Object.keys(errs).length > 0) {
      setCoErrors(errs);
      setCoSuccess('');
      return;
    }

    createCourseMutation.mutate({
      code: coCode.trim(),
      title: coTitle.trim(),
      dept: coDept,
      credits: Number(coCredits)
    });
  };

  const handleAddSubject = (e) => {
    e.preventDefault();
    const errs = {};
    if (!suCode.trim()) errs.code = 'Subject code is required.';
    if (!suName.trim()) errs.name = 'Subject name is required.';
    if (!suDept) errs.dept = 'Please select a department.';
    if (!suType) errs.type = 'Please select subject type.';

    if (Object.keys(errs).length > 0) {
      setSuErrors(errs);
      setSuSuccess('');
      return;
    }

    createSubjectMutation.mutate({
      code: suCode.trim(),
      name: suName.trim(),
      dept: suDept,
      type: suType
    });
  };

  const handleAddClass = (e) => {
    e.preventDefault();
    const errs = {};
    if (!clName.trim()) errs.name = 'Class name is required.';
    if (!clSection.trim()) errs.section = 'Section is required.';
    if (!clRoom.trim()) errs.room = 'Room number is required.';
    if (!clFaculty.trim()) errs.faculty = 'Faculty assigned is required.';

    if (Object.keys(errs).length > 0) {
      setClErrors(errs);
      setClSuccess('');
      return;
    }

    createClassMutation.mutate({
      name: clName.trim(),
      section: clSection.trim(),
      room: clRoom.trim(),
      faculty: clFaculty.trim()
    });
  };



  const handleAddMark = (e) => {
    e.preventDefault();
    const errs = {};
    if (!mkStudent.trim()) errs.student = 'Student name/enrollment is required.';
    if (!mkSubject.trim()) errs.subject = 'Subject is required.';
    if (!mkExam.trim()) errs.exam = 'Exam type is required.';
    if (!mkScore.trim()) errs.score = 'Score/Grade is required.';

    if (Object.keys(errs).length > 0) {
      setMkErrors(errs);
      setMkSuccess('');
      return;
    }

    createMarkMutation.mutate({
      student: mkStudent.trim(),
      enrollment: mkStudent.trim(),
      subject: mkSubject.trim(),
      exam: mkExam.trim(),
      score: mkScore.trim()
    });
  };

  const handleAddNotice = (e) => {
    e.preventDefault();
    const errs = {};
    if (!noTitle.trim()) errs.title = 'Notice title is required.';
    if (noTargetType === 'individual' && !noStudent.trim()) {
      errs.student = 'Target student enrollment is required.';
    }
    if (noTargetType === 'department' && !noTargetDepartment) {
      errs.targetDepartment = 'Please select a target department.';
    }
    if (!noContent.trim()) errs.content = 'Notice content is required.';
    if (!noExpiresAt) {
      errs.expiresAt = 'Expiration date & time is mandatory.';
    } else {
      const exp = new Date(noExpiresAt);
      if (isNaN(exp.getTime()) || exp <= new Date()) {
        errs.expiresAt = 'Expiration time must be set in the future.';
      }
    }

    if (Object.keys(errs).length > 0) {
      setNoErrors(errs);
      setNoSuccess('');
      return;
    }

    const resolvedNoEnrollment = noTargetType === 'individual' ? noStudent.trim() : '';
    createNoticeMutation.mutate({
      title: noTitle.trim(),
      category: noCategory,
      audience: noAudience || 'Everyone',
      targetType: noTargetType,
      targetDepartment: noTargetType === 'all' ? 'All Departments' : (noTargetDepartment || 'All Departments'),
      targetStudentEnrollment: resolvedNoEnrollment,
      student: resolvedNoEnrollment,
      content: noContent.trim(),
      expiresAt: noExpiresAt ? new Date(noExpiresAt).toISOString() : undefined
    });
  };

  const handleAddMaterial = (e) => {
    e.preventDefault();
    const errs = {};
    if (!maTitle.trim()) errs.title = 'Material title is required.';
    if (!maSubject.trim()) errs.subject = 'Subject is required.';
    if (!maCategory) errs.category = 'Please select category.';
    if (maTargetType === 'individual' && !maStudent.trim()) {
      errs.student = 'Target student enrollment is required.';
    }
    if (maTargetType === 'department' && !maTargetDepartment) {
      errs.targetDepartment = 'Please select a target department.';
    }

    if (Object.keys(errs).length > 0) {
      setMaErrors(errs);
      setMaSuccess('');
      return;
    }

    const resolvedMaEnrollment = maTargetType === 'individual' ? maStudent.trim() : '';
    createMaterialMutation.mutate({
      title: maTitle.trim(),
      subject: maSubject.trim(),
      category: maCategory,
      targetType: maTargetType,
      targetDepartment: maTargetType === 'all' ? 'All Departments' : (maTargetDepartment || 'All Departments'),
      targetStudentEnrollment: resolvedMaEnrollment,
      student: resolvedMaEnrollment,
      description: maLink.trim() || ''
    });
  };

  const handleAddAssignment = (e) => {
    e.preventDefault();
    const errs = {};
    if (!asTitle.trim()) errs.title = 'Assignment title is required.';
    if (!asClass.trim()) errs.class = 'Class is required.';
    if (!asSubject.trim()) errs.subject = 'Subject is required.';
    if (!asDescription.trim()) errs.description = 'Assignment description is required.';
    if (!asDueDate) errs.dueDate = 'Due date is required.';
    if (!asDueTime) errs.dueTime = 'Due time is required.';
    if (asTargetType === 'individual' && !asStudent.trim()) {
      errs.student = 'Target student enrollment is required.';
    }
    if (asTargetType === 'department' && !asTargetDepartment) {
      errs.targetDepartment = 'Please select a target department.';
    }

    if (Object.keys(errs).length > 0) {
      setAsErrors(errs);
      setAsSuccess('');
      return;
    }

    const resolvedAsEnrollment = asTargetType === 'individual' ? asStudent.trim() : '';
    const dept = asTargetType === 'all' ? 'All Departments' : (asTargetDepartment || 'All Departments');
    createAssignmentMutation.mutate({
      title: asTitle.trim(),
      class: asClass.trim(),
      subject: asSubject.trim(),
      description: asDescription.trim(),
      questions: asDescription.trim(),
      dueDate: asDueDate,
      dueTime: asDueTime,
      targetType: asTargetType,
      department: dept,
      targetDepartment: dept,
      targetRole: asAudience || 'Students',
      audience: asAudience || 'Students',
      targetStudentEnrollment: resolvedAsEnrollment,
      student: resolvedAsEnrollment,
      fileName: asFile ? asFile.name : null,
      fileType: asFile ? asFile.name.split('.').pop().toUpperCase() : null,
      fileSize: asFile ? (asFile.size / 1024).toFixed(1) + ' KB' : null,
      fileData: asFileData || null,
      createdBy: currentUser?.name || 'Admin',
      createdByRole: 'admin'
    });
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    const errs = {};
    if (!seInstName.trim()) errs.name = 'Institute name is required.';
    if (!seAcadYear.trim()) errs.year = 'Academic year is required.';
    if (!seEmail.trim()) {
      errs.email = 'System email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(seEmail.trim())) {
      errs.email = 'Please enter a valid email address.';
    }

    if (Object.keys(errs).length > 0) {
      setSeErrors(errs);
      setSeSuccess('');
      return;
    }

    setSeErrors({});
    setSeSuccess('System settings saved successfully!');
  };

  // Render Sub-Views
  if (path === '/admin/students') {
    return (
      <Layout role="admin" currentUser={currentUser} setCurrentUser={setCurrentUser}>
        <DirectoryTabs
          studentCount={activeStudents.length}
          facultyCount={activeFaculty.length}
          isFormOpen={isStudentFormOpen}
          onToggleForm={() => setIsStudentFormOpen(prev => !prev)}
          formButtonText="Enroll Student"
        />
        <StudentDirectorySection
          students={activeStudents}
          isFormOpen={isStudentFormOpen}
          setIsFormOpen={setIsStudentFormOpen}
          stName={stName}
          setStName={setStName}
          stEnrollment={stEnrollment}
          setStEnrollment={setStEnrollment}
          stEmail={stEmail}
          setStEmail={setStEmail}
          stCourse={stCourse}
          setStCourse={setStCourse}
          stSemester={stSemester}
          setStSemester={setStSemester}
          stDepartment={stDepartment}
          setStDepartment={setStDepartment}
          stClassSection={stClassSection}
          setStClassSection={setStClassSection}
          stErrors={stErrors}
          setStErrors={setStErrors}
          stSuccess={stSuccess}
          handleAddStudent={handleAddStudent}
        />
      </Layout>
    );
  }

  if (path === '/admin/faculty') {
    return (
      <Layout role="admin" currentUser={currentUser} setCurrentUser={setCurrentUser}>
        <DirectoryTabs
          studentCount={activeStudents.length}
          facultyCount={activeFaculty.length}
          isFormOpen={isFacultyFormOpen}
          onToggleForm={() => setIsFacultyFormOpen(prev => !prev)}
          formButtonText="Add Faculty"
        />
        <FacultyDirectorySection
          faculty={activeFaculty}
          isFormOpen={isFacultyFormOpen}
          setIsFormOpen={setIsFacultyFormOpen}
          faName={faName}
          setFaName={setFaName}
          faUsername={faUsername}
          setFaUsername={setFaUsername}
          faEmail={faEmail}
          setFaEmail={setFaEmail}
          faDepartment={faDepartment}
          setFaDepartment={setFaDepartment}
          faSemester={faSemester}
          setFaSemester={setFaSemester}
          faClassSection={faClassSection}
          setFaClassSection={setFaClassSection}
          faAssignedSubject={faAssignedSubject}
          setFaAssignedSubject={setFaAssignedSubject}
          faPassword={faPassword}
          setFaPassword={setFaPassword}
          faErrors={faErrors}
          setFaErrors={setFaErrors}
          faSuccess={faSuccess}
          handleAddFaculty={handleAddFaculty}
        />
      </Layout>
    );
  }

  if (path === '/admin/events') {
    return (
      <Layout role="admin" currentUser={currentUser} setCurrentUser={setCurrentUser}>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Events Management</h1>
            <p className="text-gray-500 text-sm mt-1">Create and manage campus events for all students.</p>
          </div>
          <Link to="/admin/dashboard" className="text-xs font-semibold text-indigo-600 hover:underline">
            ← Back to Overview
          </Link>
        </div>

        {/* Add Event Form */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm mb-8">
          <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Plus size={18} className="text-indigo-600" />
            Add New Event
          </h2>
          {evSuccess && <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-xl">{evSuccess}</div>}

          <form onSubmit={handleAddEvent} noValidate className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Event Title *</label>
                <input
                  type="text"
                  value={evTitle}
                  onChange={(e) => { setEvTitle(e.target.value); if (evErrors.title) setEvErrors({...evErrors, title: ''}); }}
                  placeholder="e.g., Annual Sports Day"
                  className={`w-full px-3.5 py-2 bg-gray-50 border rounded-xl text-xs text-gray-900 focus:outline-none ${evErrors.title ? 'border-red-500' : 'border-gray-200'}`}
                />
                {evErrors.title && <p className="text-xs text-red-500 font-medium mt-1">{evErrors.title}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Event Category / Type *</label>
                <select
                  value={evCategory}
                  onChange={(e) => { setEvCategory(e.target.value); if (evErrors.category) setEvErrors({...evErrors, category: ''}); }}
                  className={`w-full px-3.5 py-2 bg-gray-50 border rounded-xl text-xs text-gray-900 focus:outline-none ${evErrors.category ? 'border-red-500' : 'border-gray-200'}`}
                >
                  <option value="">Select Category</option>
                  <option value="Academic">Academic</option>
                  <option value="Sports">Sports</option>
                  <option value="Cultural">Cultural</option>
                  <option value="Workshop">Workshop</option>
                  <option value="Seminar">Seminar</option>
                  <option value="General">General</option>
                </select>
                {evErrors.category && <p className="text-xs text-red-500 font-medium mt-1">{evErrors.category}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Date *</label>
                <input
                  type="date"
                  value={evDate}
                  onChange={(e) => { setEvDate(e.target.value); if (evErrors.date) setEvErrors({...evErrors, date: ''}); }}
                  className={`w-full px-3.5 py-2 bg-gray-50 border rounded-xl text-xs text-gray-900 focus:outline-none ${evErrors.date ? 'border-red-500' : 'border-gray-200'}`}
                />
                {evErrors.date && <p className="text-xs text-red-500 font-medium mt-1">{evErrors.date}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Start Time *</label>
                <input
                  type="text"
                  value={evStartTime}
                  onChange={(e) => { setEvStartTime(e.target.value); if (evErrors.startTime) setEvErrors({...evErrors, startTime: ''}); }}
                  placeholder="e.g., 10:00 AM"
                  className={`w-full px-3.5 py-2 bg-gray-50 border rounded-xl text-xs text-gray-900 focus:outline-none ${evErrors.startTime ? 'border-red-500' : 'border-gray-200'}`}
                />
                {evErrors.startTime && <p className="text-xs text-red-500 font-medium mt-1">{evErrors.startTime}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">End Time (Optional)</label>
                <input
                  type="text"
                  value={evEndTime}
                  onChange={(e) => setEvEndTime(e.target.value)}
                  placeholder="e.g., 02:00 PM"
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Venue *</label>
                <input
                  type="text"
                  value={evVenue}
                  onChange={(e) => { setEvVenue(e.target.value); if (evErrors.venue) setEvErrors({...evErrors, venue: ''}); }}
                  placeholder="e.g., College Ground / Main Hall"
                  className={`w-full px-3.5 py-2 bg-gray-50 border rounded-xl text-xs text-gray-900 focus:outline-none ${evErrors.venue ? 'border-red-500' : 'border-gray-200'}`}
                />
                {evErrors.venue && <p className="text-xs text-red-500 font-medium mt-1">{evErrors.venue}</p>}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Organizer (Optional)</label>
              <input
                type="text"
                value={evOrganizer}
                onChange={(e) => setEvOrganizer(e.target.value)}
                placeholder="e.g., Sports Committee / Administration"
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Target Scope *</label>
                <select
                  value={evTargetType}
                  onChange={(e) => setEvTargetType(e.target.value)}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none"
                >
                  <option value="all">All Departments (Public)</option>
                  <option value="department">Specific Department</option>
                  <option value="individual">Individual Student</option>
                </select>
              </div>

              {evTargetType === 'individual' ? (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Target Student Enrollment *</label>
                  <input
                    type="text"
                    value={evStudent}
                    onChange={(e) => setEvStudent(e.target.value)}
                    placeholder="e.g. ABC001"
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none"
                  />
                </div>
              ) : evTargetType === 'department' ? (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Target Department *</label>
                  <select
                    value={evTargetDepartment}
                    onChange={(e) => { setEvTargetDepartment(e.target.value); if (evErrors.targetDepartment) setEvErrors({...evErrors, targetDepartment: ''}); }}
                    className={`w-full px-3.5 py-2 bg-gray-50 border rounded-xl text-xs text-gray-900 focus:outline-none ${evErrors.targetDepartment ? 'border-red-500' : 'border-gray-200'}`}
                  >
                    <option value="">Select Department</option>
                    {TARGET_DEPARTMENT_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  {evErrors.targetDepartment && <p className="text-xs text-red-500 font-medium mt-1">{evErrors.targetDepartment}</p>}
                </div>
              ) : null}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Description *</label>
              <textarea
                rows={3}
                value={evDescription}
                onChange={(e) => { setEvDescription(e.target.value); if (evErrors.description) setEvErrors({...evErrors, description: ''}); }}
                placeholder="Detailed event description..."
                className={`w-full px-3.5 py-2 bg-gray-50 border rounded-xl text-xs text-gray-900 focus:outline-none ${evErrors.description ? 'border-red-500' : 'border-gray-200'}`}
              />
              {evErrors.description && <p className="text-xs text-red-500 font-medium mt-1">{evErrors.description}</p>}
            </div>

            <ExpirationPicker
              value={evExpiresAt}
              onChange={(val) => {
                setEvExpiresAt(val);
                if (evErrors.expiresAt) setEvErrors({ ...evErrors, expiresAt: '' });
              }}
              error={evErrors.expiresAt}
              label="Event Auto-Expiration (Auto-Delete)"
              helperText="Event will automatically disappear from all campus calendars once this date & time passes."
            />

            <button type="submit" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm">
              Publish Event
            </button>
          </form>
        </div>

        {/* Events List */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 mb-4">Campus Events List</h2>
          {activeEvents.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <Calendar size={36} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold text-gray-600">No events added yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeEvents.slice().reverse().map((ev) => (
                <div key={ev._id || ev.id} className="p-5 bg-gray-50 border border-gray-100 rounded-2xl">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-gray-900 text-base">{ev.title}</h3>
                    <span className="text-[10px] font-bold px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-full">
                      {ev.category}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mb-3">{ev.description}</p>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 font-medium pt-2 border-t border-gray-200/60">
                    <div>📅 <span className="font-semibold text-gray-700">{ev.date}</span></div>
                    <div>⏰ <span className="font-semibold text-gray-700">{ev.time}</span></div>
                    <div>📍 <span className="font-semibold text-gray-700">{ev.venue}</span></div>
                    <div>👤 <span className="font-semibold text-gray-700">{ev.organizer}</span></div>
                    {ev.expiresAt && (
                      <div className="col-span-2 mt-1 py-1 px-2.5 bg-amber-50 rounded-lg border border-amber-200/60 text-[11px] text-amber-800 flex items-center justify-between">
                        <span>⏳ Auto-expires: <strong>{formatFriendlyDateTime(ev.expiresAt)}</strong></span>
                        <span className="text-[9px] font-extrabold uppercase tracking-wider text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">TTL Live</span>
                      </div>
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
  if (path === '/admin/timetable') {
    return (
      <Layout role="admin" currentUser={currentUser} setCurrentUser={setCurrentUser}>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Timetable Management</h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">Configure weekly lecture schedules, lab periods, and institutional break matrix.</p>
          </div>
          <Link to="/admin/dashboard" className="text-xs font-semibold text-indigo-600 hover:underline">
            ← Back to Overview
          </Link>
        </div>

        <AdminTimetableSection
          activeTimetables={activeTimetables}
          subjects={activeSubjects}
          faculty={activeFaculty}
          handleAddTimetable={handleAddTimetable}
          handleDeleteTimetable={handleDeleteTimetable}
          handleSendTimetable={handleSendTimetable}
          ttDate={ttDate} setTtDate={setTtDate}
          ttDay={ttDay} setTtDay={setTtDay}
          ttStartTime={ttStartTime} setTtStartTime={setTtStartTime}
          ttEndTime={ttEndTime} setTtEndTime={setTtEndTime}
          ttSubject={ttSubject} setTtSubject={setTtSubject}
          ttDepartment={ttDepartment} setTtDepartment={setTtDepartment}
          ttSemester={ttSemester} setTtSemester={setTtSemester}
          ttDivision={ttDivision} setTtDivision={setTtDivision}
          ttFaculty={ttFaculty} setTtFaculty={setTtFaculty}
          ttRoomNumber={ttRoomNumber} setTtRoomNumber={setTtRoomNumber}
          ttSessionType={ttSessionType} setTtSessionType={setTtSessionType}
          ttIsBreak={ttIsBreak} setTtIsBreak={setTtIsBreak}
          ttErrors={ttErrors}
          ttSuccess={ttSuccess}
          sendTtModalOpen={sendTtModalOpen} setSendTtModalOpen={setSendTtModalOpen}
          sendTtDept={sendTtDept} setSendTtDept={setSendTtDept}
          sendTtAudience={sendTtAudience} setSendTtAudience={setSendTtAudience}
          sendTtSemester={sendTtSemester} setSendTtSemester={setSendTtSemester}
          sendTtDivision={sendTtDivision} setSendTtDivision={setSendTtDivision}
        />
      </Layout>
    );
  }

  if (path === '/admin/courses') {
    return (
      <Layout role="admin" currentUser={currentUser} setCurrentUser={setCurrentUser}>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Courses & Curriculum</h1>
            <p className="text-gray-500 text-sm mt-1">Manage academic course offerings.</p>
          </div>
          <Link to="/admin/dashboard" className="text-xs font-semibold text-indigo-600 hover:underline">
            ← Back to Overview
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm mb-8">
          <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Plus size={18} className="text-indigo-600" />
            Add New Course
          </h2>
          {coSuccess && <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-xl">{coSuccess}</div>}

          <form onSubmit={handleAddCourse} noValidate className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Course Code *</label>
                <input type="text" value={coCode} onChange={(e) => { setCoCode(e.target.value); if (coErrors.code) setCoErrors({...coErrors, code: ''}); }} placeholder="e.g., CS301" className={`w-full px-3.5 py-2 bg-gray-50 border rounded-xl text-xs text-gray-900 focus:outline-none ${coErrors.code ? 'border-red-500' : 'border-gray-200'}`} />
                {coErrors.code && <p className="text-xs text-red-500 font-medium mt-1">{coErrors.code}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Course Title *</label>
                <input type="text" value={coTitle} onChange={(e) => { setCoTitle(e.target.value); if (coErrors.title) setCoErrors({...coErrors, title: ''}); }} placeholder="Course Title" className={`w-full px-3.5 py-2 bg-gray-50 border rounded-xl text-xs text-gray-900 focus:outline-none ${coErrors.title ? 'border-red-500' : 'border-gray-200'}`} />
                {coErrors.title && <p className="text-xs text-red-500 font-medium mt-1">{coErrors.title}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Department *</label>
                <select value={coDept} onChange={(e) => { setCoDept(e.target.value); if (coErrors.dept) setCoErrors({...coErrors, dept: ''}); }} className={`w-full px-3.5 py-2 bg-gray-50 border rounded-xl text-xs text-gray-900 focus:outline-none ${coErrors.dept ? 'border-red-500' : 'border-gray-200'}`}>
                  <option value="">Select Dept</option>
                  {DEPARTMENT_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                {coErrors.dept && <p className="text-xs text-red-500 font-medium mt-1">{coErrors.dept}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Credits *</label>
                <input type="number" value={coCredits} onChange={(e) => { setCoCredits(e.target.value); if (coErrors.credits) setCoErrors({...coErrors, credits: ''}); }} placeholder="Credits (e.g. 4)" className={`w-full px-3.5 py-2 bg-gray-50 border rounded-xl text-xs text-gray-900 focus:outline-none ${coErrors.credits ? 'border-red-500' : 'border-gray-200'}`} />
                {coErrors.credits && <p className="text-xs text-red-500 font-medium mt-1">{coErrors.credits}</p>}
              </div>
            </div>
            <button type="submit" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm">Add Course</button>
          </form>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 mb-4">Course List</h2>
          {activeCourses.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <BookOpen size={36} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold text-gray-600">No courses added yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-700">
                <thead className="bg-gray-50 text-gray-900 font-bold border-b border-gray-100">
                  <tr><th className="p-3">Code</th><th className="p-3">Title</th><th className="p-3">Department</th><th className="p-3">Credits</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {activeCourses.map((c) => (
                    <tr key={c._id || c.id} className="hover:bg-gray-50">
                      <td className="p-3 font-bold text-indigo-600">{c.code}</td>
                      <td className="p-3 font-semibold text-gray-900">{c.title}</td>
                      <td className="p-3">{c.dept}</td>
                      <td className="p-3">{c.credits}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Layout>
    );
  }

  if (path === '/admin/messages') {
    return (
      <Layout role="admin" currentUser={currentUser} setCurrentUser={setCurrentUser} searchPlaceholder="Search campus administration...">
        <ChatInterface currentUser={currentUser} />
      </Layout>
    );
  }

  if (path === '/admin/subjects') {
    return (
      <Layout role="admin" currentUser={currentUser} setCurrentUser={setCurrentUser}>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Manage Subjects & Curriculum</h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">Full CRUD management for subjects, electives, lab codes, and department allocations.</p>
          </div>
          <Link to="/admin/dashboard" className="text-xs font-semibold text-indigo-600 hover:underline">
            ← Back to Overview
          </Link>
        </div>

        <SubjectManagementSection initialSubjects={activeSubjects} />
      </Layout>
    );
  }

  if (path === '/admin/classes') {
    return (
      <Layout role="admin" currentUser={currentUser} setCurrentUser={setCurrentUser}>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Classes & Sections</h1>
            <p className="text-gray-500 text-sm mt-1">Manage class section allocations.</p>
          </div>
          <Link to="/admin/dashboard" className="text-xs font-semibold text-indigo-600 hover:underline">
            ← Back to Overview
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm mb-8">
          <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Plus size={18} className="text-indigo-600" />
            Add New Class
          </h2>
          {clSuccess && <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-xl">{clSuccess}</div>}

          <form onSubmit={handleAddClass} noValidate className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Class Name *</label>
                <input type="text" value={clName} onChange={(e) => { setClName(e.target.value); if (clErrors.name) setClErrors({...clErrors, name: ''}); }} placeholder="e.g. MCA Sem 1" className={`w-full px-3.5 py-2 bg-gray-50 border rounded-xl text-xs text-gray-900 focus:outline-none ${clErrors.name ? 'border-red-500' : 'border-gray-200'}`} />
                {clErrors.name && <p className="text-xs text-red-500 font-medium mt-1">{clErrors.name}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Section *</label>
                <input type="text" value={clSection} onChange={(e) => { setClSection(e.target.value); if (clErrors.section) setClErrors({...clErrors, section: ''}); }} placeholder="Section A" className={`w-full px-3.5 py-2 bg-gray-50 border rounded-xl text-xs text-gray-900 focus:outline-none ${clErrors.section ? 'border-red-500' : 'border-gray-200'}`} />
                {clErrors.section && <p className="text-xs text-red-500 font-medium mt-1">{clErrors.section}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Room No. *</label>
                <input type="text" value={clRoom} onChange={(e) => { setClRoom(e.target.value); if (clErrors.room) setClErrors({...clErrors, room: ''}); }} placeholder="Room 402" className={`w-full px-3.5 py-2 bg-gray-50 border rounded-xl text-xs text-gray-900 focus:outline-none ${clErrors.room ? 'border-red-500' : 'border-gray-200'}`} />
                {clErrors.room && <p className="text-xs text-red-500 font-medium mt-1">{clErrors.room}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Faculty Assigned *</label>
                <input type="text" value={clFaculty} onChange={(e) => { setClFaculty(e.target.value); if (clErrors.faculty) setClErrors({...clErrors, faculty: ''}); }} placeholder="Faculty Name" className={`w-full px-3.5 py-2 bg-gray-50 border rounded-xl text-xs text-gray-900 focus:outline-none ${clErrors.faculty ? 'border-red-500' : 'border-gray-200'}`} />
                {clErrors.faculty && <p className="text-xs text-red-500 font-medium mt-1">{clErrors.faculty}</p>}
              </div>
            </div>
            <button type="submit" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm">Add Class</button>
          </form>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 mb-4">Classes List</h2>
          {activeClasses.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <SlidersHorizontal size={36} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold text-gray-600">No classes added yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-700">
                <thead className="bg-gray-50 text-gray-900 font-bold border-b border-gray-100">
                  <tr><th className="p-3">Class</th><th className="p-3">Section</th><th className="p-3">Room</th><th className="p-3">Faculty</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {activeClasses.map((c) => (
                    <tr key={c._id || c.id} className="hover:bg-gray-50">
                      <td className="p-3 font-semibold text-gray-900">{c.name}</td>
                      <td className="p-3 font-bold text-emerald-600">{c.section}</td>
                      <td className="p-3">{c.room}</td>
                      <td className="p-3">{c.faculty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Layout>
    );
  }

  if (path === '/admin/attendance') {
    return (
      <Layout role="admin" currentUser={currentUser} setCurrentUser={setCurrentUser}>
        <AdminAttendance
          currentUser={currentUser}
          facultyList={activeFaculty}
          subjectsList={activeSubjects || subjects}
        />
      </Layout>
    );
  }

  if (path === '/admin/marks') {
    return (
      <Layout role="admin" currentUser={currentUser} setCurrentUser={setCurrentUser}>
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <Link to="/admin/dashboard" className="text-xs font-medium text-gray-500 hover:text-indigo-600 transition-colors inline-flex items-center gap-1">
            ← Back to Overview
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAdminMarksTab('analytics')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                adminMarksTab === 'analytics'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 bg-white border border-slate-200 hover:bg-slate-50'
              }`}
            >
              Performance Analytics
            </button>
            <button
              onClick={() => setAdminMarksTab('entry')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                adminMarksTab === 'entry'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 bg-white border border-slate-200 hover:bg-slate-50'
              }`}
            >
              Bulk Marks Entry Grid
            </button>
          </div>
        </div>
        {adminMarksTab === 'analytics' ? (
          <StudentPerformanceDashboard
            role="admin"
            currentUser={currentUser}
            embedded={true}
          />
        ) : (
          <BulkMarksEntryGrid
            currentUser={currentUser}
            role="admin"
          />
        )}
      </Layout>
    );
  }

  if (path === '/admin/announcements') {
    return (
      <Layout role="admin" currentUser={currentUser} setCurrentUser={setCurrentUser}>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Announcements & Broadcasts</h1>
            <p className="text-gray-500 text-sm mt-1">Broadcast targeted announcements to students and faculty by department and role.</p>
          </div>
          <Link to="/admin/dashboard" className="text-xs font-semibold text-indigo-600 hover:underline">
            ← Back to Overview
          </Link>
        </div>

        {/* Create Announcement Form */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm mb-8">
          <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Plus size={18} className="text-indigo-600" />
            Create Announcement
          </h2>
          {anSuccess && <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-xl">{anSuccess}</div>}

          <form onSubmit={handleAddAnnouncement} noValidate className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Title *</label>
              <input
                type="text"
                value={anTitle}
                onChange={(e) => { setAnTitle(e.target.value); if (anErrors.title) setAnErrors({...anErrors, title: ''}); }}
                placeholder="e.g. End Semester Exam Schedule Announced"
                className={`w-full px-3.5 py-2 bg-gray-50 border rounded-xl text-xs text-gray-900 focus:outline-none ${anErrors.title ? 'border-red-500' : 'border-gray-200'}`}
              />
              {anErrors.title && <p className="text-xs text-red-500 font-medium mt-1">{anErrors.title}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Department *</label>
                <select
                  value={anDepartment}
                  onChange={(e) => { setAnDepartment(e.target.value); if (anErrors.department) setAnErrors({...anErrors, department: ''}); }}
                  className={`w-full px-3.5 py-2 bg-gray-50 border rounded-xl text-xs text-gray-900 focus:outline-none ${anErrors.department ? 'border-red-500' : 'border-gray-200'}`}
                >
                  <option value="All Departments">All Departments</option>
                  <option value="AIML">AIML</option>
                  <option value="Cyber Security">Cyber Security</option>
                </select>
                {anErrors.department && <p className="text-xs text-red-500 font-medium mt-1">{anErrors.department}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Target Role *</label>
                <select
                  value={anTargetRole}
                  onChange={(e) => { setAnTargetRole(e.target.value); if (anErrors.targetRole) setAnErrors({...anErrors, targetRole: ''}); }}
                  className={`w-full px-3.5 py-2 bg-gray-50 border rounded-xl text-xs text-gray-900 focus:outline-none ${anErrors.targetRole ? 'border-red-500' : 'border-gray-200'}`}
                >
                  <option value="Students & Faculty">Students & Faculty</option>
                  <option value="Students">Students</option>
                  <option value="Faculty">Faculty</option>
                </select>
                {anErrors.targetRole && <p className="text-xs text-red-500 font-medium mt-1">{anErrors.targetRole}</p>}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Description / Message *</label>
              <textarea
                rows={4}
                value={anMessage}
                onChange={(e) => { setAnMessage(e.target.value); if (anErrors.message) setAnErrors({...anErrors, message: ''}); }}
                placeholder="Enter complete announcement details, instructions, and circular text..."
                className={`w-full p-3 bg-gray-50 border rounded-xl text-xs text-gray-900 focus:outline-none ${anErrors.message ? 'border-red-500' : 'border-gray-200'}`}
              />
              {anErrors.message && <p className="text-xs text-red-500 font-medium mt-1">{anErrors.message}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Date (Optional)</label>
                <input
                  type="date"
                  value={anDate}
                  onChange={(e) => setAnDate(e.target.value)}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Time (Optional)</label>
                <input
                  type="time"
                  value={anTime}
                  onChange={(e) => setAnTime(e.target.value)}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Attachment (Optional)</label>
                <input
                  type="file"
                  onChange={handleAnnouncementFileChange}
                  accept=".pdf,.doc,.docx,.ppt,.pptx,image/*"
                  className="w-full text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
                {anFile && <p className="text-[11px] text-gray-500 mt-1">Selected: {anFile.fileName} ({anFile.fileSize})</p>}
              </div>
            </div>

            <ExpirationPicker
              value={anExpiresAt}
              onChange={(val) => {
                setAnExpiresAt(val);
                if (anErrors.expiresAt) setAnErrors({ ...anErrors, expiresAt: '' });
              }}
              error={anErrors.expiresAt}
              label="Announcement Auto-Expiration (Auto-Delete)"
              helperText="Announcement circular will automatically disappear from all feeds once this timestamp passes."
            />

            <button
              type="submit"
              disabled={createAnnouncementMutation.isPending}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors"
            >
              {createAnnouncementMutation.isPending ? 'Publishing...' : 'Publish Announcement'}
            </button>
          </form>
        </div>

        {/* Published Announcements List */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-900">All Published Announcements</h2>
            <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full">
              {activeAnnouncements.length} {activeAnnouncements.length === 1 ? 'Announcement' : 'Announcements'}
            </span>
          </div>

          {activeAnnouncements.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <Megaphone size={36} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold text-gray-600">No announcements available.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeAnnouncements.map((a) => (
                <div key={a._id || a.id} className="p-5 bg-gray-50 border border-gray-100 rounded-xl transition-all hover:border-gray-200">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">{a.title}</h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">
                          {a.department} → {a.targetRole}
                        </span>
                        <span className="text-[10px] text-gray-500 font-medium">
                          Dept: <strong>{a.department}</strong>
                        </span>
                        <span className="text-[10px] text-gray-500 font-medium">
                          Audience: <strong>{a.targetRole}</strong>
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this announcement?')) {
                          deleteAnnouncementMutation.mutate(a._id || a.id);
                        }
                      }}
                      className="text-xs font-semibold text-red-600 hover:text-red-700 self-start sm:self-auto px-2.5 py-1 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      Delete
                    </button>
                  </div>

                  <p className="text-xs text-gray-700 whitespace-pre-line my-2 leading-relaxed">
                    {a.message || a.description || a.content}
                  </p>

                  <div className="flex flex-wrap items-center justify-between text-[11px] text-gray-500 pt-2 border-t border-gray-200/60 mt-3">
                    <div className="flex items-center gap-3">
                      <span>📅 {a.date || (a.createdAt ? new Date(a.createdAt).toLocaleDateString() : '')}</span>
                      <span>⏰ {a.time || (a.createdAt ? new Date(a.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '')}</span>
                      <span>👤 {a.createdBy || 'Admin'}</span>
                      {a.expiresAt && (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                          ⏳ Expires: {formatFriendlyDateTime(a.expiresAt)}
                        </span>
                      )}
                    </div>
                    {a.fileData && (
                      <a
                        href={a.fileData}
                        download={a.fileName || 'announcement-file'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-semibold transition-colors mt-2 sm:mt-0"
                      >
                        📎 Download Attachment ({a.fileName || 'File'})
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

  if (path === '/admin/notices') {
    return (
      <Layout role="admin" currentUser={currentUser} setCurrentUser={setCurrentUser}>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Notices & Circulars</h1>
            <p className="text-gray-500 text-sm mt-1">Broadcast official notices.</p>
          </div>
          <Link to="/admin/dashboard" className="text-xs font-semibold text-indigo-600 hover:underline">
            ← Back to Overview
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm mb-8">
          <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Plus size={18} className="text-indigo-600" />
            Post New Notice
          </h2>
          {noSuccess && <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-xl">{noSuccess}</div>}

          <form onSubmit={handleAddNotice} noValidate className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Notice Title *</label>
                <input type="text" value={noTitle} onChange={(e) => { setNoTitle(e.target.value); if (noErrors.title) setNoErrors({...noErrors, title: ''}); }} placeholder="Notice Title" className={`w-full px-3.5 py-2 bg-gray-50 border rounded-xl text-xs text-gray-900 focus:outline-none ${noErrors.title ? 'border-red-500' : 'border-gray-200'}`} />
                {noErrors.title && <p className="text-xs text-red-500 font-medium mt-1">{noErrors.title}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Category *</label>
                <select value={noCategory} onChange={(e) => { setNoCategory(e.target.value); if (noErrors.category) setNoErrors({...noErrors, category: ''}); }} className={`w-full px-3.5 py-2 bg-gray-50 border rounded-xl text-xs text-gray-900 focus:outline-none ${noErrors.category ? 'border-red-500' : 'border-gray-200'}`}>
                  <option value="">Select Category</option>
                  <option value="Academic">Academic</option>
                  <option value="Exam">Exam</option>
                  <option value="General">General</option>
                </select>
                {noErrors.category && <p className="text-xs text-red-500 font-medium mt-1">{noErrors.category}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Audience *</label>
                <select value={noAudience} onChange={(e) => { setNoAudience(e.target.value); if (noErrors.audience) setNoErrors({...noErrors, audience: ''}); }} className={`w-full px-3.5 py-2 bg-gray-50 border rounded-xl text-xs text-gray-900 focus:outline-none ${noErrors.audience ? 'border-red-500' : 'border-gray-200'}`}>
                  <option value="">Select Audience</option>
                  <option value="All Students">All Students</option>
                  <option value="All Faculty">All Faculty</option>
                  <option value="Everyone">Everyone</option>
                </select>
                {noErrors.audience && <p className="text-xs text-red-500 font-medium mt-1">{noErrors.audience}</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Target Scope *</label>
                <select
                  value={noTargetType}
                  onChange={(e) => setNoTargetType(e.target.value)}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none"
                >
                  <option value="all">All Departments (Public)</option>
                  <option value="department">Specific Department</option>
                  <option value="individual">Individual Student</option>
                </select>
              </div>

              {noTargetType === 'individual' ? (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Target Student Enrollment *</label>
                  <input
                    type="text"
                    value={noStudent}
                    onChange={(e) => setNoStudent(e.target.value)}
                    placeholder="e.g. ABC001"
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none"
                  />
                </div>
              ) : noTargetType === 'department' ? (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Target Department *</label>
                  <select
                    value={noTargetDepartment}
                    onChange={(e) => { setNoTargetDepartment(e.target.value); if (noErrors.targetDepartment) setNoErrors({...noErrors, targetDepartment: ''}); }}
                    className={`w-full px-3.5 py-2 bg-gray-50 border rounded-xl text-xs text-gray-900 focus:outline-none ${noErrors.targetDepartment ? 'border-red-500' : 'border-gray-200'}`}
                  >
                    <option value="">Select Department</option>
                    {TARGET_DEPARTMENT_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  {noErrors.targetDepartment && <p className="text-xs text-red-500 font-medium mt-1">{noErrors.targetDepartment}</p>}
                </div>
              ) : null}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Content *</label>
              <textarea rows={3} value={noContent} onChange={(e) => { setNoContent(e.target.value); if (noErrors.content) setNoErrors({...noErrors, content: ''}); }} placeholder="Notice body content..." className={`w-full p-3 bg-gray-50 border rounded-xl text-xs text-gray-900 focus:outline-none ${noErrors.content ? 'border-red-500' : 'border-gray-200'}`} />
              {noErrors.content && <p className="text-xs text-red-500 font-medium mt-1">{noErrors.content}</p>}
            </div>

            <ExpirationPicker
              value={noExpiresAt}
              onChange={(val) => {
                setNoExpiresAt(val);
                if (noErrors.expiresAt) setNoErrors({ ...noErrors, expiresAt: '' });
              }}
              error={noErrors.expiresAt}
              label="Notice Auto-Expiration (Auto-Delete)"
              helperText="Notice circular will automatically disappear from all noticeboards once this timestamp passes."
            />

            <button type="submit" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm">Publish Notice</button>
          </form>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 mb-4">Published Notices</h2>
          {activeNotices.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <Megaphone size={36} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold text-gray-600">No notices added yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeNotices.map((n) => (
                <div key={n._id || n.id} className="p-4 bg-gray-50 border border-gray-100 rounded-xl">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold text-gray-900 text-sm">{n.title}</h3>
                    <div className="flex items-center gap-2">
                      {n.expiresAt && (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60">
                          ⏳ Expires: {formatFriendlyDateTime(n.expiresAt)}
                        </span>
                      )}
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">{n.category}</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600">{n.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </Layout>
    );
  }

  if (path === '/admin/materials') {
    return (
      <Layout role="admin" currentUser={currentUser} setCurrentUser={setCurrentUser}>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Materials & Resources</h1>
            <p className="text-gray-500 text-sm mt-1">Upload and organize academic study materials.</p>
          </div>
          <Link to="/admin/dashboard" className="text-xs font-semibold text-indigo-600 hover:underline">
            ← Back to Overview
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm mb-8">
          <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Plus size={18} className="text-indigo-600" />
            Add New Material
          </h2>
          {maSuccess && <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-xl">{maSuccess}</div>}

          <form onSubmit={handleAddMaterial} noValidate className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Material Title *</label>
                <input type="text" value={maTitle} onChange={(e) => { setMaTitle(e.target.value); if (maErrors.title) setMaErrors({...maErrors, title: ''}); }} placeholder="Material Title" className={`w-full px-3.5 py-2 bg-gray-50 border rounded-xl text-xs text-gray-900 focus:outline-none ${maErrors.title ? 'border-red-500' : 'border-gray-200'}`} />
                {maErrors.title && <p className="text-xs text-red-500 font-medium mt-1">{maErrors.title}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Subject *</label>
                <input type="text" value={maSubject} onChange={(e) => { setMaSubject(e.target.value); if (maErrors.subject) setMaErrors({...maErrors, subject: ''}); }} placeholder="Subject" className={`w-full px-3.5 py-2 bg-gray-50 border rounded-xl text-xs text-gray-900 focus:outline-none ${maErrors.subject ? 'border-red-500' : 'border-gray-200'}`} />
                {maErrors.subject && <p className="text-xs text-red-500 font-medium mt-1">{maErrors.subject}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Category *</label>
                <select value={maCategory} onChange={(e) => { setMaCategory(e.target.value); if (maErrors.category) setMaErrors({...maErrors, category: ''}); }} className={`w-full px-3.5 py-2 bg-gray-50 border rounded-xl text-xs text-gray-900 focus:outline-none ${maErrors.category ? 'border-red-500' : 'border-gray-200'}`}>
                  <option value="">Select Category</option>
                  <option value="Lecture Notes">Lecture Notes</option>
                  <option value="Lab Manual">Lab Manual</option>
                  <option value="Syllabus">Syllabus</option>
                </select>
                {maErrors.category && <p className="text-xs text-red-500 font-medium mt-1">{maErrors.category}</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Target Scope *</label>
                <select
                  value={maTargetType}
                  onChange={(e) => setMaTargetType(e.target.value)}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none"
                >
                  <option value="all">All Departments (Public)</option>
                  <option value="department">Specific Department</option>
                  <option value="individual">Individual Student</option>
                </select>
              </div>

              {maTargetType === 'individual' ? (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Target Student Enrollment *</label>
                  <input
                    type="text"
                    value={maStudent}
                    onChange={(e) => setMaStudent(e.target.value)}
                    placeholder="e.g. ABC001"
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none"
                  />
                </div>
              ) : maTargetType === 'department' ? (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Target Department *</label>
                  <select
                    value={maTargetDepartment}
                    onChange={(e) => { setMaTargetDepartment(e.target.value); if (maErrors.targetDepartment) setMaErrors({...maErrors, targetDepartment: ''}); }}
                    className={`w-full px-3.5 py-2 bg-gray-50 border rounded-xl text-xs text-gray-900 focus:outline-none ${maErrors.targetDepartment ? 'border-red-500' : 'border-gray-200'}`}
                  >
                    <option value="">Select Department</option>
                    {TARGET_DEPARTMENT_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  {maErrors.targetDepartment && <p className="text-xs text-red-500 font-medium mt-1">{maErrors.targetDepartment}</p>}
                </div>
              ) : null}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">File / URL (Optional)</label>
              <input type="text" value={maLink} onChange={(e) => setMaLink(e.target.value)} placeholder="https://example.com/material.pdf" className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none" />
            </div>
            <button type="submit" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm">Add Material</button>
          </form>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 mb-4">Study Materials List</h2>
          {activeMaterials.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <FolderKanban size={36} className="mx-auto mb-2 opacity-50" />
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
                        className="px-3 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-semibold transition-colors"
                      >
                        View File
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

  if (path === '/admin/assignments') {
    return (
      <Layout role="admin" currentUser={currentUser} setCurrentUser={setCurrentUser}>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Assignments Overview</h1>
            <p className="text-gray-500 text-sm mt-1">Manage and track student assignments.</p>
          </div>
          <Link to="/admin/dashboard" className="text-xs font-semibold text-indigo-600 hover:underline">
            ← Back to Overview
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm mb-8">
          <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Plus size={18} className="text-indigo-600" />
            Add New Assignment
          </h2>
          {asSuccess && <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-xl">{asSuccess}</div>}

          <form onSubmit={handleAddAssignment} noValidate className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Assignment Title *</label>
                <input type="text" value={asTitle} onChange={(e) => { setAsTitle(e.target.value); if (asErrors.title) setAsErrors({...asErrors, title: ''}); }} placeholder="Assignment Title" className={`w-full px-3.5 py-2 bg-gray-50 border rounded-xl text-xs text-gray-900 focus:outline-none ${asErrors.title ? 'border-red-500' : 'border-gray-200'}`} />
                {asErrors.title && <p className="text-xs text-red-500 font-medium mt-1">{asErrors.title}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Class *</label>
                <input type="text" value={asClass} onChange={(e) => { setAsClass(e.target.value); if (asErrors.class) setAsErrors({...asErrors, class: ''}); }} placeholder="Class" className={`w-full px-3.5 py-2 bg-gray-50 border rounded-xl text-xs text-gray-900 focus:outline-none ${asErrors.class ? 'border-red-500' : 'border-gray-200'}`} />
                {asErrors.class && <p className="text-xs text-red-500 font-medium mt-1">{asErrors.class}</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Subject *</label>
                <input type="text" value={asSubject} onChange={(e) => { setAsSubject(e.target.value); if (asErrors.subject) setAsErrors({...asErrors, subject: ''}); }} placeholder="Subject" className={`w-full px-3.5 py-2 bg-gray-50 border rounded-xl text-xs text-gray-900 focus:outline-none ${asErrors.subject ? 'border-red-500' : 'border-gray-200'}`} />
                {asErrors.subject && <p className="text-xs text-red-500 font-medium mt-1">{asErrors.subject}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Target Scope *</label>
                <select
                  value={asTargetType}
                  onChange={(e) => setAsTargetType(e.target.value)}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none"
                >
                  <option value="all">All Departments (Public)</option>
                  <option value="department">Specific Department</option>
                  <option value="individual">Individual Student</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Target Audience *</label>
                <select
                  value={asAudience}
                  onChange={(e) => setAsAudience(e.target.value)}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none"
                >
                  <option value="Students">Students</option>
                  <option value="Faculty">Faculty</option>
                  <option value="Students & Faculty">Students & Faculty</option>
                </select>
              </div>
            </div>

            {asTargetType === 'individual' ? (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Target Student Enrollment *</label>
                <input
                  type="text"
                  value={asStudent}
                  onChange={(e) => setAsStudent(e.target.value)}
                  placeholder="e.g. ABC001"
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none"
                />
              </div>
            ) : asTargetType === 'department' ? (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Target Department *</label>
                <select value={asTargetDepartment} onChange={(e) => { setAsTargetDepartment(e.target.value); if (asErrors.targetDepartment) setAsErrors({...asErrors, targetDepartment: ''}); }} className={`w-full px-3.5 py-2 bg-gray-50 border rounded-xl text-xs text-gray-900 focus:outline-none ${asErrors.targetDepartment ? 'border-red-500' : 'border-gray-200'}`}>
                  <option value="">Select Department</option>
                  {TARGET_DEPARTMENT_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                {asErrors.targetDepartment && <p className="text-xs text-red-500 font-medium mt-1">{asErrors.targetDepartment}</p>}
              </div>
            ) : null}

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Questions / Assignment Description *</label>
              <textarea rows={3} value={asDescription} onChange={(e) => { setAsDescription(e.target.value); if (asErrors.description) setAsErrors({...asErrors, description: ''}); }} placeholder="Assignment questions, details, and instructions" className={`w-full p-3 bg-gray-50 border rounded-xl text-xs text-gray-900 focus:outline-none ${asErrors.description ? 'border-red-500' : 'border-gray-200'}`} />
              {asErrors.description && <p className="text-xs text-red-500 font-medium mt-1">{asErrors.description}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Due Date *</label>
                <input type="date" value={asDueDate} onChange={(e) => { setAsDueDate(e.target.value); if (asErrors.dueDate) setAsErrors({...asErrors, dueDate: ''}); }} className={`w-full px-3.5 py-2 bg-gray-50 border rounded-xl text-xs text-gray-900 focus:outline-none ${asErrors.dueDate ? 'border-red-500' : 'border-gray-200'}`} />
                {asErrors.dueDate && <p className="text-xs text-red-500 font-medium mt-1">{asErrors.dueDate}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Due Time *</label>
                <input type="time" value={asDueTime} onChange={(e) => { setAsDueTime(e.target.value); if (asErrors.dueTime) setAsErrors({...asErrors, dueTime: ''}); }} className={`w-full px-3.5 py-2 bg-gray-50 border rounded-xl text-xs text-gray-900 focus:outline-none ${asErrors.dueTime ? 'border-red-500' : 'border-gray-200'}`} />
                {asErrors.dueTime && <p className="text-xs text-red-500 font-medium mt-1">{asErrors.dueTime}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Attachment (Optional)</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setAsFile(file);
                      const reader = new FileReader();
                      reader.onload = () => setAsFileData(reader.result);
                      reader.readAsDataURL(file);
                    } else {
                      setAsFile(null);
                      setAsFileData('');
                    }
                  }}
                  className="w-full text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
              </div>
            </div>

            <button type="submit" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm">
              Publish Assignment
            </button>
          </form>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 mb-4">Assignments List</h2>
          {activeAssignments.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <ClipboardList size={36} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold text-gray-600">No assignments added yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeAssignments.map((a) => {
                const subCount = Array.isArray(a.submittedBy) ? a.submittedBy.length : 0;
                return (
                  <div key={a._id || a.id} className="p-4 bg-gray-50 border border-gray-100 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-md uppercase">
                          {a.department || a.targetDepartment || 'All Departments'}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-100 text-purple-700 rounded-md">
                          {a.targetRole || a.audience || 'Students'}
                        </span>
                      </div>
                      <h3 className="font-bold text-gray-900 text-sm">{a.title}</h3>
                      <p className="text-[11px] text-gray-500">
                        {a.class} • {a.subject} • Due: {a.dueDate} {a.dueTime} • By: {a.createdBy || 'Admin'}
                      </p>
                      <p className="text-xs text-gray-600 line-clamp-1">
                        {a.questions || a.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setAsSelectedAssignmentForReview(a)}
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
                      >
                        View Submissions ({subCount})
                      </button>
                      {a.fileData && (
                        <a
                          href={a.fileData}
                          target="_blank"
                          rel="noopener noreferrer"
                          download={a.fileName}
                          className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl text-xs font-semibold transition-colors"
                        >
                          File
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to delete "${a.title}"?`)) {
                            deleteAssignmentMutation.mutate(a._id || a.id);
                          }
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                        title="Delete Assignment"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {asSelectedAssignmentForReview && (
          <AssignmentSubmissionsModal
            assignment={asSelectedAssignmentForReview}
            onClose={() => setAsSelectedAssignmentForReview(null)}
            role="admin"
          />
        )}
      </Layout>
    );
  }

  if (path === '/admin/settings') {
    return (
      <Layout role="admin" currentUser={currentUser} setCurrentUser={setCurrentUser}>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">System Settings</h1>
            <p className="text-gray-500 text-sm mt-1">Configure campus portal preferences.</p>
          </div>
          <Link to="/admin/dashboard" className="text-xs font-semibold text-indigo-600 hover:underline">
            ← Back to Overview
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200/80 p-8 shadow-sm max-w-2xl">
          <h2 className="text-base font-bold text-gray-900 mb-4">Institute Configuration</h2>
          {seSuccess && <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-xl">{seSuccess}</div>}

          <form onSubmit={handleSaveSettings} noValidate className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Institute Name *</label>
              <input type="text" value={seInstName} onChange={(e) => { setSeInstName(e.target.value); if (seErrors.name) setSeErrors({...seErrors, name: ''}); }} placeholder="e.g., Campus AI University" className={`w-full px-3.5 py-2.5 bg-gray-50 border rounded-xl text-xs text-gray-900 focus:outline-none ${seErrors.name ? 'border-red-500' : 'border-gray-200'}`} />
              {seErrors.name && <p className="text-xs text-red-500 font-medium mt-1">{seErrors.name}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Academic Year *</label>
              <input type="text" value={seAcadYear} onChange={(e) => { setSeAcadYear(e.target.value); if (seErrors.year) setSeErrors({...seErrors, year: ''}); }} placeholder="e.g., 2026-2027" className={`w-full px-3.5 py-2.5 bg-gray-50 border rounded-xl text-xs text-gray-900 focus:outline-none ${seErrors.year ? 'border-red-500' : 'border-gray-200'}`} />
              {seErrors.year && <p className="text-xs text-red-500 font-medium mt-1">{seErrors.year}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">System Support Email *</label>
              <input type="email" value={seEmail} onChange={(e) => { setSeEmail(e.target.value); if (seErrors.email) setSeErrors({...seErrors, email: ''}); }} placeholder="admin@campusai.edu" className={`w-full px-3.5 py-2.5 bg-gray-50 border rounded-xl text-xs text-gray-900 focus:outline-none ${seErrors.email ? 'border-red-500' : 'border-gray-200'}`} />
              {seErrors.email && <p className="text-xs text-red-500 font-medium mt-1">{seErrors.email}</p>}
            </div>

            <button type="submit" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm">Save System Settings</button>
          </form>
        </div>
      </Layout>
    );
  }

  // Department Detail View
  if (selectedDeptView) {
    const deptTarget = (selectedDeptView || '').trim().toLowerCase();
    const deptStudents = selectedDeptView === 'All Departments' 
      ? activeStudents 
      : activeStudents.filter(s => {
          const sDept = (s.department || '').trim().toLowerCase();
          const sCourse = (s.course || '').trim().toLowerCase();
          return sDept === deptTarget || sCourse === deptTarget;
        });
      
    const deptFaculty = selectedDeptView === 'All Departments'
      ? activeFaculty
      : activeFaculty.filter(f => {
          const fDept = (f.department || '').trim().toLowerCase();
          return fDept === deptTarget;
        });

    return (
      <Layout role="admin" currentUser={currentUser} setCurrentUser={setCurrentUser}>
        {/* Department Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-full uppercase tracking-wider">
                Department Overview
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-semibold text-slate-500">Academic Roster</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {selectedDeptView}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Detailed student registrations and faculty assignments for this department.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSelectedDeptView(null)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200/80 shadow-xs transition-colors self-start sm:self-auto"
          >
            <span>← Back to Overview</span>
          </button>
        </div>

        {/* Modal for Person Details */}
        {selectedPerson && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl border border-slate-100">
              <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    selectedPerson.type === 'student' ? 'bg-indigo-50 text-indigo-600' : 'bg-purple-50 text-purple-600'
                  }`}>
                    {selectedPerson.type === 'student' ? <Users size={18} /> : <GraduationCap size={18} />}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      {selectedPerson.type === 'student' ? 'Student Profile' : 'Faculty Profile'}
                    </h3>
                    <span className="text-[11px] font-medium text-slate-400 capitalize">
                      {selectedPerson.type} record
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPerson(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg text-lg leading-none transition-colors"
                >
                  &times;
                </button>
              </div>

              <div className="space-y-4 text-xs text-slate-700">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Full Name</span>
                    <span className="font-semibold text-slate-900 text-sm">{selectedPerson.name || 'Not Available'}</span>
                  </div>
                  <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Email</span>
                    <span className="font-medium text-slate-800 break-all">{selectedPerson.email || 'Not Available'}</span>
                  </div>
                  {selectedPerson.type === 'student' ? (
                    <>
                      <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Enrollment No.</span>
                        <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md inline-block font-mono">
                          {selectedPerson.enrollment || 'Not Available'}
                        </span>
                      </div>
                      <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Department / Course</span>
                        <span className="font-semibold text-slate-900">{selectedPerson.course || selectedPerson.department || 'Not Available'}</span>
                      </div>
                      <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Semester</span>
                        <span className="font-semibold text-slate-900">{selectedPerson.semester || 'Not Available'}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Username</span>
                        <span className="font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md inline-block font-mono">
                          {selectedPerson.username || 'Not Available'}
                        </span>
                      </div>
                      <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Department</span>
                        <span className="font-semibold text-slate-900">{selectedPerson.department || 'Not Available'}</span>
                      </div>
                    </>
                  )}
                  <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Registered Date</span>
                    <span className="font-medium text-slate-800">
                      {selectedPerson.id && !isNaN(new Date(selectedPerson.id).getTime())
                        ? new Date(selectedPerson.id).toLocaleDateString()
                        : 'System Registered'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedPerson(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition-colors"
                >
                  Close Details
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dual Roster Tables */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
          {/* Students List */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Enrolled Students</h2>
                <p className="text-xs text-slate-500 mt-0.5">Students registered in this department</p>
              </div>
              <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full">
                {deptStudents.length} Students
              </span>
            </div>

            {deptStudents.length === 0 ? (
              <div className="border border-dashed border-slate-200 rounded-xl py-10 text-center bg-slate-50/50">
                <Users size={24} className="mx-auto text-slate-400 mb-1.5" />
                <p className="text-xs font-semibold text-slate-600">No students found in this department.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-100">
                <table className="min-w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200/70">
                    <tr>
                      <th className="px-3.5 py-3">Student Name</th>
                      <th className="px-3.5 py-3">Enrollment</th>
                      <th className="px-3.5 py-3">Department</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {deptStudents.map((s, idx) => (
                      <tr
                        key={s.id || s.enrollment || `${s.name}-${idx}`}
                        className="hover:bg-indigo-50/40 cursor-pointer transition-colors"
                        onClick={() => setSelectedPerson({...s, type: 'student'})}
                      >
                        <td className="px-3.5 py-3 font-semibold text-slate-900">{s.name || '-'}</td>
                        <td className="px-3.5 py-3 font-mono font-semibold text-indigo-600">{s.enrollment || '-'}</td>
                        <td className="px-3.5 py-3 text-slate-600">{s.course || s.department || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Faculty List */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Department Faculty</h2>
                <p className="text-xs text-slate-500 mt-0.5">Faculty members assigned to this department</p>
              </div>
              <span className="px-2.5 py-1 bg-purple-50 text-purple-700 text-xs font-bold rounded-full">
                {deptFaculty.length} Faculty
              </span>
            </div>

            {deptFaculty.length === 0 ? (
              <div className="border border-dashed border-slate-200 rounded-xl py-10 text-center bg-slate-50/50">
                <GraduationCap size={24} className="mx-auto text-slate-400 mb-1.5" />
                <p className="text-xs font-semibold text-slate-600">No faculty members found in this department.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-100">
                <table className="min-w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200/70">
                    <tr>
                      <th className="px-3.5 py-3">Faculty Name</th>
                      <th className="px-3.5 py-3">Username</th>
                      <th className="px-3.5 py-3">Department</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {deptFaculty.map((f, idx) => (
                      <tr
                        key={f.id || f.username || `${f.name}-${idx}`}
                        className="hover:bg-purple-50/40 cursor-pointer transition-colors"
                        onClick={() => setSelectedPerson({...f, type: 'faculty'})}
                      >
                        <td className="px-3.5 py-3 font-semibold text-slate-900">{f.name || '-'}</td>
                        <td className="px-3.5 py-3 font-mono font-semibold text-purple-600">{f.username || '-'}</td>
                        <td className="px-3.5 py-3 text-slate-600">{f.department || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </Layout>
    );
  }

  // Overview (/admin/dashboard)
  return (
    <Layout role="admin" currentUser={currentUser} setCurrentUser={setCurrentUser}>
      {/* Top Greeting & System Status Banner */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-bold rounded-full uppercase tracking-wider">
              Administration Workspace
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-semibold text-slate-500">Live Campus System</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            College System Overview 🏛️
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time administrative control panel for students, faculty rosters, departments, and academic operations.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <div className="flex items-center gap-2 px-3.5 py-2 bg-emerald-50/90 border border-emerald-200/80 text-emerald-800 text-xs font-semibold rounded-xl shadow-2xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span>All Services Operational</span>
          </div>
        </div>
      </div>

      {/* Modern Unified Directory Search with Dynamic Filters */}
      <AdminAdvancedSearch onSelectPerson={(person) => setSelectedPerson(person)} />

      {/* Dynamic Key Metrics Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-8">
        {/* Total Students */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-md transition-all flex items-center justify-between group">
          <div>
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase block">
              Total Students
            </span>
            <span className="text-3xl font-extrabold text-slate-900 mt-1 block tracking-tight">
              {activeStudents.length}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-semibold mt-1">
              ✓ Active registrations
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
            <Users size={22} />
          </div>
        </div>

        {/* Faculty Members */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-md transition-all flex items-center justify-between group">
          <div>
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase block">
              Faculty Directory
            </span>
            <span className="text-3xl font-extrabold text-slate-900 mt-1 block tracking-tight">
              {activeFaculty.length}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] text-purple-600 font-semibold mt-1">
              ✓ Verified instructors
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
            <GraduationCap size={22} />
          </div>
        </div>

        {/* Active Courses */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-md transition-all flex items-center justify-between group">
          <div>
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase block">
              Active Courses
            </span>
            <span className="text-3xl font-extrabold text-slate-900 mt-1 block tracking-tight">
              {activeCourses.length}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 font-semibold mt-1">
              Fall Semester 2026
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
            <BookOpen size={22} />
          </div>
        </div>

        {/* Classes & Sections */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-md transition-all flex items-center justify-between group">
          <div>
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase block">
              Class Sections
            </span>
            <span className="text-3xl font-extrabold text-slate-900 mt-1 block tracking-tight">
              {activeClasses.length}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-semibold mt-1">
              Undergraduate & Grad
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
            <SlidersHorizontal size={22} />
          </div>
        </div>
      </div>

      {/* Department-wise Overview Cards */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Department Distribution</h2>
            <p className="text-xs text-slate-500 mt-0.5">Click any department card to explore roster details</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          {DEPARTMENT_OPTIONS.map(dept => {
            const deptTarget = (dept || '').trim().toLowerCase();
            const totalStudents = dept === 'All Departments' 
              ? activeStudents.length 
              : activeStudents.filter(s => {
                  const sDept = (s.department || '').trim().toLowerCase();
                  const sCourse = (s.course || '').trim().toLowerCase();
                  return sDept === deptTarget || sCourse === deptTarget;
                }).length;
            const totalFaculty = dept === 'All Departments' 
              ? activeFaculty.length 
              : activeFaculty.filter(f => {
                  const fDept = (f.department || '').trim().toLowerCase();
                  return fDept === deptTarget;
                }).length;

            return (
              <div 
                key={dept} 
                onClick={() => setSelectedDeptView(dept)}
                className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-indigo-300 hover:-translate-y-0.5 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-indigo-500" />
                    <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors text-sm">
                      {dept}
                    </h3>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                    <ArrowRight size={14} className="text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div className="flex justify-between items-center text-xs p-2.5 bg-slate-50/80 group-hover:bg-indigo-50/30 rounded-xl transition-colors">
                    <span className="text-slate-600 font-semibold flex items-center gap-2">
                      <Users size={14} className="text-indigo-500" /> Students
                    </span>
                    <span className="font-extrabold text-indigo-700 bg-white px-2 py-0.5 rounded-lg border border-slate-100 shadow-2xs">
                      {totalStudents}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs p-2.5 bg-slate-50/80 group-hover:bg-purple-50/30 rounded-xl transition-colors">
                    <span className="text-slate-600 font-semibold flex items-center gap-2">
                      <GraduationCap size={14} className="text-purple-500" /> Faculty
                    </span>
                    <span className="font-extrabold text-purple-700 bg-white px-2 py-0.5 rounded-lg border border-slate-100 shadow-2xs">
                      {totalFaculty}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* College Administration Modules Grid */}
      <div className="mb-8">
        <div className="mb-4">
          <h2 className="text-base font-bold text-slate-900">Administrative Operations Modules</h2>
          <p className="text-xs text-slate-500 mt-0.5">Quick access to campus management features and controls</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          <Link
            to="/admin/students"
            className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-indigo-300 hover:-translate-y-0.5 transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
                  <Users size={19} />
                </div>
                <ArrowRight size={16} className="text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">
                Student Management
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Manage student profiles, enrollments, credentials, and academic status.
              </p>
            </div>
          </Link>

          <Link
            to="/admin/faculty"
            className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-purple-300 hover:-translate-y-0.5 transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center">
                  <GraduationCap size={19} />
                </div>
                <ArrowRight size={16} className="text-slate-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm group-hover:text-purple-600 transition-colors">
                Faculty Directory
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Manage faculty accounts, department assignments, and subject allocation.
              </p>
            </div>
          </Link>

          <Link
            to="/admin/courses"
            className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-amber-300 hover:-translate-y-0.5 transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center">
                  <BookOpen size={19} />
                </div>
                <ArrowRight size={16} className="text-slate-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm group-hover:text-amber-600 transition-colors">
                Courses & Curriculum
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Define degree courses, syllabus credits, department affiliations, and requirements.
              </p>
            </div>
          </Link>

          <Link
            to="/admin/subjects"
            className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-blue-300 hover:-translate-y-0.5 transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
                  <BookMarked size={19} />
                </div>
                <ArrowRight size={16} className="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                Subjects & Electives
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Configure core syllabus subjects, theory/practical electives, and credit hours.
              </p>
            </div>
          </Link>

          <Link
            to="/admin/classes"
            className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-emerald-300 hover:-translate-y-0.5 transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
                  <SlidersHorizontal size={19} />
                </div>
                <ArrowRight size={16} className="text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm group-hover:text-emerald-600 transition-colors">
                Classes & Sections
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Organize classroom allocations, semester batches, and student section divisions.
              </p>
            </div>
          </Link>

          <Link
            to="/admin/attendance"
            className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-rose-300 hover:-translate-y-0.5 transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center">
                  <ClipboardList size={19} />
                </div>
                <ArrowRight size={16} className="text-slate-400 group-hover:text-rose-600 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm group-hover:text-rose-600 transition-colors">
                Attendance Overview
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Monitor campus-wide attendance percentages, lecture sessions, and logs.
              </p>
            </div>
          </Link>

          <Link
            to="/admin/marks"
            className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-violet-300 hover:-translate-y-0.5 transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-100 text-violet-600 flex items-center justify-center">
                  <ClipboardList size={19} />
                </div>
                <ArrowRight size={16} className="text-slate-400 group-hover:text-violet-600 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm group-hover:text-violet-600 transition-colors">
                Marks & Results
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Review internal marks, exam submissions, semester performance, and grade cards.
              </p>
            </div>
          </Link>

          <Link
            to="/admin/announcements"
            className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-indigo-300 hover:-translate-y-0.5 transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
                  <Megaphone size={19} />
                </div>
                <ArrowRight size={16} className="text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">
                Announcements & Broadcasts
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Publish targeted announcements by department (AIML, Cyber Security) or role.
              </p>
            </div>
          </Link>

          <Link
            to="/admin/notices"
            className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-orange-300 hover:-translate-y-0.5 transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 text-orange-600 flex items-center justify-center">
                  <Megaphone size={19} />
                </div>
                <ArrowRight size={16} className="text-slate-400 group-hover:text-orange-600 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm group-hover:text-orange-600 transition-colors">
                Notices & Circulars
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Broadcast official circulars with downloadable attachments to the campus.
              </p>
            </div>
          </Link>

          <Link
            to="/admin/materials"
            className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-teal-300 hover:-translate-y-0.5 transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 text-teal-600 flex items-center justify-center">
                  <FolderKanban size={19} />
                </div>
                <ArrowRight size={16} className="text-slate-400 group-hover:text-teal-600 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm group-hover:text-teal-600 transition-colors">
                Materials Library
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Centralized academic repository for syllabus notes, PDFs, and slide decks.
              </p>
            </div>
          </Link>

          <Link
            to="/admin/assignments"
            className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-emerald-300 hover:-translate-y-0.5 transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
                  <ClipboardList size={19} />
                </div>
                <ArrowRight size={16} className="text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm group-hover:text-emerald-600 transition-colors">
                Assignments System
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Track faculty assignment creations, deadlines, submissions, and evaluation.
              </p>
            </div>
          </Link>

          <Link
            to="/admin/settings"
            className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-slate-400 hover:-translate-y-0.5 transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center">
                  <Settings size={19} />
                </div>
                <ArrowRight size={16} className="text-slate-400 group-hover:text-slate-800 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">
                System Settings
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Configure academic year, institutional metadata, and campus security parameters.
              </p>
            </div>
          </Link>
        </div>
      </div>
    </Layout>
  );
}
