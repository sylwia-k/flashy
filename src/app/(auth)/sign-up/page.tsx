import { FormMessage } from "@/components/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import Navbar from "@/components/navbar";
import { SmtpMessage } from "../smtp-message";
import { signUpAction } from "@/app/actions";

interface SignupProps {
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default function Signup({ searchParams }: SignupProps) {
  const message = undefined;

  return (
    <>
      <Navbar />
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-8">
        <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-sm">
          <form action={signUpAction} className="flex flex-col space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight">Załóż konto</h1>
              <p className="text-sm text-muted-foreground">
                Masz już konto?{" "}
                <Link href="/sign-in" className="text-primary font-medium hover:underline transition-all">
                  Zaloguj się
                </Link>
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="full_name">Imię i nazwisko</Label>
                <Input id="full_name" name="full_name" type="text" required />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required />
              </div>

              <div>
                <Label htmlFor="password">Hasło</Label>
                <Input id="password" name="password" type="password" minLength={6} required />
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
