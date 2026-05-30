// ============================================================================
//  SMARTCLASS ANALYTICS - CLOUDFLARE WORKER
//  Professional Backend API with Default Export
// ============================================================================

// ============================================================================
//  DATA STORAGE (In-memory)
// ============================================================================

let users = [
    {
        id: "usr_demo_001",
        fullname: "Mr. Jean UWIMANA",
        email: "teacher@school.rw",
        school: "G.S. Saint Andre",
        subject: "Physics",
        passwordHash: btoa("password123"),
        createdAt: new Date().toISOString()
    }
];

let classes = [
    { id: "cls_001", name: "Physics S4A", academicYear: "2026", term: 3, createdAt: new Date().toISOString() },
    { id: "cls_002", name: "Physics S3B", academicYear: "2026", term: 3, createdAt: new Date().toISOString() },
    { id: "cls_003", name: "Physics S3A", academicYear: "2026", term: 3, createdAt: new Date().toISOString() },
    { id: "cls_004", name: "Physics S2A", academicYear: "2026", term: 3, createdAt: new Date().toISOString() },
    { id: "cls_005", name: "Physics S2B", academicYear: "2026", term: 3, createdAt: new Date().toISOString() }
];

let students = [
    { id: "stu_001", classId: "cls_001", name: "UWAMAHORO Eric", term1: 82, term2: 88, term3: 94 },
    { id: "stu_002", classId: "cls_001", name: "IRADUKUNDA Diane", term1: 85, term2: 89, term3: 91 },
    { id: "stu_003", classId: "cls_001", name: "NSENGIYUMVA Jean", term1: 80, term2: 85, term3: 88 },
    { id: "stu_004", classId: "cls_001", name: "MUKAMANA Grace", term1: 45, term2: 58, term3: 71 },
    { id: "stu_005", classId: "cls_001", name: "NDAYISABA Pierre", term1: 38, term2: 42, term3: 41 }
];

// ============================================================================
//  HELPER FUNCTIONS
// ============================================================================

function generateId(prefix) {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
}

function createToken(userId, email, name) {
    const payload = { userId, email, name, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 };
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

function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
    });
}

// ============================================================================
//  REQUEST HANDLER
// ============================================================================

async function handleRequest(request) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // CORS Preflight
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
        return jsonResponse({
            success: true,
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: '2.0.0'
        });
    }

    // ========================================================================
    //  AUTHENTICATION
    // ========================================================================
    
    // SIGNUP
    if (path === '/api/signup' && method === 'POST') {
        try {
            const body = await request.json();
            const { fullname, email, school, subject, password } = body;
            
            if (!fullname || !email || !school || !subject || !password) {
                return jsonResponse({ success: false, message: 'All fields required' }, 400);
            }
            
            if (password.length < 6) {
                return jsonResponse({ success: false, message: 'Password must be at least 6 characters' }, 400);
            }
            
            if (users.find(u => u.email === email)) {
                return jsonResponse({ success: false, message: 'Email already exists' }, 400);
            }
            
            users.push({
                id: generateId('usr'),
                fullname,
                email,
                school,
                subject,
                passwordHash: btoa(password),
                createdAt: new Date().toISOString()
            });
            
            return jsonResponse({ success: true, message: 'Account created successfully' });
        } catch (error) {
            return jsonResponse({ success: false, message: 'Server error' }, 500);
        }
    }
    
    // LOGIN
    if (path === '/api/login' && method === 'POST') {
        try {
            const body = await request.json();
            const { email, password } = body;
            
            if (!email || !password) {
                return jsonResponse({ success: false, message: 'Email and password required' }, 400);
            }
            
            const user = users.find(u => u.email === email && atob(u.passwordHash) === password);
            
            if (user) {
                const token = createToken(user.id, user.email, user.fullname);
                return jsonResponse({ success: true, token, name: user.fullname, email: user.email });
            }
            
            // Demo account
            if (email === 'teacher@school.rw' && password === 'password123') {
                const token = createToken('demo_001', email, 'Mr. Jean UWIMANA');
                return jsonResponse({ success: true, token, name: 'Mr. Jean UWIMANA', email });
            }
            
            return jsonResponse({ success: false, message: 'Invalid credentials' }, 401);
        } catch (error) {
            return jsonResponse({ success: false, message: 'Server error' }, 500);
        }
    }
    
    // VERIFY TOKEN
    if (path === '/api/verify' && method === 'GET') {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return jsonResponse({ success: false, message: 'No token provided' }, 401);
        }
        const token = authHeader.split(' ')[1];
        const payload = verifyToken(token);
        if (payload) {
            return jsonResponse({ success: true, user: payload });
        }
        return jsonResponse({ success: false, message: 'Invalid token' }, 401);
    }

    // ========================================================================
    //  CLASSES
    // ========================================================================
    
    if (path === '/api/classes' && method === 'GET') {
        const classesWithStats = classes.map(cls => ({
            ...cls,
            studentCount: students.filter(s => s.classId === cls.id).length,
            average: Math.round(students.filter(s => s.classId === cls.id).reduce((sum, s) => sum + (s.term3 || 0), 0) / (students.filter(s => s.classId === cls.id).length || 1))
        }));
        return jsonResponse({ success: true, data: classesWithStats });
    }
    
    if (path === '/api/classes' && method === 'POST') {
        try {
            const body = await request.json();
            const newClass = { id: generateId('cls'), ...body, createdAt: new Date().toISOString() };
            classes.push(newClass);
            return jsonResponse({ success: true, data: newClass });
        } catch (error) {
            return jsonResponse({ success: false, message: 'Failed to create class' }, 500);
        }
    }
    
    // GET students by class
    if (path.match(/^\/api\/classes\/[^\/]+\/students$/) && method === 'GET') {
        const classId = path.split('/')[3];
        const classStudents = students.filter(s => s.classId === classId);
        return jsonResponse({ success: true, data: classStudents });
    }
    
    // ADD student
    if (path.match(/^\/api\/classes\/[^\/]+\/students$/) && method === 'POST') {
        try {
            const body = await request.json();
            const newStudent = { id: generateId('stu'), ...body, createdAt: new Date().toISOString() };
            students.push(newStudent);
            return jsonResponse({ success: true, data: newStudent });
        } catch (error) {
            return jsonResponse({ success: false, message: 'Failed to add student' }, 500);
        }
    }
    
    // UPDATE student marks
    if (path.match(/^\/api\/students\/[^\/]+\/marks$/) && method === 'PUT') {
        const studentId = path.split('/')[3];
        try {
            const { term1, term2, term3 } = await request.json();
            const index = students.findIndex(s => s.id === studentId);
            if (index !== -1) {
                if (term1 !== undefined) students[index].term1 = term1;
                if (term2 !== undefined) students[index].term2 = term2;
                if (term3 !== undefined) students[index].term3 = term3;
                return jsonResponse({ success: true, message: 'Marks updated' });
            }
            return jsonResponse({ success: false, message: 'Student not found' }, 404);
        } catch (error) {
            return jsonResponse({ success: false, message: 'Failed to update marks' }, 500);
        }
    }
    
    // ========================================================================
    //  SMART GROUPS
    // ========================================================================
    
    if (path === '/api/groups/create' && method === 'POST') {
        try {
            const { class_id, num_groups, strategy } = await request.json();
            const classStudents = students.filter(s => s.classId === class_id);
            const studentsWithAvg = classStudents.map(s => ({
                ...s,
                average: (s.term1 + s.term2 + s.term3) / 3
            }));
            
            if (strategy === 'balanced') {
                studentsWithAvg.sort((a, b) => b.average - a.average);
            } else if (strategy === 'random') {
                for (let i = studentsWithAvg.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [studentsWithAvg[i], studentsWithAvg[j]] = [studentsWithAvg[j], studentsWithAvg[i]];
                }
            }
            
            const groups = Array(num_groups).fill().map(() => []);
            for (let i = 0; i < studentsWithAvg.length; i++) {
                groups[i % num_groups].push(studentsWithAvg[i]);
            }
            
            const result = groups.map((group, idx) => ({
                group_number: idx + 1,
                average: Math.round(group.reduce((sum, s) => sum + s.average, 0) / (group.length || 1)),
                leader: group.length > 0 ? group[0].name : null,
                members: group.map(m => ({ name: m.name, average: m.average }))
            }));
            
            return jsonResponse({ success: true, data: result });
        } catch (error) {
            return jsonResponse({ success: false, message: 'Failed to create groups' }, 500);
        }
    }
    
    // ========================================================================
    //  ANALYTICS
    // ========================================================================
    
    if (path.match(/^\/api\/analytics\/class\/[^\/]+$/) && method === 'GET') {
        const classId = path.split('/').pop();
        const classStudents = students.filter(s => s.classId === classId);
        const scores = classStudents.map(s => s.term3 || 0);
        
        const distribution = {
            A: scores.filter(s => s >= 90).length,
            B: scores.filter(s => s >= 80 && s < 90).length,
            C: scores.filter(s => s >= 70 && s < 80).length,
            D: scores.filter(s => s >= 50 && s < 70).length,
            F: scores.filter(s => s < 50).length
        };
        
        const topPerformers = [...classStudents]
            .sort((a, b) => (b.term3 || 0) - (a.term3 || 0))
            .slice(0, 5)
            .map(s => ({ name: s.name, score: s.term3 || 0 }));
        
        return jsonResponse({
            success: true,
            data: { distribution, top_performers: topPerformers }
        });
    }
    
    // ========================================================================
    //  LESSON PLANNER (Demo - returns empty array)
    // ========================================================================
    
    if (path === '/api/lesson-planner/schedule' && method === 'GET') {
        return jsonResponse({ success: true, data: [] });
    }
    
    if (path === '/api/lesson-planner/upload' && method === 'POST') {
        return jsonResponse({ success: true, message: 'File uploaded' });
    }
    
    // ========================================================================
    //  TEACHER PROFILE
    // ========================================================================
    
    if (path === '/api/teacher/profile' && method === 'GET') {
        return jsonResponse({
            success: true,
            data: {
                fullname: 'Mr. Jean UWIMANA',
                email: 'teacher@school.rw',
                school: 'G.S. Saint Andre',
                subject: 'Physics'
            }
        });
    }
    
    // 404
    return jsonResponse({ success: false, message: 'Not found' }, 404);
}

// ============================================================================
//  DEFAULT EXPORT - REQUIRED FOR CLOUDFLARE WORKERS
// ============================================================================

export default {
    async fetch(request, env, ctx) {
        return handleRequest(request);
    }
};
