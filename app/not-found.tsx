import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-[calc(100svh-3.5rem)] flex-col items-center justify-center px-6 text-center">
      <p className="text-sm text-muted-foreground">404</p>
      <h1 className="mt-4 font-serif text-4xl tracking-tight text-foreground">
        Nothing here knows its limits.
      </h1>
      <Link
        href="/"
        className="mt-8 text-sm font-medium text-foreground underline-offset-4 hover:underline"
      >
        Back home
      </Link>
    </main>
  );
}
