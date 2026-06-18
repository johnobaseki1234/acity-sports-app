import { Suspense } from "react";
import { Trophy } from "lucide-react";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-700 via-red-600 to-black flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20">
        <div className="text-center mb-8">
          <div className="mx-auto mb-3 grid place-items-center h-14 w-14 rounded-2xl bg-gradient-to-br from-red-600 to-red-800 text-white shadow-lg shadow-red-600/25">
            <Trophy className="h-7 w-7" strokeWidth={2.25} />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white">
            ACITY <span className="text-red-600 dark:text-red-500">SPORTS</span>
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Scorer / Admin Login</p>
        </div>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
