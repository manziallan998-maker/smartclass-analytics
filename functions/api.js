// ==================== CLOUDFLARE PAGES FUNCTION API ====================
// Professional Backend for SmartClass Analytics
// Handles Authentication, Classes, Students, Marks

// In-memory storage (for demo - use D1 for production)
let users = [];
let sessions = {};

// Helper: Generate JWT-like token
function generateToken(userId, email, name) {
    const payload = { userId, email, name, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 };
    return btoa(JSON.stringify(payload));
}

// Helper: Verify token
function verifyToken(token) {
    try {
        const payload = JSON.parse(atob(token));
        if (payload.exp < Date.now()) return null;
        return payload;
    } catch {
        return null;
    }
}

// Helper: Create response
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

// Main handler
export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const path = url.pathname;
    
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Max-Age': '86400'
            }
        });
    }
    
    // ==================== AUTHENTICATION ====================
    
    // SIGNUP
    if (path === '/api/signup' && request.method === 'POST') {
        try {
            const { fullname, email, school, subject, password } = await request.json();
            
            if (!fullname || !email || !school || !subject || !password) {
                return jsonResponse({ success: false, message: 'All fields are required' }, 400);
            }
            
            if (password.length < 6) {
                return jsonResponse({ success: false, message: 'Password must be at least 6 characters' }, 400);
            }
            
            // Check if user exists
            const existingUser = users.find(u => u.email === email);
            if (existingUser) {
                return jsonResponse({ success: false, message: 'Email already exists' }, 400);
            }
            
            // Create new user
            const newUser = {
                id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`,
                fullname,
                email,
                school,
                subject,
                password: btoa(password), // Simple encoding (use bcrypt in production)
                createdAt: new Date().toISOString()
            };
            
            users.push(newUser);
            
            return jsonResponse({ 
                success: true, 
                message: 'Account created successfully! Please login.'
            });
            
        } catch (error) {
            return jsonResponse({ success: false, message: 'Server error' }, 500);
        }
    }
    
    // LOGIN
    if (path === '/api/login' && request.method === 'POST') {
        try {
            const { email, password } = await request.json();
            
            if (!email || !password) {
                return jsonResponse({ success: false, message: 'Email and password required' }, 400);
            }
            
            const user = users.find(u => u.email === email && atob(u.password) === password);
            
            if (user) {
                const token = generateToken(user.id, user.email, user.fullname);
                return jsonResponse({ 
                    success: true, 
                    token, 
                    name: user.fullname,
                    email: user.email
                });
            }
            
            // Demo fallback account
            if (email === 'teacher@school.rw' && password === 'password123') {
                const token = generateToken('demo_001', email, 'Mr. Jean UWIMANA');
                return jsonResponse({ 
                    success: true, 
                    token, 
                    name: 'Mr. Jean UWIMANA',
                    email: email
                });
            }
            
            return jsonResponse({ success: false, message: 'Invalid credentials' }, 401);
            
        } catch (error) {
            return jsonResponse({ success: false, message: 'Server error' }, 500);
        }
    }
    
    // VERIFY TOKEN
    if (path === '/api/verify' && request.method === 'GET') {
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
    
    // ==================== CLASSES ====================
    
    // GET all classes
    if (path === '/api/classes' && request.method === 'GET') {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader) return jsonResponse({ success: false, message: 'Unauthorized' }, 401);
        
        // Return demo data (in production, fetch from D1)
        const demoClasses = [
            { id: 'cls1', name: 'Physics S4A', studentCount: 42, average: 68, trend: '+5%', status: 'Good' },
            { id: 'cls2', name: 'Physics S3B', studentCount: 38, average: 58, trend: '-2%', status: 'Needs Attention' },
            { id: 'cls3', name: 'Physics S3A', studentCount: 40, average: 72, trend: '+3%', status: 'Good' },
            { id: 'cls4', name: 'Physics S2A', studentCount: 35, average: 66, trend: '+4%', status: 'Good' },
            { id: 'cls5', name: 'Physics S2B', studentCount: 37, average: 84, trend: '+8%', status: 'Excellent' }
        ];
        
        return jsonResponse({ success: true, data: demoClasses });
    }
    
    // ==================== STUDENTS ====================
    
    // GET students by class
    if (path.startsWith('/api/classes/') && path.endsWith('/students') && request.method === 'GET') {
        const classId = path.split('/')[3];
        const authHeader = request.headers.get('Authorization');
        if (!authHeader) return jsonResponse({ success: false, message: 'Unauthorized' }, 401);
        
        // Demo students data
        const demoStudents = {
            'cls1': [
                { id: 'stu1', name: 'UWAMAHORO Eric', term1: 82, term2: 88, term3: 94 },
                { id: 'stu2', name: 'IRADUKUNDA Diane', term1: 85, term2: 89, term3: 91 },
                { id: 'stu3', name: 'NSENGIYUMVA Jean', term1: 80, term2: 85, term3: 88 },
                { id: 'stu4', name: 'MUKAMANA Grace', term1: 45, term2: 58, term3: 71 },
                { id: 'stu5', name: 'NDAYISABA Pierre', term1: 38, term2: 42, term3: 41 }
            ],
            'cls2': [
                { id: 'stu6', name: 'NSABIMANA Eric', term1: 55, term2: 60, term3: 65 },
                { id: 'stu7', name: 'MUKESHIMANA Marie', term1: 48, term2: 52, term3: 58 }
            ]
        };
        
        const students = demoStudents[classId] || [];
        return jsonResponse({ success: true, data: students });
    }
    
    // ==================== SMART GROUPS ====================
    
    // CREATE groups
    if (path === '/api/groups/create' && request.method === 'POST') {
        const { class_id, num_groups, strategy } = await request.json();
        
        // Demo groups generation
        const groups = [];
        for (let i = 0; i < num_groups; i++) {
            groups.push({
                group_number: i + 1,
                leader: i === 0 ? 'UWAMAHORO Eric' : i === 1 ? 'IRADUKUNDA Diane' : `Student ${i + 1}`,
                average: Math.floor(Math.random() * 30) + 60,
                members: [
                    { name: `Student ${i * 4 + 1}`, average: Math.floor(Math.random() * 30) + 70 },
                    { name: `Student ${i * 4 + 2}`, average: Math.floor(Math.random() * 30) + 60 },
                    { name: `Student ${i * 4 + 3}`, average: Math.floor(Math.random() * 30) + 50 },
                    { name: `Student ${i * 4 + 4}`, average: Math.floor(Math.random() * 30) + 40 }
                ]
            });
        }
        
        return jsonResponse({ success: true, data: groups });
    }
    
    // ==================== ANALYTICS ====================
    
    // GET class analytics
    if (path.startsWith('/api/analytics/class/') && request.method === 'GET') {
        const classId = path.split('/').pop();
        
        const analytics = {
            distribution: { A: 5, B: 12, C: 15, D: 8, F: 2 },
            top_performers: [
                { name: 'UWAMAHORO Eric', score: 94 },
                { name: 'IRADUKUNDA Diane', score: 91 },
                { name: 'NSENGIYUMVA Jean', score: 88 }
            ]
        };
        
        return jsonResponse({ success: true, data: analytics });
    }
    
    // ==================== LESSON PLANNER ====================
    
    // GET lesson schedule
    if (path === '/api/lesson-planner/schedule' && request.method === 'GET') {
        const schedule = [
            { id: '1', class_name: 'Physics S4A', day_of_week: 'Monday', start_time: '08:00', duration: 60 },
            { id: '2', class_name: 'Physics S3B', day_of_week: 'Monday', start_time: '10:00', duration: 60 },
            { id: '3', class_name: 'Physics S4A', day_of_week: 'Tuesday', start_time: '08:00', duration: 60 },
            { id: '4', class_name: 'Physics S2A', day_of_week: 'Wednesday', start_time: '14:00', duration: 60 },
            { id: '5', class_name: 'Physics S3A', day_of_week: 'Thursday', start_time: '09:00', duration: 60 },
            { id: '6', class_name: 'Physics S4A', day_of_week: 'Friday', start_time: '08:00', duration: 60 }
        ];
        
        return jsonResponse({ success: true, data: schedule });
    }
    
    // UPLOAD lesson plan
    if (path === '/api/lesson-planner/upload' && request.method === 'POST') {
        return jsonResponse({ success: true, message: 'Lesson plan uploaded successfully', data: [] });
    }
    
    // ==================== TEACHER PROFILE ====================
    
    // GET teacher profile
    if (path === '/api/teacher/profile' && request.method === 'GET') {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader) return jsonResponse({ success: false, message: 'Unauthorized' }, 401);
        
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
    
    // ==================== HEALTH CHECK ====================
    
    if (path === '/api/health' && request.method === 'GET') {
        return jsonResponse({ 
            status: 'healthy', 
            timestamp: new Date().toISOString(),
            version: '2.0.0'
        });
    }
    
    // 404 - Not Found
    return jsonResponse({ success: false, message: 'API endpoint not found' }, 404);
}
