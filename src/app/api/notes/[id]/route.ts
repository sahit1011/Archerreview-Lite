import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Note } from '@/models';
import { requireAuth } from '@/lib/api-auth';
import { errorResponse } from '@/lib/validation';

/** PUT /api/notes/[id] — edit a note (owner only). Body: { title?, content?, tags? } */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireAuth(request);
    if (auth.response) return auth.response;
    const { id } = await params;

    await dbConnect();

    const note = await Note.findById(id);
    if (!note) return errorResponse('Note not found', 404);
    if (note.user.toString() !== auth.user.id) return errorResponse('Forbidden', 403);

    const body = await request.json();
    if (typeof body.title === 'string' && body.title.trim()) note.title = body.title.trim();
    if (typeof body.content === 'string' && body.content.trim()) note.content = body.content;
    if (Array.isArray(body.tags)) note.tags = body.tags.slice(0, 10);
    await note.save();

    return NextResponse.json({ success: true, note });
  } catch (error) {
    console.error('Error updating note:', error);
    return errorResponse('Failed to update note', 500);
  }
}

/** DELETE /api/notes/[id] — delete a note (owner only). */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireAuth(request);
    if (auth.response) return auth.response;
    const { id } = await params;

    await dbConnect();

    const note = await Note.findById(id);
    if (!note) return errorResponse('Note not found', 404);
    if (note.user.toString() !== auth.user.id) return errorResponse('Forbidden', 403);

    await note.deleteOne();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting note:', error);
    return errorResponse('Failed to delete note', 500);
  }
}
