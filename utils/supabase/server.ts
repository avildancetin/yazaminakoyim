import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set(name, value, {
              // Spread options first to preserve Supabase's settings
              ...options,
              // Use secure cookies in production (HTTPS), allow insecure in development (localhost)
              secure: process.env.NODE_ENV === "production",
              httpOnly: options?.httpOnly !== undefined ? options.httpOnly : true,
              path: options?.path || "/",
              sameSite: (options?.sameSite as any) || "lax",
            });
          } catch (error) {
            // In Server Components, setting cookies during render may fail
            // This is expected - cookies will be set via middleware on next request
            // Don't throw - let the middleware handle it
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set(name, "", {
              ...options,
              maxAge: 0,
              path: options?.path ?? "/",
            });
          } catch (error) {
            // In Server Components, removing cookies during render may fail
            // This is expected - cookies will be removed via middleware on next request
            // Don't throw - let the middleware handle it
          }
        },
      },
    }
  );
}