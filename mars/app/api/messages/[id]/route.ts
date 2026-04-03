import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Message } from '@/models/Message';
import { Session, ISession } from '@/models/Session';
import { getUserIdFromRequest } from '@/lib/firebaseAdmin';

// PATCH /api/messages/[id] — Update message content
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

    if (!body.content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // Verify ownership via session
    const existingMessage = await Message.findById(id).populate<{ sessionId: ISession }>('sessionId').lean();
    if (!existingMessage || !existingMessage.sessionId || existingMessage.sessionId.userId !== userId) {
      return NextResponse.json({ error: 'Message not found or unauthorized' }, { status: 404 });
    }

    const message = await Message.findByIdAndUpdate(
      id,
      { content: body.content },
      { returnDocument: 'after' }
    ).lean();

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    return NextResponse.json(message);
  } catch (error: unknown) {
    console.error('Error updating message:', error);
    return NextResponse.json(
      { error: 'Failed to update message' },
      { status: 500 }
    );
  }
}
