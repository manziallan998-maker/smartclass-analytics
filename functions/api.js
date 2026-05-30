// Cloudflare Pages Function - handles API requests
export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const path = url.pathname.replace('/api', '');
    
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
    };
    
    // Simple mock API - for demo login
    if (path === '/login' && request.method === 'POST') {
        const body = await request.json();
        if (body.email === 'teacher@school.rw' && body.password === 'password123') {
            return new Response(JSON.stringify({
                success: true,
                token: 'demo-token',
                name: 'Teacher'
            }), { headers });
        }
        return new Response(JSON.stringify({
            success: false,
            message: 'Invalid credentials'
        }), { headers, status: 401 });
    }
    
    if (path === '/signup' && request.method === 'POST') {
        return new Response(JSON.stringify({
            success: true,
            message: 'Account created'
        }), { headers });
    }
    
    return new Response(JSON.stringify({ success: false, message: 'Not found' }), { headers, status: 404 });
}
