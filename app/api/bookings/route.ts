import { NextRequest, NextResponse } from 'next/server';
import { bookingFormSchema } from '@/lib/schema';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = bookingFormSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Server validation failed for the booking request.',
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const values = parsed.data;
  await new Promise((resolve) => setTimeout(resolve, 900));

  const baseTicketTotal = values.ticketCount * 18;
  const snackTotal = values.snackBundle === 'none' ? 0 : values.snackBundle === 'classic-combo' ? 12 : values.snackBundle === 'date-night' ? 18 : 24;
  const vipSurcharge = values.selectedSeats.filter((seat) => seat.startsWith('A') || seat.startsWith('B')).length * 3;
  const total = baseTicketTotal + snackTotal + vipSurcharge + 2.5;

  return NextResponse.json({
    ok: true,
    bookingId: `BK-${values.showtimeId.toUpperCase()}-${values.selectedSeats.join('')}`,
    bookedAt: new Date().toISOString(),
    summary: `${values.customerName} booked ${values.selectedSeats.length} seats for ${values.showtimeId}.`,
    total,
    qrHint: 'Present the booking ID at the kiosk to print tickets.',
    reservedSeats: values.selectedSeats,
    timeline: [
      'Booking payload validated with the shared Zod schema.',
      'Seat inventory checked against the selected showtime.',
      'TanStack Query mutation resolved with a mock confirmation payload.',
      'Confirmation is ready for UI presentation and optimistic cache updates.',
    ],
  });
}
