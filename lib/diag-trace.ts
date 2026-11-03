type TraceEntry = { at: number; event: string; detail?: string };
type TraceWindow = Window & { __stage93Trace?: TraceEntry[] };

export function trace(event: string, detail?: unknown) {
  if (typeof window === "undefined") return;
  const log = (window as TraceWindow).__stage93Trace;
  if (!log) return;
  log.push({
    at: Math.round(performance.now()),
    event,
    detail: detail === undefined ? undefined : String(detail).slice(0, 600),
  });
  if (log.length > 200) log.splice(0, log.length - 200);
}