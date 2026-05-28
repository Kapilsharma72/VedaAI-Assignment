import { NextRequest, NextResponse } from 'next/server';
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;
const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: SESSION_MAX_AGE,
};
export async function POST(request: NextRequest): Promise<NextResponse> {
    const body = (await request.json()) as {
        token?: string;
    };
    if (!body.token || typeof body.token !== 'string') {
        return NextResponse.json({ success: false, message: 'Missing token' }, { status: 400 });
    }
    const response = NextResponse.json({ success: true });
    response.cookies.set('token', body.token, cookieOptions);
    return response;
}
export async function DELETE(): Promise<NextResponse> {
    const response = NextResponse.json({ success: true });
    response.cookies.set('token', '', { ...cookieOptions, maxAge: 0 });
    return response;
}
