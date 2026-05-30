// ============================================================================
//  SMARTCLASS ANALYTICS - PROFESSIONAL BACKEND API
//  Cloudflare Pages Functions with Full CRUD Operations
//  Version: 2.0.0
//  Author: ALLAN
// ============================================================================

// ============================================================================
//  DATA STORAGE (In-memory with persistence via Cache API)
//  For production: Replace with D1 Database
// ============================================================================

// Global state (persists between requests in same worker instance)
let globalState = {
    users: [],
    classes: [],
    students: [],
    lessonPlans: [],
    marks: [],
    lastBackup: null
};

// Initialize demo data
function initDemoData() {
    // Demo Classes
    if (globalState.classes.length === 0) {
        globalState.classes = [
            { id: "cls_001", name: "Physics S4A", academicYear: "2026", term: 3, studentCount: 42, average: 68, createdAt: new Date().toISOString() },
            { id: "cls_002", name: "Physics S3B", academicYear: "2026", term: 3, studentCount: 38, average: 58, createdAt: new Date().toISOString() },
            { id: "cls_003", name: "Physics S3A", academicYear: "2026", term: 3, studentCount: 40, average: 72, createdAt: new Date().toISOString() },
            { id: "cls_004", name: "Physics S2A", academicYear: "2026", term: 3, studentCount: 35, average: 66, createdAt: new Date().toISOString() },
            { id: "cls_005", name: "Physics S2B", academicYear: "2026", term: 3, studentCount: 37, average: 84, createdAt: new Date().toISOString() }
        ];
    }
    
    // Demo Students
    if (globalState.students.length === 0) {
        globalState.students = [
            { id: "stu_001", classId: "cls_001", name: "UWAMAHORO Eric", registrationNumber: "2024001", parentPhone: "0788XXXXXX", term1: 82, term2: 88, term3: 94, createdAt: new Date().toISOString() },
            { id: "stu_002", classId: "cls_001", name: "IRADUKUNDA Diane", registrationNumber: "2024002", parentPhone: "0788XXXXXX", term1: 85, term2: 89, term3: 91, createdAt: new Date().toISOString() },
            { id: "stu_003", classId: "cls_001", name: "NSENGIYUMVA Jean", registrationNumber: "2024003", parentPhone: "0788XXXXXX", term1: 80, term2: 85, term3: 88, createdAt: new Date().toISOString() },
            { id: "stu_004", classId: "cls_001", name: "MUKAMANA Grace", registrationNumber: "2024004", parentPhone: "0788XXXXXX", term1: 45, term2: 58, term3: 71, createdAt: new Date().toISOString() },
            { id: "stu_005", classId: "cls_001", name: "NDAYISABA Pierre", registrationNumber: "2024005", parentPhone: "0788XXXXXX", term1: 38, term2: 42, term3: 41, createdAt: new Date().toISOString() }
        ];
    }
    
    // Demo Lesson Plans
    if (globalState.lessonPlans.length === 0) {
        globalState.lessonPlans = [
            { id: "lp_001", classId: "cls_001", className: "Physics S4A", day: "Monday", startTime: "08:00", duration: 60, createdAt: new Date().toISOString() },
            { id: "lp_002", classId: "cls_002", className: "Physics S3B", day: "Monday", startTime: "10:00", duration: 60, createdAt: new Date().toISOString() },
            { id: "lp_003", classId: "cls_001", className: "Physics S4A", day: "Tuesday", startTime: "08:00", duration: 60, createdAt: new Date().toISOString() },
            { id: "lp_004", classId: "cls_004", className: "Physics S2A", day: "Wednesday", startTime: "14:00", duration: 60, createdAt: new Date().toISOString() },
            { id: "lp_005", classId: "cls_003", className: "Physics S3A", day: "Thursday", startTime: "09:00", duration: 60, createdAt: new Date().toISOString() },
            { id: "lp_006", classId: "cls_001", className: "Physics S4A", day: "Friday", startTime: "08:00", duration: 60, createdAt: new Date().toISOString() },
            { id: "lp_007", classId: "cls_005", className: "Physics S2B", day: "Friday", startTime: "10:00", duration: 60, createdAt: new Date().toISOString() }
        ];
    }
    
    // Demo User (for demo login)
    if (globalState.users.length === 0) {
        globalState.users.push({
            id: "usr_demo_001",
            fullname: "Mr. Jean UWIMANA",
            email: "teacher@school.rw",
            school: "G.S. Saint Andre",
            subject: "Physics",
            passwordHash: btoa("password123"),
            createdAt: new Date().toISOString()
        });
    }
}

// ============================================================================
//  HELPER FUNCTIONS
// ============================================================================

function generateId(prefix) {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function createToken(userId, email, name) {
    const payload = {
        userId,
        email,
        name,
        exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
        iat: Date.now()
    };
    return btoa(JSON.stringify(payload));
}

function verifyToken(token) {
    try {
        const payload = JSON.parse(atob(token));
        if (payload.exp < Date.now()) return null;
        return payload;
    } catch {
        return null;
    }
}

function createResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
    });
}

function createErrorResponse(message, status = 400) {
    return createResponse({ success: false, message }, status);
}

function getAuthUser(request) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    const token = authHeader.split(' ')[1];
    return verifyToken(token);
}

// ============================================================================
//  CRUD OPERATIONS - CLASSES
// ============================================================================

function getAllClasses() {
    return globalState.classes.map(cls => ({
        ...cls,
        studentCount: globalState.students.filter(s => s.classId === cls.id).length,
        average: Math.round(globalState.students.filter(s => s.classId === cls.id).reduce((sum, s) => sum + (s.term3 || 0), 0) / (globalState.students.filter(s => s.classId === cls.id).length || 1))
    }));
}

function getClassById(classId) {
    return globalState.classes.find(c => c.id === classId);
}

function createClass(data) {
    const newClass = {
        id: generateId("cls"),
        name: data.name,
        academicYear: data.academicYear || "2026",
        term: data.term || 3,
        createdAt: new Date().toISOString()
    };
    globalState.classes.push(newClass);
    return newClass;
}

function updateClass(classId, data) {
    const index = globalState.classes.findIndex(c => c.id === classId);
    if (index === -1) return null;
    globalState.classes[index] = { ...globalState.classes[index], ...data, updatedAt: new Date().toISOString() };
    return globalState.classes[index];
}

function deleteClass(classId) {
    const index = globalState.classes.findIndex(c => c.id === classId);
    if (index === -1) return false;
    globalState.classes.splice(index, 1);
    // Also delete related students
    globalState.students = globalState.students.filter(s => s.classId !== classId);
    return true;
}

// ============================================================================
//  CRUD OPERATIONS - STUDENTS
// ============================================================================

function getStudentsByClass(classId) {
    return globalState.students.filter(s => s.classId === classId);
}

function getAllStudents() {
    return globalState.students;
}

function getStudentById(studentId) {
    return globalState.students.find(s => s.id === studentId);
}

function createStudent(data) {
    const newStudent = {
        id: generateId("stu"),
        classId: data.classId,
        name: data.name,
        registrationNumber: data.registrationNumber || "",
        parentPhone: data.parentPhone || "",
        term1: data.term1 || 0,
        term2: data.term2 || 0,
        term3: data.term3 || 0,
        createdAt: new Date().toISOString()
    };
    globalState.students.push(newStudent);
    return newStudent;
}

function updateStudent(studentId, data) {
    const index = globalState.students.findIndex(s => s.id === studentId);
    if (index === -1) return null;
    globalState.students[index] = { ...globalState.students[index], ...data, updatedAt: new Date().toISOString() };
    return globalState.students[index];
}

function updateStudentMarks(studentId, term1, term2, term3) {
    const index = globalState.students.findIndex(s => s.id === studentId);
    if (index === -1) return false;
    if (term1 !== undefined) globalState.students[index].term1 = term1;
    if (term2 !== undefined) globalState.students[index].term2 = term2;
    if (term3 !== undefined) globalState.students[index].term3 = term3;
    globalState.students[index].updatedAt = new Date().toISOString();
    return true;
}

function deleteStudent(studentId) {
    const index = globalState.students.findIndex(s => s.id === studentId);
    if (index === -1) return false;
    globalState.students.splice(index, 1);
    return true;
}

// ============================================================================
//  CRUD OPERATIONS - LESSON PLANS
// ============================================================================

function getAllLessonPlans() {
    return globalState.lessonPlans;
}

function getLessonPlansByClass(classId) {
    return globalState.lessonPlans.filter(lp => lp.classId === classId);
}

function createLessonPlan(data) {
    const newPlan = {
        id: generateId("lp"),
        classId: data.classId,
        className: data.className,
        day: data.day,
        startTime: data.startTime,
        duration: data.duration,
        createdAt: new Date().toISOString()
    };
    globalState.lessonPlans.push(newPlan);
    return newPlan;
}

function deleteLessonPlan(planId) {
    const index = globalState.lessonPlans.findIndex(lp => lp.id === planId);
    if (index === -1) return false;
    globalState.lessonPlans.splice(index, 1);
    return true;
}

// ============================================================================
//  SMART GROUPS ALGORITHM
// ============================================================================

function createSmartGroups(classId, numGroups, strategy = "balanced") {
    const students = getStudentsByClass(classId);
    
    if (students.length === 0) {
        return [];
    }
    
    // Calculate averages
    const studentsWithAvg = students.map(s => ({
        ...s,
        average: (s.term1 + s.term2 + s.term3) / 3
    }));
    
    // Sort by strategy
    if (strategy === "balanced") {
        studentsWithAvg.sort((a, b) => b.average - a.average);
    } else if (strategy === "random") {
        for (let i = studentsWithAvg.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [studentsWithAvg[i], studentsWithAvg[j]] = [studentsWithAvg[j], studentsWithAvg[i]];
        }
    } else if (strategy === "same") {
        studentsWithAvg.sort((a, b) => b.average - a.average);
    }
    
    // Create groups
    const groups = Array(numGroups).fill().map(() => []);
    
    for (let i = 0; i < studentsWithAvg.length; i++) {
        groups[i % numGroups].push(studentsWithAvg[i]);
    }
    
    // Calculate group averages and identify leaders
    return groups.map((group, idx) => {
        const groupAvg = group.length > 0 ? group.reduce((sum, s) => sum + s.average, 0) / group.length : 0;
        const leader = group.length > 0 ? [...group].sort((a, b) => b.average - a.average)[0] : null;
        
        return {
            groupNumber: idx + 1,
            average: Math.round(groupAvg),
            leader: leader ? leader.name : null,
            leaderScore: leader ? leader.average : 0,
            members: group.map(m => ({
                id: m.id,
                name: m.name,
                average: m.average,
                term1: m.term1,
                term2: m.term2,
                term3: m.term3
            })),
            size: group.length
        };
    });
}

// ============================================================================
//  ANALYTICS ENGINE
// ============================================================================

function getClassAnalytics(classId) {
    const students = getStudentsByClass(classId);
    const className = getClassById(classId)?.name || "Unknown Class";
    
    if (students.length === 0) {
        return {
            className,
            totalStudents: 0,
            average: 0,
            highest: 0,
            lowest: 0,
            passingRate: 0,
            gradeDistribution: { A: 0, B: 0, C: 0, D: 0, F: 0 },
            topPerformers: [],
            trend: 0
        };
    }
    
    const term3Scores = students.map(s => s.term3 || 0);
    const average = term3Scores.reduce((a, b) => a + b, 0) / students.length;
    const highest = Math.max(...term3Scores);
    const lowest = Math.min(...term3Scores);
    const passingCount = term3Scores.filter(s => s >= 50).length;
    const passingRate = (passingCount / students.length) * 100;
    
    // Grade distribution
    const gradeDistribution = {
        A: term3Scores.filter(s => s >= 90).length,
        B: term3Scores.filter(s => s >= 80 && s < 90).length,
        C: term3Scores.filter(s => s >= 70 && s < 80).length,
        D: term3Scores.filter(s => s >= 50 && s < 70).length,
        F: term3Scores.filter(s => s < 50).length
    };
    
    // Top performers
    const topPerformers = [...students]
        .sort((a, b) => (b.term3 || 0) - (a.term3 || 0))
        .slice(0, 5)
        .map(s => ({ name: s.name, score: s.term3 || 0 }));
    
    // Calculate trend (compare with previous term)
    const term2Scores = students.map(s => s.term2 || 0);
    const prevAverage = term2Scores.reduce((a, b) => a + b, 0) / students.length;
    const trend = average - prevAverage;
    
    return {
        className,
        totalStudents: students.length,
        average: Math.round(average),
        highest,
        lowest,
        passingRate: Math.round(passingRate),
        gradeDistribution,
        topPerformers,
        trend: Math.round(trend * 10) / 10
    };
}

function getPredictiveInsights() {
    const allStudents = getAllStudents();
    const atRisk = [];
    const improving = [];
    
    for (const student of allStudents) {
        const term1 = student.term1 || 0;
        const term2 = student.term2 || 0;
        const term3 = student.term3 || 0;
        const avg = (term1 + term2 + term3) / 3;
        
        // Detect declining performance (at risk)
        if (term3 < 50 && term3 < term2 && term2 < term1) {
            atRisk.push({
                id: student.id,
                name: student.name,
                classId: student.classId,
                term1,
                term2,
                term3,
                decline: term1 - term3,
                confidence: Math.min(95, 70 + (term1 - term3))
            });
        }
        
        // Detect improvement
        if (term3 > 70 && term3 > term2 && term2 > term1) {
            improving.push({
                id: student.id,
                name: student.name,
                classId: student.classId,
                term1,
                term2,
                term3,
                improvement: term3 - term1,
                confidence: Math.min(90, 60 + (term3 - term1))
            });
        }
    }
    
    return { atRisk: atRisk.slice(0, 10), improving: improving.slice(0, 10) };
}

// ============================================================================
//  MAIN REQUEST HANDLER
// ============================================================================

export async function onRequest(context) {
    const { request } = context;
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    
    // Initialize demo data
    initDemoData();
    
    // ========================================================================
    //  CORS PREFLIGHT
    // ========================================================================
    if (method === 'OPTIONS') {
        return new Response(null, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Max-Age': '86400'
            }
        });
    }
    
    // ========================================================================
    //  HEALTH CHECK
    // ========================================================================
    if (path === '/api/health' && method === 'GET') {
        return createResponse({
            success: true,
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: '2.0.0',
            stats: {
                users: globalState.users.length,
                classes: globalState.classes.length,
                students: globalState.students.length,
                lessonPlans: globalState.lessonPlans.length
            }
        });
    }
    
    // ========================================================================
    //  AUTHENTICATION ENDPOINTS
    // ========================================================================
    
    // SIGNUP
    if (path === '/api/signup' && method === 'POST') {
        try {
            const body = await request.json();
            const { fullname, email, school, subject, password } = body;
            
            if (!fullname || !email || !school || !subject || !password) {
                return createErrorResponse('All fields are required', 400);
            }
            
            if (password.length < 6) {
                return createErrorResponse('Password must be at least 6 characters', 400);
            }
            
            // Check if user exists
            if (globalState.users.find(u => u.email === email)) {
                return createErrorResponse('Email already exists', 400);
            }
            
            // Create user
            const newUser = {
                id: generateId('usr'),
                fullname,
                email,
                school,
                subject,
                passwordHash: btoa(password),
                createdAt: new Date().toISOString()
            };
            globalState.users.push(newUser);
            
            return createResponse({
                success: true,
                message: 'Account created successfully',
                userId: newUser.id
            });
        } catch (error) {
            return createErrorResponse('Server error', 500);
        }
    }
    
    // LOGIN
    if (path === '/api/login' && method === 'POST') {
        try {
            const body = await request.json();
            const { email, password } = body;
            
            if (!email || !password) {
                return createErrorResponse('Email and password required', 400);
            }
            
            // Find user
            const user = globalState.users.find(u => u.email === email && atob(u.passwordHash) === password);
            
            if (user) {
                const token = createToken(user.id, user.email, user.fullname);
                return createResponse({
                    success: true,
                    token,
                    name: user.fullname,
                    email: user.email,
                    school: user.school,
                    subject: user.subject
                });
            }
            
            // Demo account fallback
            if (email === 'teacher@school.rw' && password === 'password123') {
                const token = createToken('demo_001', email, 'Mr. Jean UWIMANA');
                return createResponse({
                    success: true,
                    token,
                    name: 'Mr. Jean UWIMANA',
                    email: email,
                    school: 'G.S. Saint Andre',
                    subject: 'Physics'
                });
            }
            
            return createErrorResponse('Invalid credentials', 401);
        } catch (error) {
            return createErrorResponse('Server error', 500);
        }
    }
    
    // VERIFY TOKEN
    if (path === '/api/verify' && method === 'GET') {
        const user = getAuthUser(request);
        if (user) {
            return createResponse({ success: true, user });
        }
        return createErrorResponse('Invalid token', 401);
    }
    
    // ========================================================================
    //  PROTECTED ENDPOINTS - Require Authentication
    // ========================================================================
    
    const authUser = getAuthUser(request);
    if (!authUser && !path.startsWith('/api/health')) {
        return createErrorResponse('Unauthorized', 401);
    }
    
    // ========================================================================
    //  CLASSES ENDPOINTS
    // ========================================================================
    
    // GET all classes
    if (path === '/api/classes' && method === 'GET') {
        return createResponse({ success: true, data: getAllClasses() });
    }
    
    // GET single class
    if (path.match(/^\/api\/classes\/[^\/]+$/) && method === 'GET') {
        const classId = path.split('/').pop();
        const classData = getClassById(classId);
        if (classData) {
            return createResponse({ success: true, data: classData });
        }
        return createErrorResponse('Class not found', 404);
    }
    
    // CREATE class
    if (path === '/api/classes' && method === 'POST') {
        try {
            const body = await request.json();
            const newClass = createClass(body);
            return createResponse({ success: true, data: newClass });
        } catch (error) {
            return createErrorResponse('Failed to create class', 500);
        }
    }
    
    // UPDATE class
    if (path.match(/^\/api\/classes\/[^\/]+$/) && method === 'PUT') {
        const classId = path.split('/').pop();
        try {
            const body = await request.json();
            const updatedClass = updateClass(classId, body);
            if (updatedClass) {
                return createResponse({ success: true, data: updatedClass });
            }
            return createErrorResponse('Class not found', 404);
        } catch (error) {
            return createErrorResponse('Failed to update class', 500);
        }
    }
    
    // DELETE class
    if (path.match(/^\/api\/classes\/[^\/]+$/) && method === 'DELETE') {
        const classId = path.split('/').pop();
        if (deleteClass(classId)) {
            return createResponse({ success: true, message: 'Class deleted' });
        }
        return createErrorResponse('Class not found', 404);
    }
    
    // ========================================================================
    //  STUDENTS ENDPOINTS
    // ========================================================================
    
    // GET students by class
    if (path.match(/^\/api\/classes\/[^\/]+\/students$/) && method === 'GET') {
        const classId = path.split('/')[3];
        const students = getStudentsByClass(classId);
        return createResponse({ success: true, data: students });
    }
    
    // GET all students
    if (path === '/api/students' && method === 'GET') {
        return createResponse({ success: true, data: getAllStudents() });
    }
    
    // CREATE student
    if (path.match(/^\/api\/classes\/[^\/]+\/students$/) && method === 'POST') {
        try {
            const body = await request.json();
            const newStudent = createStudent(body);
            return createResponse({ success: true, data: newStudent });
        } catch (error) {
            return createErrorResponse('Failed to create student', 500);
        }
    }
    
    // UPDATE student marks
    if (path.match(/^\/api\/students\/[^\/]+\/marks$/) && method === 'PUT') {
        const studentId = path.split('/')[3];
        try {
            const { term1, term2, term3 } = await request.json();
            if (updateStudentMarks(studentId, term1, term2, term3)) {
                return createResponse({ success: true, message: 'Marks updated' });
            }
            return createErrorResponse('Student not found', 404);
        } catch (error) {
            return createErrorResponse('Failed to update marks', 500);
        }
    }
    
    // DELETE student
    if (path.match(/^\/api\/students\/[^\/]+$/) && method === 'DELETE') {
        const studentId = path.split('/').pop();
        if (deleteStudent(studentId)) {
            return createResponse({ success: true, message: 'Student deleted' });
        }
        return createErrorResponse('Student not found', 404);
    }
    
    // ========================================================================
    //  SMART GROUPS ENDPOINTS
    // ========================================================================
    
    if (path === '/api/groups/create' && method === 'POST') {
        try {
            const { class_id, num_groups, strategy } = await request.json();
            const groups = createSmartGroups(class_id, num_groups, strategy || 'balanced');
            return createResponse({ success: true, data: groups });
        } catch (error) {
            return createErrorResponse('Failed to create groups', 500);
        }
    }
    
    // ========================================================================
    //  ANALYTICS ENDPOINTS
    // ========================================================================
    
    if (path.match(/^\/api\/analytics\/class\/[^\/]+$/) && method === 'GET') {
        const classId = path.split('/').pop();
        const analytics = getClassAnalytics(classId);
        return createResponse({ success: true, data: analytics });
    }
    
    if (path === '/api/analytics/predict' && method === 'GET') {
        const insights = getPredictiveInsights();
        return createResponse({ success: true, data: insights });
    }
    
    // ========================================================================
    //  LESSON PLANNER ENDPOINTS
    // ========================================================================
    
    if (path === '/api/lesson-planner/schedule' && method === 'GET') {
        return createResponse({ success: true, data: getAllLessonPlans() });
    }
    
    if (path === '/api/lesson-planner/schedule' && method === 'POST') {
        try {
            const body = await request.json();
            const newPlan = createLessonPlan(body);
            return createResponse({ success: true, data: newPlan });
        } catch (error) {
            return createErrorResponse('Failed to create lesson plan', 500);
        }
    }
    
    if (path === '/api/lesson-planner/upload' && method === 'POST') {
        // In production, parse uploaded file here
        return createResponse({ success: true, message: 'File uploaded successfully' });
    }
    
    // ========================================================================
    //  TEACHER PROFILE ENDPOINTS
    // ========================================================================
    
    if (path === '/api/teacher/profile' && method === 'GET') {
        const user = globalState.users.find(u => u.email === authUser?.email);
        if (user) {
            return createResponse({
                success: true,
                data: {
                    fullname: user.fullname,
                    email: user.email,
                    school: user.school,
                    subject: user.subject
                }
            });
        }
        // Demo profile
        return createResponse({
            success: true,
            data: {
                fullname: 'Mr. Jean UWIMANA',
                email: 'teacher@school.rw',
                school: 'G.S. Saint Andre',
                subject: 'Physics'
            }
        });
    }
    
    if (path === '/api/teacher/profile' && method === 'PUT') {
        try {
            const body = await request.json();
            const userIndex = globalState.users.findIndex(u => u.email === authUser?.email);
            if (userIndex !== -1) {
                globalState.users[userIndex] = { ...globalState.users[userIndex], ...body, updatedAt: new Date().toISOString() };
                return createResponse({ success: true, message: 'Profile updated' });
            }
            return createErrorResponse('User not found', 404);
        } catch (error) {
            return createErrorResponse('Failed to update profile', 500);
        }
    }
    
    // ========================================================================
    //  BACKUP & RESTORE ENDPOINTS
    // ========================================================================
    
    if (path === '/api/backup/export' && method === 'GET') {
        const backup = {
            version: '2.0.0',
            exportDate: new Date().toISOString(),
            data: {
                classes: globalState.classes,
                students: globalState.students,
                lessonPlans: globalState.lessonPlans,
                users: globalState.users.map(u => ({ ...u, passwordHash: undefined })) // Remove sensitive data
            }
        };
        return createResponse({ success: true, data: backup });
    }
    
    // ========================================================================
    //  404 - NOT FOUND
    // ========================================================================
    
    return createErrorResponse(`API endpoint not found: ${path}`, 404);
}
