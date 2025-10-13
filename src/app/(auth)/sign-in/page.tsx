import { signInAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import Navbar from "@/components/navbar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

interface SignInPageProps {
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default function SignInPage({ searchParams }: SignInPageProps) {
  const message = undefined;

  return (
    <>
      <Navbar />
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-8">
        <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-sm">
          <form action={signInAction} className="flex flex-col space-y-6">
            <div className="space-y-2 text-center">
              <h1 className="text-3xl font-semibold tracking-tight">Zaloguj się</h1>
              <p className="text-sm text-muted-foreground">
                Nie masz konta?{" "}
                <Link href="/sign-up" className="text-primary font-medium hover:underline transition-all">
                  Załóż konto
                </Link>
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required />
              </div>

              <div>
                <Label htmlFor="password">Hasło</Label>
                <Input id="password" name="password" type="password" required />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition-colors"
            >
              Zaloguj się
            </button>

            {message && <FormMessage message={message} />}
          </form>
        </div>
      </div>
    </>
  );
}
 