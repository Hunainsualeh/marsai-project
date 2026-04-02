import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Session } from '@/models/Session';
import { Message } from '@/models/Message';

// GET /api/sessions/[id] — Get session with all messages
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectToDatabase();

    const session = await Session.findById(id).lean();
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
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectToDatabase();

    const session = await Session.findByIdAndDelete(id);
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    await Message.deleteMany({ sessionId: id });

    return NextResponse.json({ success: true });
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
    const { id } = await params;
    const body = await req.json();
    await connectToDatabase();

    const updates: Record<string, string> = {};
    if (body.title) updates.title = body.title;
    if (body.model) updates.model = body.model;

    const session = await Session.findByIdAndUpdate(id, updates, { new: true }).lean();
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
