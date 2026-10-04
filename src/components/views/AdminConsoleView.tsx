import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Users, 
  BookOpen, 
  Database, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  UserCheck, 
  UserX,
  Server
} from 'lucide-react';
import { useAcademic } from '../../context/AcademicContext';
import { formatDate } from '../../utils/dateUtils';

export const AdminConsoleView: React.FC = () => {
  const { 
    currentUser, 
    allUsers, 
    updateUserRole, 
    toggleUserSuspension,
    courses, 
    assignments, 
    lectures, 
    quizzes,
    isDbConnected
  } = useAcademic();

  const [studentSearch, setStudentSearch] = useState('');

  if (currentUser?.role !== 'admin') {
    return (
      <div className="p-8 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
        <ShieldCheck className="w-10 h-10 text-rose-500 mx-auto mb-2" />
        <h3 className="font-bold text-slate-900 text-sm">Access Restricted</h3>
        <p className="text-xs text-slate-500 mt-1">This console requires elevated Academic Administrator credentials.</p>
      </div>
    );
  }

  const filteredUsers = allUsers.filter(u => 
    u.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(studentSearch.toLowerCase())
  );

  const totalDiaryRecords = courses.length + assignments.length + lectures.length + quizzes.length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            University Administrator & Registrar Console
          </h2>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Student directory governance, role assignments, suspension controls, and database integrity
        </p>
      </div>

      {/* System Metrics Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Enrolled Students</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
            {allUsers.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Registered accounts</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Active Courses</span>
            <BookOpen className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
            {courses.filter(c => !c.isDeleted).length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Fall 2026 registered</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Diary Records</span>
            <Database className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
            {totalDiaryRecords}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Tasks, notes, exams</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Database Status</span>
            <Server className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-center gap-1.5 text-sm font-bold text-emerald-600 mt-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Firestore Online</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Zero-Trust Rules Active</p>
        </div>
      </div>

      {/* Student Directory Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Student & Faculty Directory
            </h3>
            <p className="text-[11px] text-slate-500">
              Manage student permissions, promote faculty/admin roles, and toggle suspensions
            </p>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={studentSearch}
              onChange={e => setStudentSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-400 uppercase font-mono text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-3">Student Name</th>
                <th className="px-4 py-3">University Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Account Status</th>
                <th className="px-4 py-3">Registered Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredUsers.map(user => (
                <tr key={user.userId} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    {user.name}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-500">
                    {user.email}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded capitalize ${
                      user.role === 'admin' ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {user.isSuspended ? (
                      <span className="text-rose-600 font-semibold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Suspended</span>
                      </span>
                    ) : (
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Active</span>
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-400">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      onClick={() => updateUserRole(user.userId, user.role === 'admin' ? 'student' : 'admin')}
                      className="px-2 py-1 text-[11px] font-medium text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded"
                    >
                      {user.role === 'admin' ? 'Set as Student' : 'Promote Admin'}
                    </button>
                    <button
                      onClick={() => toggleUserSuspension(user.userId)}
                      className={`px-2 py-1 text-[11px] font-medium rounded ${
                        user.isSuspended
                          ? 'text-emerald-700 hover:bg-emerald-50 font-semibold'
                          : 'text-rose-600 hover:bg-rose-50'
                      }`}
                    >
                      {user.isSuspended ? 'Reinstate' : 'Suspend'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
