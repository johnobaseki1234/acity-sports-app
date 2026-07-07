import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const STEALTH_PATH = "/stealth";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setAll(cookiesToSet: any[]) {
          cookiesToSet.forEach(({ name, value }: { name: string; value: string }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }: { name: string; value: string; options: unknown }) =>
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            supabaseResponse.cookies.set(name, value, options as any)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (request.nextUrl.pathname.startsWith(STEALTH_PATH)) {
    return supabaseResponse;
  }

  const { data: config } = await supabase
    .from("app_config")
    .select("value")
    .eq("key", "stealth_mode_enabled")
    .maybeSingle();

  const stealthModeEnabled = config?.value === true;

  if (!stealthModeEnabled) {
    return supabaseResponse;
  }

  if (!user?.email) {
    return NextResponse.redirect(new URL(STEALTH_PATH, request.url));
  }

  const { data: allowlisted } = await supabase
    .from("stealth_allowlist")
    .select("email")
    .eq("email", user.email)
    .maybeSingle();

  if (!allowlisted) {
    return NextResponse.redirect(new URL(`${STEALTH_PATH}?denied=1`, request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static, _next/image (Next internals)
     * - static assets (icons, manifest, service worker, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|offline.html|icon-192x192.png|icon-512x512.png).*)",
  ],
};
