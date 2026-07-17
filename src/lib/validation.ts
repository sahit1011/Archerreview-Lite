/**
 * Shared input-validation + error-response helpers for API route handlers.
 *
 * Usage in a POST/PUT handler (AFTER requireAuth):
 *
 *   const parsed = await parseBody(request, mySchema);
 *   if (parsed.response) return parsed.response;   // 400 with field errors
 *   const body = parsed.data;                       // typed, validated
 *
 * For unexpected server failures, prefer `errorResponse('Failed to ...', 500)`
 * so raw error.message is never leaked to clients (keep console.error for logs).
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

/**
 * Build a standard JSON error response. Used both for validation 400s and for
 * generic 500s so we never echo raw error.message back to the client.
 */
export function errorResponse(message: string, status: number): NextResponse {
  return NextResponse.json({ success: false, message }, { status });
}

type ParseOk<T> = { data: T; response?: undefined };
type ParseFail = { data?: undefined; response: NextResponse };

/**
 * Read + validate a request body against a zod schema.
 *
 * Returns `{ data }` on success, or `{ response }` (a 400 NextResponse carrying
 * per-field error messages) on failure. Also returns a 400 if the body is not
 * valid JSON. The caller short-circuits on `parsed.response`.
 */
export async function parseBody<T extends z.ZodTypeAny>(
  request: NextRequest,
  schema: T
): Promise<ParseOk<z.infer<T>> | ParseFail> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return {
      response: NextResponse.json(
        { success: false, message: 'Invalid JSON body' },
        { status: 400 }
      ),
    };
  }

  const result = schema.safeParse(raw);
  if (!result.success) {
    // Flatten zod issues into a { field: [messages] } map for the client.
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of result.error.issues) {
      const key = issue.path.length ? issue.path.join('.') : '_';
      (fieldErrors[key] ||= []).push(issue.message);
    }
    return {
      response: NextResponse.json(
        {
          success: false,
          message: 'Validation failed',
          errors: fieldErrors,
        },
        { status: 400 }
      ),
    };
  }

  return { data: result.data };
}

/**
 * Coercible date string: accepts an ISO string / number and validates it parses
 * to a real Date. Returns the original input (route code constructs the Date).
 */
export const dateString = z
  .union([z.string(), z.number()])
  .refine((v) => !Number.isNaN(new Date(v).getTime()), {
    message: 'Invalid date',
  });

/** A non-empty trimmed string (e.g. a Mongo ObjectId or required text field). */
export const nonEmptyString = z.string().trim().min(1, 'Required');

// Re-export zod so routes can build ad-hoc schemas from a single import.
export { z };
