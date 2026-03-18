import { NextResponse } from 'next/server';
import type { BookingDemoData } from '@/lib/schema';

const rows = ['A', 'B', 'C', 'D', 'E'];

function createSeatMap(reservedSeats: string[], vipRows: string[]) {
  return rows.flatMap((row) =>
    Array.from({ length: 8 }, (_, index) => {
      const seatId = `${row}${index + 1}`;
      if (reservedSeats.includes(seatId)) {
        return { id: seatId, row, number: index + 1, status: 'reserved' as const };
      }

      if (vipRows.includes(row)) {
        return { id: seatId, row, number: index + 1, status: 'vip' as const };
      }

      return { id: seatId, row, number: index + 1, status: 'available' as const };
    }),
  );
}

const demoData: BookingDemoData = {
  bookingFee: 2.5,
  theaters: [
    { id: 'imax-laser', name: 'IMAX Laser', perks: ['Wall-to-wall screen', '12-channel audio'] },
    { id: 'screen-two', name: 'Screen Two', perks: ['Recliner seats', 'Cozy late-night vibe'] },
    { id: 'premiere-luxe', name: 'Premiere Luxe', perks: ['Wait service', 'Extra leg room'] },
  ],
  snackBundles: [
    { id: 'none', label: 'No snacks', price: 0 },
    { id: 'classic-combo', label: 'Classic combo', price: 12 },
    { id: 'date-night', label: 'Date night bundle', price: 18 },
    { id: 'family-pack', label: 'Family snack pack', price: 24 },
  ],
  movies: [
    {
      id: 'galactic-odyssey',
      title: 'Galactic Odyssey',
      runtime: '2h 14m',
      genre: 'Sci‑Fi Adventure',
      rating: 'PG-13',
      synopsis: 'A fallen navigator leads one last hyperspace mission to rescue a stranded moon colony.',
      posterGradient: 'linear-gradient(135deg, #5f8fff 0%, #9d5fff 100%)',
      showtimes: [
        { id: 'odyssey-1900', startsAt: '7:00 PM', auditorium: 'imax-laser', format: 'IMAX 3D', basePrice: 19, seatMap: createSeatMap(['A1', 'A2', 'C5', 'D6'], ['A']) },
        { id: 'odyssey-2145', startsAt: '9:45 PM', auditorium: 'premiere-luxe', format: 'Dolby Atmos', basePrice: 22, seatMap: createSeatMap(['B4', 'C4', 'E8'], ['A', 'B']) },
      ],
    },
    {
      id: 'midnight-run',
      title: 'Midnight Runway',
      runtime: '1h 52m',
      genre: 'Action Thriller',
      rating: 'R',
      synopsis: 'An airport security analyst has ninety minutes to stop a coordinated blackout and escape.',
      posterGradient: 'linear-gradient(135deg, #ff8a5b 0%, #ff4d6d 100%)',
      showtimes: [
        { id: 'runway-1815', startsAt: '6:15 PM', auditorium: 'screen-two', format: '4K Projection', basePrice: 16, seatMap: createSeatMap(['A8', 'B2', 'B3', 'E1'], ['A']) },
        { id: 'runway-2030', startsAt: '8:30 PM', auditorium: 'screen-two', format: '4K Projection', basePrice: 16, seatMap: createSeatMap(['C6', 'D3', 'D4'], ['A']) },
      ],
    },
    {
      id: 'aurora-files',
      title: 'The Aurora Files',
      runtime: '2h 2m',
      genre: 'Mystery Drama',
      rating: 'PG',
      synopsis: 'A documentary crew uncovers hidden recordings that rewrite the story of a vanished town.',
      posterGradient: 'linear-gradient(135deg, #3dd6c6 0%, #1877f2 100%)',
      showtimes: [
        { id: 'aurora-1700', startsAt: '5:00 PM', auditorium: 'premiere-luxe', format: 'Luxe Seating', basePrice: 18, seatMap: createSeatMap(['A5', 'A6', 'D1'], ['A', 'B']) },
        { id: 'aurora-1940', startsAt: '7:40 PM', auditorium: 'imax-laser', format: 'Laser Projection', basePrice: 20, seatMap: createSeatMap(['B7', 'C2', 'C3', 'E4'], ['A']) },
      ],
    },
  ],
};

export async function GET() {
  await new Promise((resolve) => setTimeout(resolve, 450));
  return NextResponse.json(demoData);
}
