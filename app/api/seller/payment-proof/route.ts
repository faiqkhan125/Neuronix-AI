import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { projectId, transactionId, screenshotUrl } = await request.json();
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();
    await db.read();

    const projectIndex = db.data.projects.findIndex((p: any) => p.id === projectId && p.authorId === userId);
    if (projectIndex === -1) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Update project status and add payment proof
    db.data.projects[projectIndex] = {
      ...db.data.projects[projectIndex],
      status: 'pending_approval',
      paymentProof: {
        transactionId,
        screenshotUrl,
        submittedAt: new Date().toISOString()
      }
    };

    await db.write();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error submitting payment proof:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
