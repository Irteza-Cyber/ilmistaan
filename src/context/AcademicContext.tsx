import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { 
  UserProfile, 
  Semester, 
  Course, 
  Assignment, 
  Lecture, 
  Quiz, 
  ChatMessage, 
  ActiveView,
  AssignmentStatus
} from '../types';
import { 
  FALL_2026_SEMESTER, 
  INITIAL_9_COURSES, 
  INITIAL_ASSIGNMENTS, 
  INITIAL_LECTURES, 
  INITIAL_QUIZZES 
} from '../data/initialData';
import { 
  auth, 
  db, 
  googleProvider, 
  handleFirestoreError, 
  OperationType,
  testConnection 
} from '../services/firebase';
import { 
  signInWithPopup, 
  onAuthStateChanged, 
  signOut as fbSignOut 
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  onSnapshot,
  query,
  updateDoc
} from 'firebase/firestore';

interface AcademicContextType {
  currentUser: UserProfile | null;
  setCurrentUser: (user: UserProfile | null) => void;
  allUsers: UserProfile[];
  updateUserRole: (userId: string, role: 'student' | 'admin') => Promise<void>;
  toggleUserSuspension: (userId: string) => Promise<void>;
  
  // Semester
  semesters: Semester[];
  activeSemesterId: string;
  setActiveSemesterId: (id: string) => void;
  activeSemester: Semester | undefined;
  addSemester: (sem: Omit<Semester, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  
  // Courses
  courses: Course[];
  activeCourses: Course[];
  selectedCourseId: string | null;
  setSelectedCourseId: (id: string | null) => void;
  addCourse: (course: Omit<Course, 'id' | 'userId' | 'semesterId' | 'isArchived' | 'isDeleted' | 'createdAt'>) => Promise<void>;
  updateCourse: (id: string, updates: Partial<Course>) => Promise<void>;
  deleteCourse: (id: string, permanent?: boolean) => Promise<void>;
  restoreCourse: (id: string) => Promise<void>;

  // Assignments
  assignments: Assignment[];
  activeAssignments: Assignment[];
  addAssignment: (assign: Omit<Assignment, 'id' | 'userId' | 'semesterId' | 'isPinned' | 'isDeleted' | 'createdAt'>) => Promise<void>;
  updateAssignment: (id: string, updates: Partial<Assignment>) => Promise<void>;
  toggleAssignmentStatus: (id: string, status?: AssignmentStatus) => Promise<void>;
  toggleAssignmentPin: (id: string) => Promise<void>;
  deleteAssignment: (id: string, permanent?: boolean) => Promise<void>;
  restoreAssignment: (id: string) => Promise<void>;

  // Lectures
  lectures: Lecture[];
  activeLectures: Lecture[];
  addLecture: (lec: Omit<Lecture, 'id' | 'userId' | 'semesterId' | 'isPinned' | 'isDeleted' | 'createdAt'>) => Promise<void>;
  updateLecture: (id: string, updates: Partial<Lecture>) => Promise<void>;
  toggleLecturePin: (id: string) => Promise<void>;
  deleteLecture: (id: string, permanent?: boolean) => Promise<void>;
  restoreLecture: (id: string) => Promise<void>;

  // Quizzes
  quizzes: Quiz[];
  activeQuizzes: Quiz[];
  addQuiz: (quiz: Omit<Quiz, 'id' | 'userId' | 'semesterId' | 'isPinned' | 'isDeleted' | 'createdAt'>) => Promise<void>;
  updateQuiz: (id: string, updates: Partial<Quiz>) => Promise<void>;
  recordQuizScore: (id: string, score: number | null) => Promise<void>;
  toggleQuizPin: (id: string) => Promise<void>;
  deleteQuiz: (id: string, permanent?: boolean) => Promise<void>;
  restoreQuiz: (id: string) => Promise<void>;

  // Chat / AI Tutor
  chatMessages: ChatMessage[];
  addChatMessage: (msg: Omit<ChatMessage, 'id' | 'userId' | 'timestamp'>) => Promise<void>;
  clearChatHistory: () => Promise<void>;

  // Navigation & Views
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  navigateToCourse: (courseId: string, section?: 'overview' | 'assignments' | 'quizzes' | 'lectures') => void;
  activeHubTab: 'overview' | 'assignments' | 'quizzes' | 'lectures';
  setActiveHubTab: (tab: 'overview' | 'assignments' | 'quizzes' | 'lectures') => void;
  openSubjectSection: (courseId: string, section?: 'overview' | 'assignments' | 'quizzes' | 'lectures') => void;

  // Subject Pop-up Modal State
  selectedSubjectPopupCourseId: string | null;
  setSelectedSubjectPopupCourseId: (id: string | null) => void;
  selectedSubjectPopupTab: 'assignments' | 'quizzes' | 'lectures' | 'overview';
  setSelectedSubjectPopupTab: (tab: 'assignments' | 'quizzes' | 'lectures' | 'overview') => void;
  selectedSubjectPopupItem: { type: 'assignment' | 'quiz' | 'lecture'; id: string } | null;
  setSelectedSubjectPopupItem: (item: { type: 'assignment' | 'quiz' | 'lecture'; id: string } | null) => void;
  openSubjectPopup: (courseId: string, initialTab?: 'assignments' | 'quizzes' | 'lectures' | 'overview', itemId?: string, itemType?: 'assignment' | 'quiz' | 'lecture') => void;
  closeSubjectPopup: () => void;

  // Selected Detail Views
  selectedAssignmentDetail: Assignment | null;
  setSelectedAssignmentDetail: (a: Assignment | null) => void;
  selectedQuizDetail: Quiz | null;
  setSelectedQuizDetail: (q: Quiz | null) => void;
  selectedLectureDetail: Lecture | null;
  setSelectedLectureDetail: (l: Lecture | null) => void;

  // Search & Global modals
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isQuickAddOpen: boolean;
  setIsQuickAddOpen: (open: boolean) => void;
  quickAddType: 'assignment' | 'lecture' | 'quiz';
  setQuickAddType: (type: 'assignment' | 'lecture' | 'quiz') => void;

  // Undo Notification Toast
  undoToast: { message: string; onUndo: () => void } | null;
  setUndoToast: (toast: { message: string; onUndo: () => void } | null) => void;

  // Auth actions
  loginWithGoogle: () => Promise<void>;
  loginDemo: (role: 'student' | 'admin') => void;
  signOut: () => Promise<void>;
  isDbConnected: boolean;
}

const AcademicContext = createContext<AcademicContextType | undefined>(undefined);

const DEMO_STUDENT: UserProfile = {
  userId: 'usr_student_irteza',
  email: 'muhammadirteza2024@gmail.com',
  name: 'Muhammad Irteza',
  role: 'student',
  isSuspended: false,
  timezone: 'Asia/Karachi (GMT+5)',
  createdAt: '2026-09-01T00:00:00Z',
};

const DEMO_ADMIN: UserProfile = {
  userId: 'usr_admin_portal',
  email: 'dean.academic@university.edu',
  name: 'Prof. Registrar Office',
  role: 'admin',
  isSuspended: false,
  timezone: 'Asia/Karachi (GMT+5)',
  createdAt: '2026-08-15T00:00:00Z',
};

export const AcademicProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('unidiary_user');
    return saved ? JSON.parse(saved) : DEMO_STUDENT;
  });

  const [allUsers, setAllUsers] = useState<UserProfile[]>([
    DEMO_STUDENT,
    DEMO_ADMIN,
    {
      userId: 'usr_student_zain',
      email: 'zain.ali@student.uni.edu',
      name: 'Zain Ali',
      role: 'student',
      isSuspended: false,
      timezone: 'Asia/Karachi (GMT+5)',
      createdAt: '2026-09-02T11:00:00Z',
    },
    {
      userId: 'usr_student_ayesha',
      email: 'ayesha.khan@student.uni.edu',
      name: 'Ayesha Khan',
      role: 'student',
      isSuspended: true,
      timezone: 'Asia/Karachi (GMT+5)',
      createdAt: '2026-09-03T14:30:00Z',
    }
  ]);

  const [semesters, setSemesters] = useState<Semester[]>(() => {
    const saved = localStorage.getItem('unidiary_semesters');
    return saved ? JSON.parse(saved) : [{ ...FALL_2026_SEMESTER, userId: currentUser?.userId || 'usr_student_irteza' }];
  });

  const [activeSemesterId, setActiveSemesterId] = useState<string>('sem_fall_2026');

  const [courses, setCourses] = useState<Course[]>(() => {
    const saved = localStorage.getItem('unidiary_courses');
    if (saved) return JSON.parse(saved);
    const uid = currentUser?.userId || 'usr_student_irteza';
    return INITIAL_9_COURSES.map(c => ({ ...c, userId: uid }));
  });

  const [assignments, setAssignments] = useState<Assignment[]>(() => {
    const saved = localStorage.getItem('unidiary_assignments_v3');
    if (saved) return JSON.parse(saved);
    const uid = currentUser?.userId || 'usr_student_irteza';
    return INITIAL_ASSIGNMENTS.map((a, idx) => ({ ...a, userId: uid, assignmentNumber: a.assignmentNumber || (idx + 1) }));
  });

  const [lectures, setLectures] = useState<Lecture[]>(() => {
    const saved = localStorage.getItem('unidiary_lectures_v3');
    if (saved) return JSON.parse(saved);
    const uid = currentUser?.userId || 'usr_student_irteza';
    return INITIAL_LECTURES.map((l, idx) => ({ ...l, userId: uid, lectureNumber: l.lectureNumber || (idx + 1), title: l.title || l.topicsCovered }));
  });

  const [quizzes, setQuizzes] = useState<Quiz[]>(() => {
    const saved = localStorage.getItem('unidiary_quizzes_v3');
    if (saved) return JSON.parse(saved);
    const uid = currentUser?.userId || 'usr_student_irteza';
    return INITIAL_QUIZZES.map((q, idx) => ({ ...q, userId: uid, quizNumber: q.quizNumber || (idx + 1), assignedDate: q.assignedDate || '2026-09-25' }));
  });

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('unidiary_chat');
    return saved ? JSON.parse(saved) : [
      {
        id: 'msg_initial',
        userId: currentUser?.userId || 'usr_student_irteza',
        role: 'model',
        persona: 'tutor',
        model: 'gemini-3.8-flash',
        content: `Assalam-o-Alaikum & Welcome to ILMISTAAN — Dawoodian's Portal! I am your AI Academic Tutor, fully synchronized with your Fall 2026 semester.\n\nI have loaded all 9 of your registered subjects: Calculus (MATH-101), Functional English (ENG-101), Programming Fundamentals (Theory & Lab), AICT (Theory & Lab), Pakistan Studies (PST-101), Islamiat (ISL-101), and Fahem-ul-Quran (FQ-102).\n\nHow can I help you today? You can choose a persona above or use one of the quick study prompts below!`,
        timestamp: new Date().toISOString()
      }
    ];
  });

  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [activeHubTab, setActiveHubTab] = useState<'overview' | 'assignments' | 'quizzes' | 'lectures'>('overview');
  const [selectedAssignmentDetail, setSelectedAssignmentDetail] = useState<Assignment | null>(null);
  const [selectedQuizDetail, setSelectedQuizDetail] = useState<Quiz | null>(null);
  const [selectedLectureDetail, setSelectedLectureDetail] = useState<Lecture | null>(null);

  // Subject Pop-up Modal States
  const [selectedSubjectPopupCourseId, setSelectedSubjectPopupCourseId] = useState<string | null>(null);
  const [selectedSubjectPopupTab, setSelectedSubjectPopupTab] = useState<'assignments' | 'quizzes' | 'lectures' | 'overview'>('assignments');
  const [selectedSubjectPopupItem, setSelectedSubjectPopupItem] = useState<{ type: 'assignment' | 'quiz' | 'lecture'; id: string } | null>(null);

  const openSubjectPopup = (
    courseId: string, 
    initialTab: 'assignments' | 'quizzes' | 'lectures' | 'overview' = 'assignments',
    itemId?: string,
    itemType?: 'assignment' | 'quiz' | 'lecture'
  ) => {
    setSelectedSubjectPopupCourseId(courseId);
    setSelectedSubjectPopupTab(initialTab);
    if (itemId && itemType) {
      setSelectedSubjectPopupItem({ type: itemType, id: itemId });
    } else {
      setSelectedSubjectPopupItem(null);
    }
  };

  const closeSubjectPopup = () => {
    setSelectedSubjectPopupCourseId(null);
    setSelectedSubjectPopupItem(null);
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddType, setQuickAddType] = useState<'assignment' | 'lecture' | 'quiz'>('assignment');
  const [undoToast, setUndoToast] = useState<{ message: string; onUndo: () => void } | null>(null);
  const [isDbConnected, setIsDbConnected] = useState(true);

  // Sync to local storage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('unidiary_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('unidiary_user');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('unidiary_semesters', JSON.stringify(semesters));
  }, [semesters]);

  useEffect(() => {
    localStorage.setItem('unidiary_courses', JSON.stringify(courses));
  }, [courses]);

  useEffect(() => {
    localStorage.setItem('unidiary_assignments_v3', JSON.stringify(assignments));
  }, [assignments]);

  useEffect(() => {
    localStorage.setItem('unidiary_lectures_v3', JSON.stringify(lectures));
  }, [lectures]);

  useEffect(() => {
    localStorage.setItem('unidiary_quizzes_v3', JSON.stringify(quizzes));
  }, [quizzes]);

  useEffect(() => {
    localStorage.setItem('unidiary_chat', JSON.stringify(chatMessages));
  }, [chatMessages]);

  // Test Firestore on boot
  useEffect(() => {
    testConnection().then(connected => {
      setIsDbConnected(connected);
    });
  }, []);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const userDocRef = doc(db, 'users', fbUser.uid);
          const snap = await getDoc(userDocRef);
          if (snap.exists()) {
            const data = snap.data() as UserProfile;
            setCurrentUser(data);
          } else {
            const isBootstrappedAdmin = fbUser.email === 'muhammadirteza2024@gmail.com';
            const newUser: UserProfile = {
              userId: fbUser.uid,
              email: fbUser.email || 'student@university.edu',
              name: fbUser.displayName || 'University Student',
              role: isBootstrappedAdmin ? 'admin' : 'student',
              isSuspended: false,
              timezone: 'Asia/Karachi (GMT+5)',
              createdAt: new Date().toISOString()
            };
            await setDoc(userDocRef, newUser);
            setCurrentUser(newUser);
          }
        } catch (err) {
          console.warn('Firestore user fetch notice (continuing seamlessly):', err);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Filtered active records (excluding soft-deleted)
  const activeSemester = useMemo(() => {
    return semesters.find(s => s.id === activeSemesterId) || semesters[0];
  }, [semesters, activeSemesterId]);

  const activeCourses = useMemo(() => {
    return courses.filter(c => !c.isDeleted && c.semesterId === activeSemesterId);
  }, [courses, activeSemesterId]);

  const activeAssignments = useMemo(() => {
    return assignments.filter(a => !a.isDeleted && a.semesterId === activeSemesterId);
  }, [assignments, activeSemesterId]);

  const activeLectures = useMemo(() => {
    return lectures.filter(l => !l.isDeleted && l.semesterId === activeSemesterId);
  }, [lectures, activeSemesterId]);

  const activeQuizzes = useMemo(() => {
    return quizzes.filter(q => !q.isDeleted && q.semesterId === activeSemesterId);
  }, [quizzes, activeSemesterId]);

  // Auth Operations
  const loginWithGoogle = async () => {
    try {
      const res = await signInWithPopup(auth, googleProvider);
      const fbUser = res.user;
      const isBootstrappedAdmin = fbUser.email === 'muhammadirteza2024@gmail.com';
      const profile: UserProfile = {
        userId: fbUser.uid,
        email: fbUser.email || 'student@university.edu',
        name: fbUser.displayName || 'University Student',
        role: isBootstrappedAdmin ? 'admin' : 'student',
        isSuspended: false,
        timezone: 'Asia/Karachi (GMT+5)',
        createdAt: new Date().toISOString()
      };
      try {
        await setDoc(doc(db, 'users', fbUser.uid), profile, { merge: true });
      } catch (e) {
        console.warn('Firestore setDoc notice:', e);
      }
      setCurrentUser(profile);
    } catch (err: any) {
      console.error('Google Sign-In failed:', err);
      // Fallback demo student if popups are blocked in dev preview
      loginDemo('student');
    }
  };

  const loginDemo = (role: 'student' | 'admin') => {
    const user = role === 'admin' ? DEMO_ADMIN : DEMO_STUDENT;
    setCurrentUser(user);
  };

  const signOut = async () => {
    try {
      await fbSignOut(auth);
    } catch (e) {
      console.warn(e);
    }
    setCurrentUser(null);
    localStorage.removeItem('unidiary_user');
  };

  const updateUserRole = async (userId: string, role: 'student' | 'admin') => {
    setAllUsers(prev => prev.map(u => u.userId === userId ? { ...u, role } : u));
    if (currentUser?.userId === userId) {
      setCurrentUser(prev => prev ? { ...prev, role } : null);
    }
    try {
      if (auth.currentUser) {
        await updateDoc(doc(db, 'users', userId), { role });
      }
    } catch (err) {
      console.warn('Role update notice:', err);
    }
  };

  const toggleUserSuspension = async (userId: string) => {
    setAllUsers(prev => prev.map(u => {
      if (u.userId === userId) {
        const isSuspended = !u.isSuspended;
        return { ...u, isSuspended };
      }
      return u;
    }));
    if (currentUser?.userId === userId) {
      setCurrentUser(prev => prev ? { ...prev, isSuspended: !prev.isSuspended } : null);
    }
    try {
      if (auth.currentUser) {
        const target = allUsers.find(u => u.userId === userId);
        if (target) {
          await updateDoc(doc(db, 'users', userId), { isSuspended: !target.isSuspended });
        }
      }
    } catch (err) {
      console.warn('Suspension toggle notice:', err);
    }
  };

  // Semesters
  const addSemester = async (sem: Omit<Semester, 'id' | 'userId' | 'createdAt'>) => {
    const id = `sem_${Date.now()}`;
    const newSem: Semester = {
      ...sem,
      id,
      userId: currentUser?.userId || 'usr_student_irteza',
      createdAt: new Date().toISOString()
    };
    setSemesters(prev => [...prev, newSem]);
    setActiveSemesterId(id);
    try {
      if (auth.currentUser) {
        await setDoc(doc(db, `users/${auth.currentUser.uid}/semesters`, id), newSem);
      }
    } catch (err) {
      console.warn(err);
    }
  };

  // Courses
  const addCourse = async (c: Omit<Course, 'id' | 'userId' | 'semesterId' | 'isArchived' | 'isDeleted' | 'createdAt'>) => {
    const id = `course_${Date.now()}`;
    const newCourse: Course = {
      ...c,
      id,
      userId: currentUser?.userId || 'usr_student_irteza',
      semesterId: activeSemesterId,
      isArchived: false,
      isDeleted: false,
      createdAt: new Date().toISOString()
    };
    setCourses(prev => [...prev, newCourse]);
    try {
      if (auth.currentUser) {
        await setDoc(doc(db, `users/${auth.currentUser.uid}/courses`, id), newCourse);
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const updateCourse = async (id: string, updates: Partial<Course>) => {
    setCourses(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    try {
      if (auth.currentUser) {
        await updateDoc(doc(db, `users/${auth.currentUser.uid}/courses`, id), updates);
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const deleteCourse = async (id: string, permanent: boolean = false) => {
    if (permanent) {
      setCourses(prev => prev.filter(c => c.id !== id));
    } else {
      updateCourse(id, { isDeleted: true });
    }
  };

  const restoreCourse = async (id: string) => {
    updateCourse(id, { isDeleted: false });
  };

  // Assignments
  const addAssignment = async (assign: Omit<Assignment, 'id' | 'userId' | 'semesterId' | 'isPinned' | 'isDeleted' | 'createdAt'>) => {
    const id = `assign_${Date.now()}`;
    const courseTasks = assignments.filter(a => a.courseId === assign.courseId);
    const newAssign: Assignment = {
      ...assign,
      assignmentNumber: assign.assignmentNumber || (courseTasks.length + 1),
      id,
      userId: currentUser?.userId || 'usr_student_irteza',
      semesterId: activeSemesterId,
      isPinned: false,
      isDeleted: false,
      createdAt: new Date().toISOString()
    };
    setAssignments(prev => [newAssign, ...prev]);
    try {
      if (auth.currentUser) {
        await setDoc(doc(db, `users/${auth.currentUser.uid}/assignments`, id), newAssign);
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const updateAssignment = async (id: string, updates: Partial<Assignment>) => {
    setAssignments(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
    try {
      if (auth.currentUser) {
        await updateDoc(doc(db, `users/${auth.currentUser.uid}/assignments`, id), updates);
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const toggleAssignmentStatus = async (id: string, explicitStatus?: AssignmentStatus) => {
    const target = assignments.find(a => a.id === id);
    if (!target) return;
    const oldStatus = target.status;
    const newStatus = explicitStatus !== undefined ? explicitStatus : (oldStatus === 'completed' ? 'pending' : 'completed');
    
    await updateAssignment(id, { status: newStatus });

    // Show Undo Toast
    setUndoToast({
      message: `Assignment marked as ${newStatus.replace('_', ' ')}`,
      onUndo: () => {
        updateAssignment(id, { status: oldStatus });
      }
    });
  };

  const toggleAssignmentPin = async (id: string) => {
    const target = assignments.find(a => a.id === id);
    if (!target) return;
    await updateAssignment(id, { isPinned: !target.isPinned });
  };

  const deleteAssignment = async (id: string, permanent: boolean = false) => {
    const target = assignments.find(a => a.id === id);
    if (permanent) {
      setAssignments(prev => prev.filter(a => a.id !== id));
    } else {
      await updateAssignment(id, { isDeleted: true });
      if (target) {
        setUndoToast({
          message: `Moved "${target.title}" to trash`,
          onUndo: () => {
            updateAssignment(id, { isDeleted: false });
          }
        });
      }
    }
  };

  const restoreAssignment = async (id: string) => {
    await updateAssignment(id, { isDeleted: false });
  };

  // Lectures
  const addLecture = async (lec: Omit<Lecture, 'id' | 'userId' | 'semesterId' | 'isPinned' | 'isDeleted' | 'createdAt'>) => {
    const id = `lec_${Date.now()}`;
    const courseLecs = lectures.filter(l => l.courseId === lec.courseId);
    const newLec: Lecture = {
      ...lec,
      lectureNumber: lec.lectureNumber || (courseLecs.length + 1),
      title: lec.title || lec.topicsCovered,
      id,
      userId: currentUser?.userId || 'usr_student_irteza',
      semesterId: activeSemesterId,
      isPinned: false,
      isDeleted: false,
      createdAt: new Date().toISOString()
    };
    setLectures(prev => [newLec, ...prev]);
    try {
      if (auth.currentUser) {
        await setDoc(doc(db, `users/${auth.currentUser.uid}/lectures`, id), newLec);
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const updateLecture = async (id: string, updates: Partial<Lecture>) => {
    setLectures(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
    try {
      if (auth.currentUser) {
        await updateDoc(doc(db, `users/${auth.currentUser.uid}/lectures`, id), updates);
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const toggleLecturePin = async (id: string) => {
    const target = lectures.find(l => l.id === id);
    if (!target) return;
    await updateLecture(id, { isPinned: !target.isPinned });
  };

  const deleteLecture = async (id: string, permanent: boolean = false) => {
    if (permanent) {
      setLectures(prev => prev.filter(l => l.id !== id));
    } else {
      await updateLecture(id, { isDeleted: true });
    }
  };

  const restoreLecture = async (id: string) => {
    await updateLecture(id, { isDeleted: false });
  };

  // Quizzes
  const addQuiz = async (quiz: Omit<Quiz, 'id' | 'userId' | 'semesterId' | 'isPinned' | 'isDeleted' | 'createdAt'>) => {
    const id = `quiz_${Date.now()}`;
    const courseQzs = quizzes.filter(q => q.courseId === quiz.courseId);
    const newQuiz: Quiz = {
      ...quiz,
      quizNumber: quiz.quizNumber || (courseQzs.length + 1),
      assignedDate: quiz.assignedDate || new Date().toISOString().split('T')[0],
      id,
      userId: currentUser?.userId || 'usr_student_irteza',
      semesterId: activeSemesterId,
      isPinned: false,
      isDeleted: false,
      createdAt: new Date().toISOString()
    };
    setQuizzes(prev => [newQuiz, ...prev]);
    try {
      if (auth.currentUser) {
        await setDoc(doc(db, `users/${auth.currentUser.uid}/quizzes`, id), newQuiz);
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const updateQuiz = async (id: string, updates: Partial<Quiz>) => {
    setQuizzes(prev => prev.map(q => q.id === id ? { ...q, ...updates } : q));
    try {
      if (auth.currentUser) {
        await updateDoc(doc(db, `users/${auth.currentUser.uid}/quizzes`, id), updates);
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const recordQuizScore = async (id: string, score: number | null) => {
    await updateQuiz(id, { obtainedMarks: score, status: score !== null ? 'completed' : 'upcoming' });
  };

  const toggleQuizPin = async (id: string) => {
    const target = quizzes.find(q => q.id === id);
    if (!target) return;
    await updateQuiz(id, { isPinned: !target.isPinned });
  };

  const deleteQuiz = async (id: string, permanent: boolean = false) => {
    if (permanent) {
      setQuizzes(prev => prev.filter(q => q.id !== id));
    } else {
      await updateQuiz(id, { isDeleted: true });
    }
  };

  const restoreQuiz = async (id: string) => {
    await updateQuiz(id, { isDeleted: false });
  };

  // Chat / AI Tutor
  const addChatMessage = async (msg: Omit<ChatMessage, 'id' | 'userId' | 'timestamp'>) => {
    const id = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newMsg: ChatMessage = {
      ...msg,
      id,
      userId: currentUser?.userId || 'usr_student_irteza',
      timestamp: new Date().toISOString()
    };
    setChatMessages(prev => [...prev, newMsg]);
    try {
      if (auth.currentUser) {
        await setDoc(doc(db, `users/${auth.currentUser.uid}/chatMessages`, id), newMsg);
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const clearChatHistory = async () => {
    setChatMessages([]);
    localStorage.removeItem('unidiary_chat');
  };

  const navigateToCourse = (courseId: string, section: 'overview' | 'assignments' | 'quizzes' | 'lectures' = 'assignments') => {
    setSelectedCourseId(courseId);
    setActiveHubTab(section);
    openSubjectPopup(courseId, section);
  };

  const openSubjectSection = (courseId: string, section: 'overview' | 'assignments' | 'quizzes' | 'lectures' = 'assignments') => {
    openSubjectPopup(courseId, section);
  };

  return (
    <AcademicContext.Provider value={{
      currentUser,
      setCurrentUser,
      allUsers,
      updateUserRole,
      toggleUserSuspension,
      semesters,
      activeSemesterId,
      setActiveSemesterId,
      activeSemester,
      addSemester,
      courses,
      activeCourses,
      selectedCourseId,
      setSelectedCourseId,
      activeHubTab,
      setActiveHubTab,
      openSubjectSection,
      selectedSubjectPopupCourseId,
      setSelectedSubjectPopupCourseId,
      selectedSubjectPopupTab,
      setSelectedSubjectPopupTab,
      selectedSubjectPopupItem,
      setSelectedSubjectPopupItem,
      openSubjectPopup,
      closeSubjectPopup,
      selectedAssignmentDetail,
      setSelectedAssignmentDetail,
      selectedQuizDetail,
      setSelectedQuizDetail,
      selectedLectureDetail,
      setSelectedLectureDetail,
      addCourse,
      updateCourse,
      deleteCourse,
      restoreCourse,
      assignments,
      activeAssignments,
      addAssignment,
      updateAssignment,
      toggleAssignmentStatus,
      toggleAssignmentPin,
      deleteAssignment,
      restoreAssignment,
      lectures,
      activeLectures,
      addLecture,
      updateLecture,
      toggleLecturePin,
      deleteLecture,
      restoreLecture,
      quizzes,
      activeQuizzes,
      addQuiz,
      updateQuiz,
      recordQuizScore,
      toggleQuizPin,
      deleteQuiz,
      restoreQuiz,
      chatMessages,
      addChatMessage,
      clearChatHistory,
      activeView,
      setActiveView,
      navigateToCourse,
      searchQuery,
      setSearchQuery,
      isQuickAddOpen,
      setIsQuickAddOpen,
      quickAddType,
      setQuickAddType,
      undoToast,
      setUndoToast,
      loginWithGoogle,
      loginDemo,
      signOut,
      isDbConnected
    }}>
      {children}
    </AcademicContext.Provider>
  );
};

export const useAcademic = () => {
  const context = useContext(AcademicContext);
  if (!context) {
    throw new Error('useAcademic must be used within an AcademicProvider');
  }
  return context;
};
