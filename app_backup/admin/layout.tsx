import Link from 'next/link';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-indigo-600 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/admin" className="font-bold text-xl">
                  Admin Dashboard
                </Link>
              </div>
              <div className="ml-6 flex space-x-4 items-center">
                <Link href="/admin/topics" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-700">
                  Topics
                </Link>
                <Link href="/admin/content" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-700">
                  Content
                </Link>
                <Link href="/dashboard" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-700">
                  Back to App
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
