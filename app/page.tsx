'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import type { ParameterValues } from '@/lib/schema';
import { parameterSchema } from '@/lib/schema';

type InspectResponse = {
  ok: boolean;
  receivedAt: string;
  elapsedMs: number;
  summary: string;
  parameters: Array<{ id: string; key: string; value: string; valueType: string; explanation: string }>;
  logs: string[];
  nextSteps: string[];
};

type EventLog = {
  at: string;
  label: string;
  detail: string;
  tone: 'info' | 'success' | 'warning';
};

const defaultValues: z.input<typeof parameterSchema> = {
  endpoint: 'https://api.example.dev/inspect',
  method: 'POST',
  featureFlag: 'inspector-v1',
  requestId: 'req-2026',
  notes: 'Debug all parameters and show a developer-friendly execution timeline.',
  includeHeaders: true,
  retryCount: 2,
  timeoutMs: 2400,
};

async function inspectParameters(payload: ParameterValues): Promise<InspectResponse> {
  const response = await fetch('/api/inspect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message ?? 'Inspection failed.');
  }

  return response.json();
}

const styles = {
  page: { maxWidth: 1240, margin: '0 auto', display: 'grid', gap: 24 },
  hero: { display: 'grid', gap: 10 },
  panel: {
    background: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: 20,
    padding: 20,
    boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
  },
} as const;

export default function HomePage() {
  const [events, setEvents] = useState<EventLog[]>([
    {
      at: new Date().toLocaleTimeString(),
      label: 'Boot',
      detail: 'Form initialized with default values and QueryClient provider mounted.',
      tone: 'info',
    },
  ]);

  const form = useForm<z.input<typeof parameterSchema>, unknown, ParameterValues>({
    resolver: zodResolver(parameterSchema),
    defaultValues,
    mode: 'onChange',
  });

  const mutation = useMutation({
    mutationFn: inspectParameters,
    onMutate: (payload) => {
      setEvents((current) => [
        {
          at: new Date().toLocaleTimeString(),
          label: 'Mutation started',
          detail: `Submitting ${payload.method} request for ${payload.endpoint}.`,
          tone: 'warning',
        },
        ...current,
      ]);
    },
    onSuccess: (data) => {
      setEvents((current) => [
        {
          at: new Date().toLocaleTimeString(),
          label: 'Mutation success',
          detail: `Server returned ${data.parameters.length} parameter cards in ${data.elapsedMs}ms.`,
          tone: 'success',
        },
        ...current,
      ]);
    },
    onError: (error) => {
      setEvents((current) => [
        {
          at: new Date().toLocaleTimeString(),
          label: 'Mutation error',
          detail: error.message,
          tone: 'warning',
        },
        ...current,
      ]);
    },
  });

  const watchedValues = form.watch();
  const parameterEntries = useMemo(() => Object.entries(watchedValues), [watchedValues]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/incompatible-library
    const subscription = form.watch((_value, { name, type }) => {
      if (!name || !type) return;
      setEvents((current) => [
        {
          at: new Date().toLocaleTimeString(),
          label: 'Field updated',
          detail: `${name} changed via ${type}.`,
          tone: 'info',
        },
        ...current.slice(0, 11),
      ]);
    });

    return () => subscription.unsubscribe();
  }, [form]);

  return (
    <main style={styles.page}>
      <section style={styles.hero}>
        <p style={{ margin: 0, color: 'var(--accent)', fontWeight: 700, letterSpacing: 1.2 }}>NEXT.JS 16 + TANSTACK QUERY</p>
        <h1 style={{ margin: 0, fontSize: 'clamp(2rem, 5vw, 4rem)' }}>Parameter inspector with live developer logs</h1>
        <p style={{ margin: 0, maxWidth: 900, color: 'var(--muted)', fontSize: 18, lineHeight: 1.6 }}>
          Submit a validated payload, inspect each parameter in its own box, and watch a developer-friendly event stream for form changes, loading, success, and API-side processing.
        </p>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 440px) 1fr', gap: 24, alignItems: 'start' }}>
        <form onSubmit={form.handleSubmit((values) => mutation.mutate(values))} style={{ ...styles.panel, display: 'grid', gap: 16 }}>
          <div>
            <h2 style={{ marginTop: 0 }}>Inspection form</h2>
            <p style={{ color: 'var(--muted)', marginBottom: 0 }}>React Hook Form and Zod keep the payload valid before TanStack Query sends it.</p>
          </div>

          <Field label="Endpoint" error={form.formState.errors.endpoint?.message}>
            <input {...form.register('endpoint')} style={inputStyle} placeholder="https://api.example.dev/inspect" />
          </Field>

          <Field label="Method" error={form.formState.errors.method?.message}>
            <select {...form.register('method')} style={inputStyle}>
              {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((method) => (
                <option key={method} value={method}>{method}</option>
              ))}
            </select>
          </Field>

          <Field label="Feature flag" error={form.formState.errors.featureFlag?.message}>
            <input {...form.register('featureFlag')} style={inputStyle} placeholder="inspector-v1" />
          </Field>

          <Field label="Request ID" error={form.formState.errors.requestId?.message}>
            <input {...form.register('requestId')} style={inputStyle} placeholder="req-2026" />
          </Field>

          <Field label="Notes" error={form.formState.errors.notes?.message}>
            <textarea {...form.register('notes')} style={{ ...inputStyle, minHeight: 110, resize: 'vertical' }} />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Retry count" error={form.formState.errors.retryCount?.message}>
              <input type="number" {...form.register('retryCount')} style={inputStyle} min={0} max={5} />
            </Field>
            <Field label="Timeout (ms)" error={form.formState.errors.timeoutMs?.message}>
              <input type="number" {...form.register('timeoutMs')} style={inputStyle} min={100} max={30000} />
            </Field>
          </div>

          <label style={{ display: 'flex', gap: 10, alignItems: 'center', color: 'var(--muted)' }}>
            <input type="checkbox" {...form.register('includeHeaders')} /> Include simulated request headers in the inspection summary
          </label>

          <button type="submit" disabled={mutation.isPending} style={buttonStyle}>
            {mutation.isPending ? 'Loading inspection…' : 'Run inspection'}
          </button>
        </form>

        <div style={{ display: 'grid', gap: 24 }}>
          <section style={{ ...styles.panel, display: 'grid', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <h2 style={{ marginTop: 0 }}>Live parameters</h2>
                <p style={{ color: 'var(--muted)', marginBottom: 0 }}>Every current form value is rendered in its own box so a developer can verify the payload before submit.</p>
              </div>
              <StatusPill label={mutation.isPending ? 'Loading' : mutation.isSuccess ? 'Loaded' : 'Idle'} tone={mutation.isPending ? 'warning' : mutation.isSuccess ? 'success' : 'info'} />
            </div>
            <div style={gridStyle}>
              {parameterEntries.map(([key, value]) => (
                <article key={key} style={cardStyle}>
                  <small style={eyebrowStyle}>{key}</small>
                  <strong style={{ fontSize: 18 }}>{String(value)}</strong>
                  <span style={{ color: 'var(--muted)' }}>Current form type: {typeof value}</span>
                </article>
              ))}
            </div>
          </section>

          <section style={{ ...styles.panel, display: 'grid', gap: 16 }}>
            <div>
              <h2 style={{ marginTop: 0 }}>Developer event stream</h2>
              <p style={{ color: 'var(--muted)', marginBottom: 0 }}>Track user input, mutation lifecycle, and server normalization steps in one place.</p>
            </div>
            <div style={{ display: 'grid', gap: 12 }}>
              {events.map((event, index) => (
                <article key={`${event.at}-${index}`} style={{ ...logStyle, borderColor: toneColor(event.tone) }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <strong>{event.label}</strong>
                    <span style={{ color: 'var(--muted)' }}>{event.at}</span>
                  </div>
                  <div style={{ color: 'var(--muted)' }}>{event.detail}</div>
                </article>
              ))}
            </div>
          </section>

          <section style={{ ...styles.panel, display: 'grid', gap: 16 }}>
            <div>
              <h2 style={{ marginTop: 0 }}>Server response boxes</h2>
              <p style={{ color: 'var(--muted)', marginBottom: 0 }}>After submit, normalized values and backend logs appear here for easy debugging.</p>
            </div>

            {mutation.isPending && <LoadingPanel />}
            {mutation.isError && <ErrorPanel message={mutation.error.message} />}

            {mutation.data && (
              <>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                  <StatusPill label={mutation.data.summary} tone="success" />
                  <StatusPill label={`Received ${new Date(mutation.data.receivedAt).toLocaleString()}`} tone="info" />
                  <StatusPill label={`${mutation.data.elapsedMs}ms`} tone="warning" />
                </div>

                <div style={gridStyle}>
                  {mutation.data.parameters.map((parameter) => (
                    <article key={parameter.id} style={cardStyle}>
                      <small style={eyebrowStyle}>{parameter.key}</small>
                      <strong style={{ fontSize: 18 }}>{parameter.value}</strong>
                      <span style={{ color: 'var(--muted)' }}>Normalized type: {parameter.valueType}</span>
                      <p style={{ marginBottom: 0, color: 'var(--muted)' }}>{parameter.explanation}</p>
                    </article>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <SubPanel title="Backend logs" items={mutation.data.logs} />
                  <SubPanel title="Suggested next steps" items={mutation.data.nextSteps} />
                </div>
              </>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'grid', gap: 8 }}>
      <span style={{ fontWeight: 700 }}>{label}</span>
      {children}
      {error ? <span style={{ color: 'var(--danger)' }}>{error}</span> : null}
    </label>
  );
}

function SubPanel({ title, items }: { title: string; items: string[] }) {
  return (
    <div style={{ ...cardStyle, gap: 10 }}>
      <strong>{title}</strong>
      <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--muted)', display: 'grid', gap: 8 }}>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function LoadingPanel() {
  return (
    <div style={{ ...cardStyle, borderColor: 'rgba(255, 211, 107, 0.5)' }}>
      <strong>Loading inspection…</strong>
      <p style={{ margin: 0, color: 'var(--muted)' }}>TanStack Query mutation is pending while the demo API simulates server work for developer visibility.</p>
    </div>
  );
}

function ErrorPanel({ message }: { message: string }) {
  return (
    <div style={{ ...cardStyle, borderColor: 'rgba(255, 156, 156, 0.5)' }}>
      <strong>Inspection failed</strong>
      <p style={{ margin: 0, color: 'var(--muted)' }}>{message}</p>
    </div>
  );
}

function StatusPill({ label, tone }: { label: string; tone: 'info' | 'success' | 'warning' }) {
  return <span style={{ ...pillStyle, borderColor: toneColor(tone) }}>{label}</span>;
}

function toneColor(tone: 'info' | 'success' | 'warning') {
  if (tone === 'success') return 'rgba(138, 240, 178, 0.4)';
  if (tone === 'warning') return 'rgba(255, 211, 107, 0.4)';
  return 'rgba(143, 183, 255, 0.4)';
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  borderRadius: 12,
  border: '1px solid var(--border)',
  background: 'var(--card-soft)',
  color: 'var(--text)',
  padding: '12px 14px',
};

const buttonStyle: React.CSSProperties = {
  borderRadius: 14,
  border: '1px solid rgba(143, 183, 255, 0.45)',
  background: 'linear-gradient(135deg, var(--accent-strong), #7d6dff)',
  color: 'white',
  padding: '14px 16px',
  fontWeight: 700,
  cursor: 'pointer',
};

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 14,
};

const cardStyle: React.CSSProperties = {
  display: 'grid',
  gap: 8,
  background: 'var(--card-soft)',
  borderRadius: 16,
  border: '1px solid var(--border)',
  padding: 16,
};

const pillStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '10px 12px',
  borderRadius: 999,
  background: 'var(--card-soft)',
  border: '1px solid var(--border)',
};

const logStyle: React.CSSProperties = {
  ...cardStyle,
  borderLeftWidth: 4,
};

const eyebrowStyle: React.CSSProperties = {
  textTransform: 'uppercase',
  letterSpacing: 1,
  color: 'var(--accent)',
  fontSize: 12,
};
