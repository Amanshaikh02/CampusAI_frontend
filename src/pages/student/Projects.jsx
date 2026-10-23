import React, { useState } from 'react';
import Layout from '../../components/Layout';
import { Search, MoreVertical, FileText, Code2, Palette } from 'lucide-react';

export default function StudentProjects() {
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  const projects = [
    {
      id: 1,
      title: 'Campus AI Research Project',
      subject: 'Software Engineering',
      icon: FileText,
      status: 'In Progress',
      deadline: 'Aug 28, 2026',
      progress: 72,
      team: ['/avatar1.jpg', '/avatar2.jpg', '/avatar3.jpg'],
      extraMembers: 1
    },
    {
      id: 2,
      title: 'Data Structures Final',
      subject: 'Computer Science',
      icon: Code2,
      status: 'Under Review',
      deadline: 'Oct 15, 2026',
      progress: 95,
      team: ['/avatar4.jpg', '/avatar5.jpg'],
      extraMembers: 0
    },
    {
      id: 3,
      title: 'UX/UI Design Portfolio',
      subject: 'Design Systems',
      icon: Palette,
      status: 'Completed',
      deadline: 'Submitted Jun 12, 2026',
      progress: 100,
      team: ['/avatar6.jpg', '/avatar7.jpg', '/avatar8.jpg'],
      extraMembers: 0
    }
  ];

  return (
    <Layout role="student">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">My Projects</h1>
        <p className="text-gray-500 text-sm mt-1">Manage and track your active collaborations.</p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
          {['All', 'In Progress', 'Completed', 'Overdue'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                filter === tab
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((proj) => {
          const IconComp = proj.icon;
          return (
            <div key={proj.id} className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                {/* Header Badge */}
                <div className="flex items-center justify-between mb-4">
                  <span className={`px-2.5 py-1 text-[11px] font-bold rounded-full flex items-center gap-1.5 ${
                    proj.status === 'In Progress' ? 'bg-indigo-100 text-indigo-700' :
                    proj.status === 'Under Review' ? 'bg-amber-100 text-amber-800' :
                    'bg-purple-100 text-purple-700'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      proj.status === 'In Progress' ? 'bg-indigo-600' :
                      proj.status === 'Under Review' ? 'bg-amber-600' : 'bg-purple-600'
                    }`} />
                    {proj.status}
                  </span>
                  <button className="text-gray-400 hover:text-gray-600">
                    <MoreVertical size={18} />
                  </button>
                </div>

                {/* Title */}
                <h3 className="font-bold text-gray-900 text-xl leading-snug mb-1">{proj.title}</h3>
                <p className="text-xs text-gray-500 flex items-center gap-1.5 mb-6">
                  <IconComp size={14} className="text-gray-400" />
                  {proj.subject}
                </p>

                {/* Team + Deadline */}
                <div className="flex items-center justify-between mb-6 pt-2">
                  <div className="flex items-center -space-x-2">
                    {[1, 2, 3].slice(0, proj.team.length).map((_, i) => (
                      <div key={i} className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-400 to-purple-500 border-2 border-white flex items-center justify-center text-[10px] text-white font-bold">
                        {String.fromCharCode(65 + i)}
                      </div>
                    ))}
                    {proj.extraMembers > 0 && (
                      <div className="w-7 h-7 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[10px] text-gray-600 font-bold">
                        +{proj.extraMembers}
                      </div>
                    )}
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-gray-400 block uppercase font-medium">Deadline</span>
                    <span className="text-xs font-semibold text-gray-800">{proj.deadline}</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mb-6">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-gray-500 font-medium">Progress</span>
                    <span className="text-indigo-600 font-bold">{proj.progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                      style={{ width: `${proj.progress}%` }}
                    />
                  </div>
                </div>
              </div>

              <button className="w-full py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-all">
                View Details
              </button>
            </div>
          );
        })}
      </div>
    </Layout>
  );
}
