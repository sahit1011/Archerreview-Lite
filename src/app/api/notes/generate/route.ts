import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Note, Topic } from '@/models';
import { requireAuth } from '@/lib/api-auth';
import { errorResponse } from '@/lib/validation';
import { distillConversationToNote } from '@/services/generativeAI';

/**
 * POST /api/notes/generate — "Save key points to My Notes".
 *
 * Distills a tutor conversation into revision bullets and stores it as a
 * TUTOR_SESSION note. Re-saving the same conversation UPDATES its note
 * (idempotent per conversationId) so repeated saves refine rather than duplicate.
 *
 * Body: {
 *   messages: { role: 'user'|'assistant', content: string }[],
 *   conversationId?: string,
 *   topicId?: string,
 *   title?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (auth.response) return auth.response;
    const userId = auth.user.id;

    await dbConnect();

    const body = await request.json();
    const messages = Array.isArray(body.messages)
      ? body.messages.filter(
          (m: any) =>
            m &&
            (m.role === 'user' || m.role === 'assistant') &&
            typeof m.content === 'string' &&
            m.content.trim()
        )
      : [];

    if (messages.length < 2) {
      return errorResponse('Not enough conversation to summarize yet — ask the tutor something first.', 400);
    }

    // Resolve topic context (name feeds the distiller; category becomes the subject)
    let topicName: string | undefined;
    let subject: string | undefined;
    if (body.topicId) {
      const topic = await Topic.findById(body.topicId).select('name category').lean();
      topicName = (topic as { name?: string } | null)?.name;
      subject = (topic as { category?: string } | null)?.category;
    }

    const { content, llmGenerated } = await distillConversationToNote(messages, topicName);

    const title =
      (typeof body.title === 'string' && body.title.trim().slice(0, 200)) ||
      (topicName ? `${topicName} — tutor session notes` : 'Tutor session notes');

    // Upsert per conversation: saving again refreshes the note instead of duplicating
    const filter = body.conversationId
      ? { user: userId, conversationId: body.conversationId }
      : { user: userId, _id: undefined }; // no conversationId → always create

    let note;
    if (body.conversationId) {
      note = await Note.findOneAndUpdate(
        filter,
        {
          user: userId,
          topic: body.topicId || undefined,
          subject,
          title,
          content,
          source: 'TUTOR_SESSION',
          conversationId: body.conversationId,
          $addToSet: { tags: llmGenerated ? 'ai-distilled' : 'auto-extracted' },
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
    } else {
      note = await Note.create({
        user: userId,
        topic: body.topicId || undefined,
        subject,
        title,
        content,
        source: 'TUTOR_SESSION',
        tags: [llmGenerated ? 'ai-distilled' : 'auto-extracted'],
      });
    }

    return NextResponse.json({ success: true, note, llmGenerated }, { status: 201 });
  } catch (error) {
    console.error('Error generating note:', error);
    return errorResponse('Failed to generate note', 500);
  }
}
