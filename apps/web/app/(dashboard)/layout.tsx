import Link from 'next/link';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r flex flex-col">
        <div className="h-14 flex items-center px-6 border-b font-bold text-lg">
          Amplis
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <Link href="/projects" className="block px-4 py-2 rounded-md hover:bg-slate-100 text-slate-700 font-medium">
            Projects
          </Link>
          <Link href="/people" className="block px-4 py-2 rounded-md hover:bg-slate-100 text-slate-700 font-medium">
            People
          </Link>
          <Link href="/billing" className="block px-4 py-2 rounded-md hover:bg-slate-100 text-slate-700 font-medium">
            Billing
          </Link>
        </nav>
        <div className="p-4 border-t text-sm text-slate-500">
          <div className="font-medium text-slate-900">Demo User</div>
          <div>Owner</div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="h-14 border-b bg-white flex items-center px-8 justify-between">
           <h1 className="font-semibold text-slate-800">Dashboard</h1>
        </div>
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}


