import Link from "next/link";
import { AdminNav } from "@/components/admin/AdminNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-brand-blue text-white shadow-md">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-14">
          <Link href="/" className="font-bold text-lg">
            ACity <span className="text-yellow-400">Sports</span>
            <span className="ml-2 text-xs bg-yellow-400 text-brand-blue px-2 py-0.5 rounded-full font-semibold">ADMIN</span>
          </Link>
          <form action="/auth/signout" method="POST">
            <button className="text-sm text-blue-200 hover:text-white transition-colors">
              Sign out
            </button>
          </form>
        </div>
      </header>
      <AdminNav />
      <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
