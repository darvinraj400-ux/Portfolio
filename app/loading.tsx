export default function Loading() {
  return (
    <main
      role="status"
      aria-label="Loading"
      className="flex min-h-[calc(100svh-3.5rem)] flex-col justify-center px-6"
    >
      <div className="mx-auto w-full max-w-5xl">
        <div className="h-12 w-3/4 rounded-lg bg-card" />
        <div className="mt-4 h-6 w-1/2 rounded-lg bg-card" />
      </div>
    </main>
  );
}
