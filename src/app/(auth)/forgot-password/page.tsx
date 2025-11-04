import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { forgotPasswordAction } from "@/app/actions";
import Navbar from "@/components/navbar";
import { UrlProvider } from "@/components/url-provider";
import { SmtpMessage } from "../smtp-message";

export default async function ForgotPasswordPage(props: { searchParams: Promise<Record<string, string>> }) {
  const searchParams = await props.searchParams;
  const message = searchParams?.message;

  return (
    <>
      <Navbar />
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-8">
        <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-sm">
          <UrlProvider>
            <form className="flex flex-col space-y-6" action={forgotPasswordAction}>
              <div className="space-y-2 text-center">
                <h1 className="text-3xl font-semibold tracking-tight">Reset Password</h1>
                <p className="text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link className="text-primary font-medium hover:underline" href="/sign-in">
                    Sign in
                  </Link>
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" placeholder="you@example.com" required />
                </div>
              </div>

              <SubmitButton
                pendingText="Sending reset link..."
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded"
              >
                Reset Password
              </SubmitButton>

              {message && <FormMessage message={{ message }} />}
            </form>
          </UrlProvider>
        </div>
        <SmtpMessage />
      </div>
    </>
  );
}
