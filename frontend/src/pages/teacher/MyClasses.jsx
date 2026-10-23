import React, { useState } from 'react';
import Layout from '../../components/Layout';
import { Search, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import academicService from '../../services/academicService';
import attendanceService from '../../services/attendanceService';

export default function TeacherClasses({ currentUser, classes = [] }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const teacherName = currentUser?.name || '';
  const { data: dbClasses = [] } = useQuery({
    queryKey: ['classes', teacherName],
    queryFn: () => academicService.getClasses({ faculty: teacherName }),
    initialData: classes
  });
  const activeClasses = dbClasses.length > 0 ? dbClasses : classes;

  const { data: mySubjects = [] } = useQuery({
    queryKey: ['mySubjects'],
    queryFn: () => attendanceService.getMySubjects()
  });

  const mappedSubjectClasses = mySubjects.map((s) => ({
    _id: s._id,
    id: s._id,
    name: s.subject,
    subject: s.subject,
    course: `${s.department} - Sem ${s.semester}`,
    semester: `Semester ${s.semester}`,
    section: s.classSection || 'Section A',
    room: `${s.department} Dept`
  }));

  const allTeacherClasses = [
    ...mappedSubjectClasses,
    ...activeClasses.filter(c => !mappedSubjectClasses.some(m => m.subject.toLowerCase() === (c.subject || c.name || '').toLowerCase()))
  ];

  const filteredClasses = allTeacherClasses.filter(c => {
    if (search && !c.name?.toLowerCase().includes(search.toLowerCase()) && !c.subject?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <Layout role="teacher" currentUser={currentUser}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">My Classes</h1>
        <p className="text-gray-500 text-sm mt-1">Managing active classes and sections.</p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search classes..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
          />
        </div>
      </div>

      {/* Cards Grid */}
      {filteredClasses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200/80 p-12 text-center text-gray-400 shadow-sm">
          <Users size={36} className="mx-auto mb-2 opacity-50 text-indigo-600" />
          <p className="text-base font-semibold text-gray-600">No classes assigned yet.</p>
          <p className="text-xs text-gray-400 mt-1">Classes assigned by administration will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClasses.map((cls) => (
            <div key={cls._id || cls.id || cls.name} className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full inline-block mb-3 border border-indigo-100">
                  {cls.section || cls.code || 'Section A'}
                </span>

                <h2 className="text-xl font-extrabold text-gray-900 mb-1">{cls.name || cls.subject}</h2>
                <p className="text-xs text-gray-500 mb-6">{cls.course || cls.semester || 'Semester'}</p>

                <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100 mb-6">
                  <span className="text-[10px] text-gray-400 font-bold block uppercase mb-1 flex items-center gap-1">
                    <Users size={12} /> Assigned Room / Info
                  </span>
                  <span className="text-sm font-extrabold text-gray-900 block">{cls.room || cls.faculty || 'Room 101'}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate('/teacher/attendance')}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Users size={15} /> Attendance
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
