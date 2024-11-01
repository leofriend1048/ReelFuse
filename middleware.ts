import { NextResponse, NextRequest } from 'next/server';
import { updateSession } from '@/utils/supabase/middleware';

export async function middleware(request: NextRequest) {
  // Check if the origin header is missing and add it
  if (!request.headers.get('origin')) {
    const allowedOrigins = ['http://reelfuse.co', 'http://localhost:3000'];
    const origin = request.headers.get('origin');
    if (!origin || !allowedOrigins.includes(origin)) {
        request.headers.set('origin', allowedOrigins[0]);
    }
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};