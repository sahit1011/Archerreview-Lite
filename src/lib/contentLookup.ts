import { Content } from '../models/index';

/**
 * Find a startable Content document for a topic + task type, so agent-created
 * tasks (REVIEW, remedial) are never dead checkboxes.
 *
 * REVIEW/PRACTICE quiz the student, so they map to QUIZ/PRACTICE content;
 * READING→READING, VIDEO→VIDEO. Returns the content _id or null.
 */
export async function findContentForTopic(
  topicId: unknown,
  taskType: string
): Promise<unknown | null> {
  const order =
    taskType === 'REVIEW'
      ? ['QUIZ', 'PRACTICE']
      : taskType === 'PRACTICE'
        ? ['PRACTICE', 'QUIZ']
        : taskType === 'REMEDIAL'
          ? ['READING', 'PRACTICE', 'QUIZ']
          : [taskType];

  for (const type of order) {
    const doc = await Content.findOne({ topic: topicId, type }).select('_id').lean();
    if (doc) return (doc as { _id: unknown })._id;
  }
  return null;
}
