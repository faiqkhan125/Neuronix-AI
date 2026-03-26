import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { paymentMethods } = await request.json();
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();
    await db.read();

    const profileIndex = db.data.profiles.findIndex((p: any) => p.userId === userId);
    if (profileIndex === -1) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    db.data.profiles[profileIndex].paymentMethods = paymentMethods;
    await db.write();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating payment methods:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
