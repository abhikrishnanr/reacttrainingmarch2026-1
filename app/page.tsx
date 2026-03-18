'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import type { BookingDemoData, BookingFormValues, BookingResponse } from '@/lib/schema';
import { bookingFormSchema } from '@/lib/schema';

type EventLog = {
  at: string;
  label: string;
  detail: string;
  tone: 'info' | 'success' | 'warning';
};

const defaultValues: z.input<typeof bookingFormSchema> = {
  movieId: 'galactic-odyssey',
  theaterId: 'imax-laser',
  showtimeId: 'odyssey-1900',
  customerName: 'Jamie Rivera',
  email: 'jamie@example.com',
  ticketCount: 2,
  snackBundle: 'classic-combo',
  agreeToTerms: true,
  selectedSeats: ['B5', 'B6'],
};

async function fetchBookingDemo(): Promise<BookingDemoData> {
  const response = await fetch('/api/booking-demo');
  if (!response.ok) throw new Error('Failed to load cinema demo data.');
  return response.json();
}

async function submitBooking(payload: BookingFormValues): Promise<BookingResponse> {
  const response = await fetch('/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message ?? 'Booking failed.');
  }

  return response.json();
}

export default function HomePage() {
  const [events, setEvents] = useState<EventLog[]>([
    { at: new Date().toLocaleTimeString(), label: 'Boot', detail: 'Query client mounted and film booking defaults loaded.', tone: 'info' },
  ]);

  const form = useForm<z.input<typeof bookingFormSchema>>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues,
    mode: 'onChange',
  });

  const bookingQuery = useQuery({
    queryKey: ['booking-demo'],
    queryFn: fetchBookingDemo,
  });

  const watchedMovieId = form.watch('movieId');
  const watchedShowtimeId = form.watch('showtimeId');
  const watchedTheaterId = form.watch('theaterId');
  const watchedSelectedSeats = form.watch('selectedSeats');
  const watchedTicketCount = form.watch('ticketCount');
  const watchedSnackBundle = form.watch('snackBundle');

  const selectedMovie = bookingQuery.data?.movies.find((movie) => movie.id === watchedMovieId) ?? bookingQuery.data?.movies[0];
  const showtimesForMovie = selectedMovie?.showtimes ?? [];
  const selectedShowtime = showtimesForMovie.find((showtime) => showtime.id === watchedShowtimeId) ?? showtimesForMovie[0];
  const selectedTheater = bookingQuery.data?.theaters.find((theater) => theater.id === watchedTheaterId);
  const selectedSnack = bookingQuery.data?.snackBundles.find((bundle) => bundle.id === watchedSnackBundle);

  useEffect(() => {
    if (!selectedMovie) return;

    if (!selectedMovie.showtimes.some((showtime) => showtime.id === watchedShowtimeId)) {
      const nextShowtime = selectedMovie.showtimes[0];
      form.setValue('showtimeId', nextShowtime.id, { shouldValidate: true });
      form.setValue('theaterId', nextShowtime.auditorium, { shouldValidate: true });
      form.setValue('selectedSeats', [], { shouldValidate: true });
    }
  }, [form, selectedMovie, watchedShowtimeId]);

  useEffect(() => {
    if (!selectedShowtime) return;
    form.setValue('theaterId', selectedShowtime.auditorium, { shouldValidate: true });
  }, [form, selectedShowtime]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/incompatible-library
    const subscription = form.watch((_value, { name, type }) => {
      if (!name || !type) return;
      setEvents((current) => [
        { at: new Date().toLocaleTimeString(), label: 'Form updated', detail: `${name} changed via ${type}.`, tone: 'info' },
        ...current.slice(0, 10),
      ]);
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const mutation = useMutation({
    mutationFn: submitBooking,
    onMutate: (payload) => {
      setEvents((current) => [
        { at: new Date().toLocaleTimeString(), label: 'Booking started', detail: `Submitting ${payload.selectedSeats.length} seats for ${payload.showtimeId}.`, tone: 'warning' },
        ...current,
      ]);
    },
    onSuccess: (data) => {
      setEvents((current) => [
        { at: new Date().toLocaleTimeString(), label: 'Booking confirmed', detail: `${data.bookingId} confirmed for ${data.reservedSeats.join(', ')}.`, tone: 'success' },
        ...current,
      ]);
    },
    onError: (error) => {
      setEvents((current) => [
        { at: new Date().toLocaleTimeString(), label: 'Booking failed', detail: error.message, tone: 'warning' },
        ...current,
      ]);
    },
  });

  const pricing = useMemo(() => {
    const ticketCount = Number(watchedTicketCount ?? 0);
    const base = (selectedShowtime?.basePrice ?? 0) * ticketCount;
    const vip = watchedSelectedSeats.filter((seat) => seat.startsWith('A') || seat.startsWith('B')).length * 3;
    const snacks = selectedSnack?.price ?? 0;
    const fee = bookingQuery.data?.bookingFee ?? 0;
    return { base, vip, snacks, fee, total: base + vip + snacks + fee };
  }, [bookingQuery.data?.bookingFee, selectedShowtime?.basePrice, selectedSnack?.price, watchedSelectedSeats, watchedTicketCount]);

  const toggleSeat = (seatId: string) => {
    const current = form.getValues('selectedSeats');
    const next = current.includes(seatId) ? current.filter((seat) => seat !== seatId) : [...current, seatId];
    form.setValue('selectedSeats', next, { shouldValidate: true, shouldDirty: true });
    form.setValue('ticketCount', next.length || 1, { shouldValidate: true, shouldDirty: true });
  };

  return (
    <main className="page-shell">
      <section className="hero-card">
        <p className="eyebrow">NEXT.JS 16 · TANSTACK QUERY · REACT HOOK FORM · ZOD</p>
        <h1>Film seat booking demo with live query state and validated checkout.</h1>
        <p className="hero-copy">
          This cinema-style example demonstrates TanStack Query for fetching movie/showtime data and submitting a booking mutation, while Zod and React Hook Form keep the checkout form valid.
        </p>
      </section>

      <section className="dashboard-grid">
        <div className="stack-lg">
          <section className="panel stack-md">
            <div className="section-heading">
              <div>
                <h2>Now showing</h2>
                <p>Query-powered movie cards and showtime inventory.</p>
              </div>
              <StatusPill label={bookingQuery.isLoading ? 'Loading films' : bookingQuery.isError ? 'Load error' : 'Cinema data ready'} tone={bookingQuery.isError ? 'warning' : bookingQuery.isLoading ? 'info' : 'success'} />
            </div>

            {bookingQuery.isLoading && <LoadingPanel message="Fetching movie lineup and seat inventory…" />}
            {bookingQuery.isError && <ErrorPanel message={bookingQuery.error.message} />}

            {bookingQuery.data && (
              <div className="movie-grid">
                {bookingQuery.data.movies.map((movie) => (
                  <button
                    key={movie.id}
                    type="button"
                    className={`movie-card ${watchedMovieId === movie.id ? 'movie-card-active' : ''}`}
                    onClick={() => {
                      form.setValue('movieId', movie.id, { shouldValidate: true });
                      form.setValue('showtimeId', movie.showtimes[0].id, { shouldValidate: true });
                      form.setValue('theaterId', movie.showtimes[0].auditorium, { shouldValidate: true });
                      form.setValue('selectedSeats', [], { shouldValidate: true });
                    }}
                    style={{ backgroundImage: movie.posterGradient }}
                  >
                    <span className="movie-meta">{movie.genre} · {movie.rating}</span>
                    <strong>{movie.title}</strong>
                    <span>{movie.runtime}</span>
                    <small>{movie.synopsis}</small>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="panel stack-md">
            <div className="section-heading">
              <div>
                <h2>Seat map</h2>
                <p>Select seats to demonstrate controlled form values and pricing recalculation.</p>
              </div>
              <StatusPill label={selectedShowtime ? `${selectedShowtime.format} · ${selectedShowtime.startsAt}` : 'Choose a showtime'} tone="info" />
            </div>

            <div className="screen-pill">Screen this way</div>
            <div className="seat-legend">
              <LegendItem label="Available" tone="available" />
              <LegendItem label="VIP" tone="vip" />
              <LegendItem label="Reserved" tone="reserved" />
              <LegendItem label="Selected" tone="selected" />
            </div>

            <div className="seat-grid">
              {selectedShowtime?.seatMap.map((seat) => {
                const isSelected = watchedSelectedSeats.includes(seat.id);
                const disabled = seat.status === 'reserved';
                return (
                  <button
                    key={seat.id}
                    type="button"
                    disabled={disabled}
                    className={`seat seat-${seat.status} ${isSelected ? 'seat-selected' : ''}`}
                    onClick={() => toggleSeat(seat.id)}
                  >
                    {seat.id}
                  </button>
                );
              })}
            </div>
            <InlineError message={form.formState.errors.selectedSeats?.message} />
          </section>
        </div>

        <div className="stack-lg">
          <form className="panel stack-md" onSubmit={form.handleSubmit((values) => {
            const parsed = bookingFormSchema.parse(values);
            mutation.mutate(parsed);
          })}>
            <div className="section-heading">
              <div>
                <h2>Booking form</h2>
                <p>Zod validates contact info, showtime choices, and seat count before the mutation runs.</p>
              </div>
              <StatusPill label={mutation.isPending ? 'Submitting booking' : mutation.isSuccess ? 'Booked' : 'Ready to submit'} tone={mutation.isPending ? 'warning' : mutation.isSuccess ? 'success' : 'info'} />
            </div>

            <Field label="Movie" error={form.formState.errors.movieId?.message}>
              <select {...form.register('movieId')}>
                {bookingQuery.data?.movies.map((movie) => <option key={movie.id} value={movie.id}>{movie.title}</option>)}
              </select>
            </Field>

            <div className="form-split">
              <Field label="Showtime" error={form.formState.errors.showtimeId?.message}>
                <select {...form.register('showtimeId')}>
                  {showtimesForMovie.map((showtime) => <option key={showtime.id} value={showtime.id}>{showtime.startsAt} · {showtime.format}</option>)}
                </select>
              </Field>
              <Field label="Theater" error={form.formState.errors.theaterId?.message}>
                <select {...form.register('theaterId')}>
                  {bookingQuery.data?.theaters.map((theater) => <option key={theater.id} value={theater.id}>{theater.name}</option>)}
                </select>
              </Field>
            </div>

            <div className="form-split">
              <Field label="Name" error={form.formState.errors.customerName?.message}>
                <input {...form.register('customerName')} placeholder="Your full name" />
              </Field>
              <Field label="Email" error={form.formState.errors.email?.message}>
                <input {...form.register('email')} placeholder="name@example.com" />
              </Field>
            </div>

            <div className="form-split">
              <Field label="Tickets" error={form.formState.errors.ticketCount?.message}>
                <input type="number" min={1} max={6} {...form.register('ticketCount', { valueAsNumber: true })} />
              </Field>
              <Field label="Snack bundle" error={form.formState.errors.snackBundle?.message}>
                <select {...form.register('snackBundle')}>
                  {bookingQuery.data?.snackBundles.map((bundle) => <option key={bundle.id} value={bundle.id}>{bundle.label}</option>)}
                </select>
              </Field>
            </div>

            <label className="checkbox-row">
              <input type="checkbox" {...form.register('agreeToTerms')} />
              I agree to the cinema terms, seat release policy, and demo checkout rules.
            </label>
            <InlineError message={form.formState.errors.agreeToTerms?.message} />

            <button type="submit" disabled={mutation.isPending || bookingQuery.isLoading} className="primary-button">
              {mutation.isPending ? 'Processing booking…' : 'Confirm booking'}
            </button>
          </form>

          <section className="panel stack-md">
            <div className="section-heading">
              <div>
                <h2>Live booking summary</h2>
                <p>Form state, selected showtime info, and calculated totals update instantly.</p>
              </div>
            </div>

            <div className="summary-grid">
              <SummaryCard label="Movie" value={selectedMovie?.title ?? '—'} helper={selectedMovie?.runtime ?? 'Waiting for query'} />
              <SummaryCard label="Showtime" value={selectedShowtime?.startsAt ?? '—'} helper={selectedShowtime?.format ?? 'Select a session'} />
              <SummaryCard label="Seats" value={watchedSelectedSeats.join(', ') || 'None'} helper={`${watchedSelectedSeats.length} selected`} />
              <SummaryCard label="Auditorium" value={selectedTheater?.name ?? '—'} helper={selectedTheater?.perks.join(' · ') ?? 'No theater selected'} />
            </div>

            <div className="price-list">
              <PriceRow label="Tickets" value={`$${pricing.base.toFixed(2)}`} />
              <PriceRow label="VIP seat upgrade" value={`$${pricing.vip.toFixed(2)}`} />
              <PriceRow label="Snacks" value={`$${pricing.snacks.toFixed(2)}`} />
              <PriceRow label="Booking fee" value={`$${pricing.fee.toFixed(2)}`} />
              <PriceRow label="Estimated total" value={`$${pricing.total.toFixed(2)}`} strong />
            </div>
          </section>

          <section className="panel stack-md">
            <div className="section-heading">
              <div>
                <h2>Developer event stream</h2>
                <p>Useful for explaining query loading, form updates, and mutation lifecycle transitions.</p>
              </div>
            </div>
            <div className="event-list">
              {events.map((event, index) => (
                <article key={`${event.at}-${index}`} className={`event-card tone-${event.tone}`}>
                  <div className="event-topline">
                    <strong>{event.label}</strong>
                    <span>{event.at}</span>
                  </div>
                  <p>{event.detail}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="panel stack-md">
            <div className="section-heading">
              <div>
                <h2>Mutation response</h2>
                <p>The mock API confirms seats, returns a booking ID, and exposes a timeline for the demo narrative.</p>
              </div>
            </div>

            {mutation.isError && <ErrorPanel message={mutation.error.message} />}
            {mutation.isPending && <LoadingPanel message="Locking seats and generating confirmation…" />}
            {mutation.data && (
              <div className="stack-md">
                <div className="pill-row">
                  <StatusPill label={mutation.data.bookingId} tone="success" />
                  <StatusPill label={`Total ${mutation.data.total.toFixed(2)}`} tone="warning" />
                  <StatusPill label={new Date(mutation.data.bookedAt).toLocaleString()} tone="info" />
                </div>
                <article className="confirmation-card">
                  <h3>{mutation.data.summary}</h3>
                  <p>{mutation.data.qrHint}</p>
                  <strong>Reserved seats: {mutation.data.reservedSeats.join(', ')}</strong>
                </article>
                <div className="event-list">
                  {mutation.data.timeline.map((step) => (
                    <article key={step} className="event-card tone-info"><p>{step}</p></article>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      <InlineError message={error} />
    </label>
  );
}

function InlineError({ message }: { message?: string }) {
  if (!message) return null;
  return <small className="error-text">{message}</small>;
}

function SummaryCard({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <article className="summary-card">
      <small>{label}</small>
      <strong>{value}</strong>
      <span>{helper}</span>
    </article>
  );
}

function PriceRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return <div className={`price-row ${strong ? 'price-row-strong' : ''}`}><span>{label}</span><strong>{value}</strong></div>;
}

function StatusPill({ label, tone }: { label: string; tone: 'info' | 'success' | 'warning' }) {
  return <span className={`status-pill pill-${tone}`}>{label}</span>;
}

function LegendItem({ label, tone }: { label: string; tone: 'available' | 'vip' | 'reserved' | 'selected' }) {
  return <span className="legend-item"><i className={`legend-dot legend-${tone}`} />{label}</span>;
}

function LoadingPanel({ message }: { message: string }) {
  return <div className="feedback-panel">{message}</div>;
}

function ErrorPanel({ message }: { message: string }) {
  return <div className="feedback-panel feedback-error">{message}</div>;
}
