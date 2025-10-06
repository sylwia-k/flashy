import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { SmtpMessage } from "../smtp-message";
import { signUpAction } from "@/app/actions";
import Navbar from "@/components/navbar";
import { UrlProvider } from "@/components/url-provider";


function Signup({ searchParams }: { searchParams: Record<string, string> }) {
  // Komponent synchroniczny, message undefined (możesz dodać obsługę query params jeśli chcesz)
  const message = undefined;
  return (
    <>
      <Navbar />
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-8">
        <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-sm">
          <form action={signUpAction} className="flex flex-col space-y-6">
            <div className="space-y-2 text-center">
              <h1 className="text-3xl font-semibold tracking-tight">Załóż konto</h1>
              <p className="text-sm text-muted-foreground">
                Masz już konto?{' '}
                <Link
                  className="text-primary font-medium hover:underline transition-all"
                  href="/sign-in"
                >
                  Zaloguj się
                </Link>
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name" className="text-sm font-medium">
                  Imię i nazwisko
                </Label>
                <Input
                  id="full_name"
                  name="full_name"
                  type="text"
                  placeholder="Jan Kowalski"
                  required
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="twoj@email.com"
                  required
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Hasło
                </Label>
                <Input
                  id="password"
                  type="password"
                  name="password"
                  placeholder="Twoje hasło"
                  minLength={6}
                  required
                  className="w-full"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition-colors"
            >
              Załóż konto
            </button>

            {message && <FormMessage message={message} />}
          </form>
        </div>
        <SmtpMessage />
      </div>
    </>
  );
}

export default Signup;

