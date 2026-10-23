import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Layout from '../../components/Layout';
import { Search, FileText } from 'lucide-react';
import materialService from '../../services/materialService';
import { getVisibleMaterials } from '../../utils/visibility';

export default function StudentNotes({ currentUser, materials = [] }) {
  const [search, setSearch] = useState('');
  const studentDepartment = currentUser?.department || '';

  const { data: dbMaterials = [] } = useQuery({
    queryKey: ['materials', studentDepartment],
    queryFn: () => materialService.getMaterials(studentDepartment)
  });
  const activeMaterials = dbMaterials;

  const visibleMaterials = getVisibleMaterials(activeMaterials, currentUser);

  const filteredMaterials = visibleMaterials.filter(m => {
    if (search && !m.title?.toLowerCase().includes(search.toLowerCase()) && !m.subject?.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <Layout role="student" currentUser={currentUser}>
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Notes & Resource Library</h1>
        <p className="text-gray-500 text-sm mt-1">Access lecture notes, reference texts, and study guides.</p>
      </div>

      <div className="flex items-center justify-between gap-4 mb-8">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search materials..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
      </div>

      {filteredMaterials.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200/80 p-12 text-center text-gray-400 shadow-sm">
          <FileText size={36} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm font-semibold text-gray-600">No materials available.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMaterials.map((m) => (
            <div key={m._id || m.id} className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-md inline-block">
                    {m.category}
                  </span>
                  {m.fileType && (
                    <span className="text-[10px] font-bold text-gray-400 uppercase">{m.fileType}</span>
                  )}
                </div>
                <h3 className="font-bold text-gray-900 text-base mb-1">{m.title}</h3>
                <p className="text-xs text-indigo-600 font-semibold mb-2">{m.subject}</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-2">Target: {m.targetDepartment || 'All Departments'}</p>
                {m.fileName && (
                  <p className="text-[11px] text-gray-500 mb-4 truncate">
                    File: {m.fileName} {m.fileSize ? `(${m.fileSize})` : ''}
                  </p>
                )}
              </div>
              {m.fileData ? (
                <a
                  href={m.fileData}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={m.fileName}
                  className="w-full text-center py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors mt-2 inline-block"
                >
                  View / Open File
                </a>
              ) : (
                <div className="text-[11px] text-gray-400 italic">No file attached</div>
              )}
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
