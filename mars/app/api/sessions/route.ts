import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Session } from '@/models/Session';
import { getUserIdFromRequest } from '@/lib/firebaseAdmin';

// GET /api/sessions — List all chat sessions
export async function GET(req: Request) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const showTrash = url.searchParams.get('trash') === 'true';

    await connectToDatabase();
    const sessions = await Session.find({ 
      userId,
      isDeleted: showTrash ? true : { $ne: true } 
    })
      .sort({ updatedAt: -1 })
      .select('title model createdAt updatedAt isPinned isDeleted')
      .lean();

    return NextResponse.json(sessions);
  } catch (error: unknown) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}

// POST /api/sessions — Create a new chat session
export async function POST(req: Request) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const body = await req.json().catch(() => ({}));

    const session = await Session.create({
      userId,
      title: body.title || 'New Chat',
      model: body.model || 'llama-3.3-70b-versatile',
    });

    return NextResponse.json(
      { _id: session._id, title: session.title, model: session.model },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}
