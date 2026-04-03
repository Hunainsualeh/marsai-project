import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Session } from '@/models/Session';
import { Message } from '@/models/Message';
import { getUserIdFromRequest } from '@/lib/firebaseAdmin';

// GET /api/sessions/[id] — Get session with all messages
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    await connectToDatabase();

    const session = await Session.findOne({ _id: id, userId }).lean();
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const messages = await Message.find({ sessionId: id })
      .sort({ createdAt: 1 })
      .lean();

    return NextResponse.json({ ...session, messages });
  } catch (error: unknown) {
    console.error('Error fetching session:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    );
  }
}

// DELETE /api/sessions/[id] — Delete session and its messages
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const url = new URL(req.url);
    const permanent = url.searchParams.get('permanent') === 'true';

    await connectToDatabase();

    if (permanent) {
      const session = await Session.findOneAndDelete({ _id: id, userId });
      if (!session) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }
      await Message.deleteMany({ sessionId: id });
    } else {
      const session = await Session.findOneAndUpdate(
        { _id: id, userId },
        { isDeleted: true },
        { new: true }
      );
      if (!session) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }
    }

    return NextResponse.json({ success: true, permanent });
  } catch (error: unknown) {
    console.error('Error deleting session:', error);
    return NextResponse.json(
      { error: 'Failed to delete session' },
      { status: 500 }
    );
  }
}

// PATCH /api/sessions/[id] — Update session title or model
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    await connectToDatabase();

    const updates: Record<string, any> = {};
    if (body.title !== undefined) updates.title = body.title;
    if (body.model !== undefined) updates.model = body.model;
    if (body.isPinned !== undefined) updates.isPinned = body.isPinned;
    if (body.isDeleted !== undefined) updates.isDeleted = body.isDeleted;

    const session = await Session.findOneAndUpdate({ _id: id, userId }, updates, { returnDocument: 'after' }).lean();
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json(session);
  } catch (error: unknown) {
    console.error('Error updating session:', error);
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    );
  }
}
