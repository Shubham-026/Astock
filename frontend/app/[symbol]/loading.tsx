export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse px-5 pb-24 pt-28 sm:px-8">
      <div className="h-4 w-32 rounded bg-white/5" />
      <div className="mt-6 h-10 w-72 rounded bg-white/5" />
      <div className="mt-3 h-4 w-48 rounded bg-white/5" />
      <div className="mt-8 h-24 w-full rounded-3xl bg-white/5" />
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="h-96 rounded-3xl bg-white/5 lg:col-span-3" />
        <div className="h-96 rounded-3xl bg-white/5 lg:col-span-2" />
      </div>
    </div>
  );
}
