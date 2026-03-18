import { z } from 'zod';

export const movieIds = ['galactic-odyssey', 'midnight-run', 'aurora-files'] as const;
export const theaterIds = ['imax-laser', 'screen-two', 'premiere-luxe'] as const;
export const snackIds = ['none', 'classic-combo', 'date-night', 'family-pack'] as const;

export const bookingFormSchema = z
  .object({
    movieId: z.enum(movieIds, {
      error: 'Choose a movie for the demo booking.',
    }),
    theaterId: z.enum(theaterIds, {
      error: 'Choose a theater.',
    }),
    showtimeId: z.string().min(1, 'Pick a showtime.'),
    customerName: z.string().min(2, 'Name must be at least 2 characters.'),
    email: z.string().email('Enter a valid email address.'),
    ticketCount: z.coerce.number().int().min(1, 'Book at least 1 ticket.').max(6, 'No more than 6 tickets in one booking demo.'),
    snackBundle: z.enum(snackIds),
    agreeToTerms: z.literal(true, {
      error: 'You must accept the cinema booking terms.',
    }),
    selectedSeats: z.array(z.string()).min(1, 'Select at least one seat.'),
  })
  .refine((values) => values.ticketCount === values.selectedSeats.length, {
    path: ['ticketCount'],
    message: 'Ticket count must match the number of selected seats.',
  });

export type BookingFormValues = z.infer<typeof bookingFormSchema>;

export type BookingDemoData = {
  movies: Array<{
    id: (typeof movieIds)[number];
    title: string;
    runtime: string;
    genre: string;
    rating: string;
    synopsis: string;
    posterGradient: string;
    showtimes: Array<{
      id: string;
      startsAt: string;
      auditorium: (typeof theaterIds)[number];
      format: string;
      basePrice: number;
      seatMap: Array<{
        id: string;
        row: string;
        number: number;
        status: 'available' | 'reserved' | 'vip';
      }>;
    }>;
  }>;
  theaters: Array<{
    id: (typeof theaterIds)[number];
    name: string;
    perks: string[];
  }>;
  snackBundles: Array<{
    id: (typeof snackIds)[number];
    label: string;
    price: number;
  }>;
  bookingFee: number;
};

export type BookingResponse = {
  ok: boolean;
  bookingId: string;
  bookedAt: string;
  summary: string;
  total: number;
  qrHint: string;
  reservedSeats: string[];
  timeline: string[];
};
