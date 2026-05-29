// Netlify Serverless Function - Complete Backend API
// This replaces your Cloudflare Worker

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers, body: '' };
    }

    const path = event.path.replace('/.netlify/functions/api', '');
    const { email, password, fullname, school, subject } = JSON.parse(event.body || '{}');

    // Simple in-memory storage (Netlify will persist via FaunaDB or we use localStorage)
    // For REAL persistence, we'll use FaunaDB or Supabase
    
    // SIGNUP
    if (path === '/signup' && event.httpMethod === 'POST') {
        // Check if user exists
        const users = JSON.parse(process.env.USERS || '[]');
        if (users.find(u => u.email === email)) {
            return { statusCode: 200, headers, body: JSON.stringify({ success: false, message: 'Email already exists' }) };
        }
        
        const newUser = {
            id: Date.now().toString(),
            fullname,
            email,
            school,
            subject,
            password: btoa(password) // Simple encoding - in production use bcrypt
        };
        
        users.push(newUser);
        // In production, save to database
        process.env.USERS = JSON.stringify(users);
        
        return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: 'Account created successfully' }) };
    }
    
    // LOGIN
    if (path === '/login' && event.httpMethod === 'POST') {
        const users = JSON.parse(process.env.USERS || '[]');
        const user = users.find(u => u.email === email && atob(u.password) === password);
        
        if (user) {
            const token = btoa(JSON.stringify({ id: user.id, email: user.email, name: user.fullname }));
            return { statusCode: 200, headers, body: JSON.stringify({ success: true, token, name: user.fullname }) };
        }
        
        return { statusCode: 200, headers, body: JSON.stringify({ success: false, message: 'Invalid credentials' }) };
    }
    
    // GET CLASSES
    if (path === '/classes' && event.httpMethod === 'GET') {
        const classes = JSON.parse(process.env.CLASSES || '[]');
        return { statusCode: 200, headers, body: JSON.stringify({ success: true, data: classes }) };
    }
    
    // SAVE CLASS
    if (path === '/classes' && event.httpMethod === 'POST') {
        const { name, academicYear, term } = JSON.parse(event.body);
        const classes = JSON.parse(process.env.CLASSES || '[]');
        const newClass = { id: `cls_${Date.now()}`, name, academicYear, term, studentCount: 0, average: 0 };
        classes.push(newClass);
        process.env.CLASSES = JSON.stringify(classes);
        return { statusCode: 200, headers, body: JSON.stringify({ success: true, data: newClass }) };
    }
    
    return { statusCode: 404, headers, body: JSON.stringify({ success: false, message: 'Not found' }) };
};
