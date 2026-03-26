import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function PUT(request: Request) {
  try {
    const { fullName, bio } = await request.json();
    const db = await getDb();
    await db.read();
    
    // In a real app, we'd get the user ID from the session
    // For now, we'll assume the user is authenticated and we'll use a mock ID or handle it via a header
    // But since we are using lowdb and mockAuth, we'll just update the profile in the DB
    // We'll need to know which user is calling this.
    // Let's assume the client sends the userId for now, or we use the one from the store if we were server-side.
    // Actually, since we are in a mock environment, let's just update the first profile for now or use a query param.
    
    // Better: let's use a header for the userId
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profileIndex = db.data.profiles.findIndex((p: any) => p.userId === userId);
    if (profileIndex === -1) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    db.data.profiles[profileIndex] = {
      ...db.data.profiles[profileIndex],
      fullName,
      bio,
      updatedAt: new Date().toISOString()
    };

    await db.write();
    return NextResponse.json(db.data.profiles[profileIndex]);
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
