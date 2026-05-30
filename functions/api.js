// Cloudflare Pages Function - handles API requests
export async function onRequest(context) {
    const { request } = context;
    const url = new URL(request.url);
    const path = url.pathname;
    
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
    };
    
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
        return new Response(null, { headers });
    }
    
    // LOGIN endpoint
    if (path === '/api/login' && request.method === 'POST') {
        const body = await request.json();
        const { email, password } = body;
        
        // Check credentials (simple demo - in production use real database)
        if (email === 'teacher@school.rw' && password === 'password123') {
            const token = btoa(JSON.stringify({ email, name: 'Teacher' }));
            return new Response(JSON.stringify({
                success: true,
                token: token,
                name: 'Teacher'
            }), { headers });
        }
        
        return new Response(JSON.stringify({
            success: false,
            message: 'Invalid credentials'
        }), { headers, status: 401 });
    }
    
    // SIGNUP endpoint
    if (path === '/api/signup' && request.method === 'POST') {
        const body = await request.json();
        // In production, save to database here
        return new Response(JSON.stringify({
            success: true,
            message: 'Account created successfully'
        }), { headers });
    }
    
    // Default response for unknown endpoints
    return new Response(JSON.stringify({
        success: false,
        message: 'Not found'
    }), { headers, status: 404 });
}
