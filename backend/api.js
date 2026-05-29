// ==================== CLOUDFLARE WORKER API ====================
// This is the complete backend API that works with Cloudflare D1

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const path = url.pathname;
        const method = request.method;

        // CORS headers
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Content-Type': 'application/json'
        };

        // Handle preflight
        if (method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        // Helper functions
        async function hashPassword(password) {
            const encoder = new TextEncoder();
            const data = encoder.encode(password);
            const hash = await crypto.subtle.digest('SHA-256', data);
            return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
        }

        async function generateToken(teacherId, name, email, secret) {
            const payload = { teacher_id: teacherId, name, email, exp: Date.now() + 30 * 24 * 60 * 60 * 1000 };
            const encoder = new TextEncoder();
            const data = encoder.encode(JSON.stringify(payload) + secret);
            const hash = await crypto.subtle.digest('SHA-256', data);
            const signature = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
            return btoa(JSON.stringify(payload)) + '.' + signature;
        }

        async function verifyToken(authHeader, secret) {
            if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
            const token = authHeader.split(' ')[1];
            const [payloadB64, signature] = token.split('.');
            try {
                const payload = JSON.parse(atob(payloadB64));
                const encoder = new TextEncoder();
                const data = encoder.encode(JSON.stringify(payload) + secret);
                const hash = await crypto.subtle.digest('SHA-256', data);
                const expectedSignature = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
                if (signature !== expectedSignature || payload.exp < Date.now()) {
                    return null;
                }
                return payload;
            } catch {
                return null;
            }
        }

        // Signup
        if (path === '/api/signup' && method === 'POST') {
            try {
                const { fullname, email, school, subject, password } = await request.json();
                
                if (!fullname || !email || !school || !subject || !password) {
                    return new Response(JSON.stringify({ success: false, message: 'All fields required' }), { headers: corsHeaders });
                }
                
                if (password.length < 6) {
                    return new Response(JSON.stringify({ success: false, message: 'Password must be at least 6 characters' }), { headers: corsHeaders });
                }
                
                const teacherId = `TCH_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
                const passwordHash = await hashPassword(password);
                
                await env.DB.prepare(
                    'INSERT INTO teachers (teacher_id, fullname, email, school, subject, password_hash) VALUES (?, ?, ?, ?, ?, ?)'
                ).bind(teacherId, fullname, email, school, subject, passwordHash).run();
                
                return new Response(JSON.stringify({ success: true, message: 'Account created successfully' }), { headers: corsHeaders });
            } catch (error) {
                return new Response(JSON.stringify({ success: false, message: 'Email already exists' }), { headers: corsHeaders });
            }
        }
        
        // Login
        if (path === '/api/login' && method === 'POST') {
            try {
                const { email, password } = await request.json();
                const passwordHash = await hashPassword(password);
                
                const teacher = await env.DB.prepare(
                    'SELECT teacher_id, fullname, email FROM teachers WHERE email = ? AND password_hash = ?'
                ).bind(email, passwordHash).first();
                
                if (teacher) {
                    const token = await generateToken(teacher.teacher_id, teacher.fullname, teacher.email, env.JWT_SECRET);
                    return new Response(JSON.stringify({ 
                        success: true, 
                        token, 
                        name: teacher.fullname,
                        teacher_id: teacher.teacher_id
                    }), { headers: corsHeaders });
                } else {
                    return new Response(JSON.stringify({ success: false, message: 'Invalid credentials' }), { headers: corsHeaders });
                }
            } catch (error) {
                return new Response(JSON.stringify({ success: false, message: 'Login failed' }), { headers: corsHeaders });
            }
        }
        
        // Verify token for protected routes
        const authHeader = request.headers.get('Authorization');
        const payload = await verifyToken(authHeader, env.JWT_SECRET);
        
        if (!payload && !path.startsWith('/api/login') && !path.startsWith('/api/signup')) {
            return new Response(JSON.stringify({ success: false, message: 'Unauthorized' }), { status: 401, headers: corsHeaders });
        }
        
        // Default response for other routes (will be handled by frontend storage)
        return new Response(JSON.stringify({ success: true, message: 'API ready' }), { headers: corsHeaders });
    }
};
