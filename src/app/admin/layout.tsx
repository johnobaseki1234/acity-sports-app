import Link from "next/link";
import { Trophy, LogOut } from "lucide-react";
import { AdminNav } from "@/components/admin/AdminNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 glass-strong border-x-0 border-t-0">
        <div className="max-w-5xl mx-auto px-4 sm:px-5 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5 group">
            <span className="grid place-items-center h-10 w-10 rounded-2xl bg-vanguard-volt text-black shadow-lg shadow-vanguard-volt/25 transition-transform group-active:scale-95">
              <Trophy className="h-5 w-5" strokeWidth={2.25} />
            </span>
            <span className="leading-tight">
              <span className="block font-extrabold tracking-tight text-[15px] text-zinc-900 dark:text-white">
                VAN<span className="text-vanguard-volt">GUARD</span>
              </span>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-vanguard-volt">
                Admin Console
              </span>
            </span>
          </Link>
          <form action="/auth/signout" method="POST">
            <button className="inline-flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/5 transition active:scale-95">
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </form>
        </div>
      </header>
      <AdminNav />
      <main className="max-w-5xl mx-auto px-4 sm:px-5 py-6">{children}</main>
    </div>
  );
}
