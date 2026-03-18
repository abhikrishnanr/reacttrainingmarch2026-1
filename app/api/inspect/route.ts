import { NextRequest, NextResponse } from 'next/server';
import { parameterSchema } from '@/lib/schema';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = parameterSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Validation failed on the server.',
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const values = parsed.data;
  const start = Date.now();
  await new Promise((resolve) => setTimeout(resolve, 900));

  return NextResponse.json({
    ok: true,
    receivedAt: new Date().toISOString(),
    elapsedMs: Date.now() - start,
    summary: `${values.method} ${values.endpoint}`,
    parameters: Object.entries(values).map(([key, value], index) => ({
      id: `${key}-${index}`,
      key,
      value: String(value),
      valueType: Array.isArray(value) ? 'array' : typeof value,
      explanation: `The \"${key}\" parameter was captured and normalized for developer review.`,
    })),
    logs: [
      'Request accepted by /api/inspect.',
      'Payload validated with Zod on the server.',
      `Headers ${values.includeHeaders ? 'will' : 'will not'} be included in downstream inspection.`,
      `Timeout set to ${values.timeoutMs}ms with retry count ${values.retryCount}.`,
      'Synthetic wait added so the loading state is visible for demos.',
    ],
    nextSteps: [
      'Review each parameter card for normalized values.',
      'Use the developer event stream to trace client/query state changes.',
      'Swap the demo endpoint with a real internal API when needed.',
    ],
  });
}
