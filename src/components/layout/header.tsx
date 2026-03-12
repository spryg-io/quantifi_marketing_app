export function Header({ title }: { title: string }) {
  return (
    <header className="border-b border-slate-200 bg-white px-6 py-4">
      <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
    </header>
  );
}
