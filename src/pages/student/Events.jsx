import React, { useState } from 'react';
import Layout from '../../components/Layout';
import { Calendar as CalendarIcon, List, Plus, ChevronLeft, ChevronRight, MapPin, Clock } from 'lucide-react';

export default function StudentEvents() {
  const [category, setCategory] = useState('All Events');

  const categories = ['All Events', 'Academic', 'Cultural', 'Sports', 'Workshops', 'Examinations'];

  const daysInMonth = [
    { day: 26, isOther: true }, { day: 27, isOther: true }, { day: 28, isOther: true }, { day: 29, isOther: true }, { day: 30, isOther: true }, { day: 31, isOther: true }, { day: 1 },
    { day: 2 }, { day: 3, event: 'Orientation', color: 'bg-purple-100 text-purple-700' }, { day: 4, event: 'Campus Drive', color: 'bg-indigo-100 text-indigo-700' }, { day: 5 }, { day: 6 }, { day: 7 }, { day: 8 },
    { day: 9 }, { day: 10, event: 'Registration', color: 'bg-amber-100 text-amber-700' }, { day: 11 }, { day: 12, event: 'AI Guest Lecture', color: 'bg-indigo-600 text-white', active: true }, { day: 13 }, { day: 14, event: 'CS101 Midterm', color: 'bg-red-100 text-red-700' }, { day: 15, event: 'Hackathon', color: 'bg-emerald-100 text-emerald-700' },
    { day: 16, event: 'Tech Hub Day 2', color: 'bg-emerald-100 text-emerald-700' }, { day: 17 }, { day: 18 }, { day: 19 }, { day: 20 }, { day: 21 }, { day: 22 }
  ];

  return (
    <Layout role="student">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Campus Events</h1>
          <p className="text-gray-500 text-sm mt-1">Discover and manage academic and extracurricular activities.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-200 shadow-sm text-xs font-semibold">
            <button className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg flex items-center gap-1.5">
              <CalendarIcon size={14} /> Calendar
            </button>
            <button className="px-3 py-1.5 text-gray-600 hover:bg-gray-50 rounded-lg flex items-center gap-1.5">
              <List size={14} /> List
            </button>
          </div>

          <button className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition-colors shadow-sm">
            <Plus size={16} /> Create Event
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-6 border-b border-gray-200 mb-6 overflow-x-auto">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`pb-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-all ${
              category === cat
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Main Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm">
          {/* Controls */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-extrabold text-gray-900">August 2026</h2>
              <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-[11px] font-bold rounded-full border border-indigo-100">
                Fall Semester
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button className="p-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50">
                <ChevronLeft size={16} />
              </button>
              <button className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50">
                Today
              </button>
              <button className="p-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Days Header */}
          <div className="grid grid-cols-7 gap-px text-center text-xs font-semibold text-gray-400 mb-2">
            <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
          </div>

          {/* Grid Cells */}
          <div className="grid grid-cols-7 gap-2">
            {daysInMonth.map((item, idx) => (
              <div
                key={idx}
                className={`min-h-[72px] p-1.5 rounded-xl border transition-all ${
                  item.isOther ? 'bg-gray-50/50 border-gray-100 text-gray-300' : 'bg-white border-gray-100 text-gray-800'
                } ${item.active ? 'ring-2 ring-indigo-600 border-indigo-600' : ''}`}
              >
                <span className="text-xs font-bold block mb-1">{item.day}</span>
                {item.event && (
                  <div className={`p-1 text-[10px] font-semibold rounded-md truncate ${item.color}`}>
                    {item.event}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel */}
        <div className="space-y-6">
          {/* Featured Event Card */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 p-6 shadow-sm">
            <span className="px-2.5 py-0.5 bg-indigo-600 text-white text-[10px] font-extrabold uppercase rounded-md tracking-wider">
              FEATURED
            </span>
            <h3 className="text-xl font-bold text-gray-900 mt-3 mb-1">Fall Career Fair</h3>
            <p className="text-xs text-gray-600 leading-relaxed mb-4">
              Connect with over 50 top tech companies hiring for internships and full-time roles.
            </p>
            <button className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
              Register Now →
            </button>
          </div>

          {/* Upcoming Next */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 text-sm">Upcoming Next</h3>
              <button className="text-xs font-semibold text-indigo-600 hover:underline">View All</button>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-start gap-3">
                <div className="bg-indigo-100 text-indigo-700 px-3 py-2 rounded-xl text-center min-w-[54px]">
                  <span className="text-[10px] font-extrabold block uppercase">AUG</span>
                  <span className="text-base font-extrabold">12</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-gray-900 text-xs">AI Guest Lecture</h4>
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded">Academic</span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
                    <Clock size={12} /> 2:00 PM - 3:30 PM
                  </p>
                  <p className="text-[11px] text-gray-500 flex items-center gap-1">
                    <MapPin size={12} /> Auditorium A
                  </p>
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-start gap-3">
                <div className="bg-emerald-100 text-emerald-700 px-3 py-2 rounded-xl text-center min-w-[54px]">
                  <span className="text-[10px] font-extrabold block uppercase">AUG</span>
                  <span className="text-base font-extrabold">15</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-gray-900 text-xs">University Hackathon</h4>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded">Event</span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
                    <Clock size={12} /> Starts 9:00 AM (2 Days)
                  </p>
                  <p className="text-[11px] text-gray-500 flex items-center gap-1">
                    <MapPin size={12} /> Innovation Tech Hub
                  </p>
                  <button className="mt-2 w-full py-1.5 bg-indigo-600 text-white font-semibold text-xs rounded-lg hover:bg-indigo-700 transition-colors">
                    Register
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
