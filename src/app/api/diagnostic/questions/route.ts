import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Content, Topic } from '@/models';
import { requireAuth } from '@/lib/api-auth';
import { errorResponse } from '@/lib/validation';

/**
 * GET /api/diagnostic/questions
 *
 * Returns a content-backed, adaptive set of diagnostic questions drawn from the Content
 * collection (type QUIZ or PRACTICE) so the onboarding diagnostic actually exercises the
 * content DB across a spread of NEET/JEE subjects instead of a tiny hardcoded quiz.
 *
 * Selection strategy:
 *  - Pull QUIZ/PRACTICE Content that has a non-empty questions[] array, with its Topic populated.
 *  - Spread across distinct Topics (round-robin) so multiple NEET/JEE subject areas are covered.
 *  - Flatten to individual questions, capped at MAX_QUESTIONS.
 *
 * correctAnswer is intentionally INCLUDED in the payload: the existing onboarding flow scores
 * answers client-side, so the question source must carry the answer key to preserve that flow.
 *
 * If the DB yields too few questions, the client falls back to its hardcoded sampleQuestions,
 * so onboarding never breaks. We still return whatever we found (with `sufficient: false`) so the
 * caller can decide.
 */

const MAX_QUESTIONS = 18;
const MIN_QUESTIONS = 6; // below this, the client should fall back to its hardcoded set

interface FlatQuestion {
  id: number;
  contentId: string;
  topicId: string;
  topicName: string;
  category: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export async function GET(request: NextRequest) {
  try {
    // Require an authenticated user (diagnostic content is shared, not per-user scoped)
    const auth = requireAuth(request);
    if (auth.response) return auth.response;

    // Connect to the database
    await dbConnect();

    // Pull quiz/practice content that actually carries questions, with topics populated.
    // We over-fetch (limit on documents, not questions) so we can spread across topics.
    const contentDocs = await Content.find({
      type: { $in: ['QUIZ', 'PRACTICE'] },
      questions: { $exists: true, $not: { $size: 0 } },
    })
      .populate('topic')
      .limit(200)
      .lean();

    // Group available questions by topic so we can round-robin across NEET/JEE subject areas.
    type TopicBucket = { topicId: string; topicName: string; category: string; questions: FlatQuestion[] };
    const buckets = new Map<string, TopicBucket>();
    let nextId = 1;

    for (const doc of contentDocs as any[]) {
      const topic = doc.topic;
      // Skip content whose topic failed to populate (orphaned ref) — we need topic signal.
      if (!topic || !topic._id) continue;

      const topicId = String(topic._id);
      const topicName = topic.name || 'General';
      const category = topic.category || 'PHYSICS';

      if (!buckets.has(topicId)) {
        buckets.set(topicId, { topicId, topicName, category, questions: [] });
      }
      const bucket = buckets.get(topicId)!;

      const questions = Array.isArray(doc.questions) ? doc.questions : [];
      for (const q of questions) {
        // Defensive: only accept well-formed questions.
        if (
          !q ||
          typeof q.question !== 'string' ||
          !Array.isArray(q.options) ||
          q.options.length < 2 ||
          typeof q.correctAnswer !== 'number'
        ) {
          continue;
        }
        bucket.questions.push({
          id: nextId++,
          contentId: String(doc._id),
          topicId,
          topicName,
          category,
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: typeof q.explanation === 'string' ? q.explanation : '',
        });
      }
    }

    // Round-robin across topic buckets so the diagnostic spreads over multiple NEET/JEE subject
    // areas rather than loading 18 questions from a single content document.
    const bucketList = Array.from(buckets.values()).filter((b) => b.questions.length > 0);
    const selected: FlatQuestion[] = [];
    let exhausted = false;
    let round = 0;
    while (selected.length < MAX_QUESTIONS && !exhausted) {
      exhausted = true;
      for (const bucket of bucketList) {
        if (round < bucket.questions.length) {
          selected.push(bucket.questions[round]);
          exhausted = false;
          if (selected.length >= MAX_QUESTIONS) break;
        }
      }
      round++;
    }

    // Re-number ids sequentially in final order so client-side keying stays stable/predictable.
    const questions: FlatQuestion[] = selected.map((q, i) => ({ ...q, id: i + 1 }));

    const sufficient = questions.length >= MIN_QUESTIONS;

    return NextResponse.json({
      success: true,
      sufficient,
      count: questions.length,
      topicsCovered: bucketList.length,
      questions,
    });
  } catch (error) {
    console.error('Error fetching diagnostic questions:', error);
    // Do not leak error.message to clients.
    return errorResponse('Failed to fetch diagnostic questions', 500);
  }
}
