import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Note, Topic } from '@/models';
import { requireAuth } from '@/lib/api-auth';
import { errorResponse } from '@/lib/validation';

/**
 * GET /api/notes — the student's notes, newest first.
 * Filters: ?topicId=, ?subject=, ?q= (title/content/tag search), ?limit=
 */
export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (auth.response) return auth.response;
    const userId = auth.user.id;

    await dbConnect();

    const { searchParams } = request.nextUrl;
    const query: Record<string, unknown> = { user: userId };
    const topicId = searchParams.get('topicId');
    const subject = searchParams.get('subject');
    const q = searchParams.get('q');
    if (topicId) query.topic = topicId;
    if (subject) query.subject = subject;
    if (q) {
      const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [{ title: rx }, { content: rx }, { tags: rx }];
    }

    const limitParam = parseInt(searchParams.get('limit') || '', 10);
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 200) : 200;

    const notes = await Note.find(query)
      .sort({ updatedAt: -1 })
      .limit(limit)
      .populate('topic', 'name category');

    return NextResponse.json({ success: true, notes });
  } catch (error) {
    console.error('Error fetching notes:', error);
    return errorResponse('Failed to fetch notes', 500);
  }
}

/**
 * POST /api/notes — create a manual note.
 * Body: { title, content, topicId?, subject?, tags? }
 */
export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (auth.response) return auth.response;
    const userId = auth.user.id;

    await dbConnect();

    const body = await request.json();
    if (!body.title?.trim() || !body.content?.trim()) {
      return errorResponse('Title and content are required', 400);
    }

    // Derive subject from the linked topic when not given explicitly
    let subject = body.subject;
    if (!subject && body.topicId) {
      const topic = await Topic.findById(body.topicId).select('category').lean();
      subject = (topic as { category?: string } | null)?.category;
    }

    const note = await Note.create({
      user: userId,
      topic: body.topicId || undefined,
      subject,
      title: body.title.trim(),
      content: body.content,
      source: 'MANUAL',
      tags: Array.isArray(body.tags) ? body.tags.slice(0, 10) : [],
    });

    return NextResponse.json({ success: true, note }, { status: 201 });
  } catch (error) {
    console.error('Error creating note:', error);
    return errorResponse('Failed to create note', 500);
  }
}
