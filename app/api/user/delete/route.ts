import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function DELETE(request: Request) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();
    await db.read();

    // Delete user
    db.data.users = db.data.users.filter((u: any) => u.id !== userId);
    // Delete profile
    db.data.profiles = db.data.profiles.filter((p: any) => p.userId !== userId);
    // Delete projects
    db.data.projects = db.data.projects.filter((p: any) => p.authorId !== userId);

    await db.write();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
