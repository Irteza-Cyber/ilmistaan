import React from 'react';
import { Trash2, RotateCcw, AlertTriangle } from 'lucide-react';
import { useAcademic } from '../../context/AcademicContext';

export const TrashView: React.FC = () => {
  const { 
    assignments, 
    lectures, 
    quizzes, 
    courses,
    restoreAssignment, 
    deleteAssignment,
    restoreLecture, 
    deleteLecture,
    restoreQuiz, 
    deleteQuiz,
    restoreCourse,
    deleteCourse
  } = useAcademic();

  const deletedAssignments = assignments.filter(a => a.isDeleted);
  const deletedLectures = lectures.filter(l => l.isDeleted);
  const deletedQuizzes = quizzes.filter(q => q.isDeleted);
  const deletedCourses = courses.filter(c => c.isDeleted);

  const totalTrash = deletedAssignments.length + deletedLectures.length + deletedQuizzes.length + deletedCourses.length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div>
        <h2 className="text-base font-bold text-slate-900 tracking-tight">
          Trash Bin & Soft-Delete Recovery
        </h2>
        <p className="text-xs text-slate-500">
          Restore inadvertently deleted records or permanently wipe them from storage
        </p>
      </div>

      {totalTrash === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/80 p-12 text-center text-slate-400 text-xs shadow-2xs">
          <Trash2 className="w-8 h-8 mx-auto text-slate-300 mb-2" />
          <p className="font-semibold text-slate-700">Trash bin is empty.</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Deleted coursework deliverables will appear here for safe restoration.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200/60">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Items in the trash can be restored back to your active semester or permanently destroyed.</span>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {/* Deleted Courses */}
            {deletedCourses.map(c => (
              <div key={c.id} className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded mr-2">
                    Subject: {c.code}
                  </span>
                  <span className="font-semibold text-slate-900">{c.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => restoreCourse(c.id)}
                    className="px-2.5 py-1 text-emerald-700 hover:bg-emerald-50 rounded flex items-center gap-1 font-semibold"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restore</span>
                  </button>
                  <button
                    onClick={() => deleteCourse(c.id, true)}
                    className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 rounded font-semibold"
                  >
                    Wipe
                  </button>
                </div>
              </div>
            ))}

            {/* Deleted Assignments */}
            {deletedAssignments.map(a => (
              <div key={a.id} className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-mono text-xs text-slate-500 mr-2">[Assignment]</span>
                  <span className="font-semibold text-slate-900">{a.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => restoreAssignment(a.id)}
                    className="px-2.5 py-1 text-emerald-700 hover:bg-emerald-50 rounded flex items-center gap-1 font-semibold"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restore</span>
                  </button>
                  <button
                    onClick={() => deleteAssignment(a.id, true)}
                    className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 rounded font-semibold"
                  >
                    Wipe
                  </button>
                </div>
              </div>
            ))}

            {/* Deleted Lectures */}
            {deletedLectures.map(l => (
              <div key={l.id} className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-mono text-xs text-slate-500 mr-2">[Lecture]</span>
                  <span className="font-semibold text-slate-900">Lec #{l.lectureNumber}: {l.topicsCovered}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => restoreLecture(l.id)}
                    className="px-2.5 py-1 text-emerald-700 hover:bg-emerald-50 rounded flex items-center gap-1 font-semibold"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restore</span>
                  </button>
                  <button
                    onClick={() => deleteLecture(l.id, true)}
                    className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 rounded font-semibold"
                  >
                    Wipe
                  </button>
                </div>
              </div>
            ))}

            {/* Deleted Quizzes */}
            {deletedQuizzes.map(q => (
              <div key={q.id} className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-mono text-xs text-slate-500 mr-2">[Quiz]</span>
                  <span className="font-semibold text-slate-900">{q.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => restoreQuiz(q.id)}
                    className="px-2.5 py-1 text-emerald-700 hover:bg-emerald-50 rounded flex items-center gap-1 font-semibold"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restore</span>
                  </button>
                  <button
                    onClick={() => deleteQuiz(q.id, true)}
                    className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 rounded font-semibold"
                  >
                    Wipe
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
