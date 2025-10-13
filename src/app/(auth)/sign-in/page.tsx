import Navbar from "@/components/navbar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { signInAction } from "@/app/actions";
import { FormMessage } from "@/components/form-message";

export default function SignInPage({ searchParams }: { searchParams?: { [key: string]: string } }) {
  // Jeśli chcesz przekazywać wiadomość np. po logout / error
  const message = searchParams?.message;

  return (
    <>
      <Navbar />
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-8">
        <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-sm">
          <form action={signInAction} className="flex flex-col space-y-6">
            <div className="space-y-2 text-center">
              <h1 className="text-3xl font-semibold tracking-tight">Zaloguj się</h1>
              <p className="text-sm text-muted-foreground">
                Nie masz konta?{' '}
                <Link className="text-primary font-medium hover:underline" href="/sign-up">
                  Załóż konto
                </Link>
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required placeholder="you@example.com" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password">Hasło</Label>
                  <Link className="text-xs text-muted-foreground hover:text-foreground hover:underline" href="/forgot-password">
                    Zapomniałeś hasła?
                  </Link>
                </div>
                <Input id="password" name="password" type="password" required placeholder="Twoje hasło" />
              </div>
            </div>

            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded">
              Zaloguj się
            </button>

            {message && <FormMessage message={{ text: message, type: 'info' }} />}
          </form>
        </div>
      </div>
    </>
  );
}
