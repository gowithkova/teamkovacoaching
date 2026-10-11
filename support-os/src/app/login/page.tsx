import Link from "next/link";
import { login } from "@/app/login/actions";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { Card, CardBody } from "@/components/ui/Card";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <p className="text-sm font-semibold tracking-wide text-ink">KOVA SUPPORT OS</p>
          <p className="mt-0.5 text-xs text-ink-soft">Find &rarr; Deliver &rarr; Get paid</p>
        </div>
        <Card>
          <CardBody className="space-y-4 pt-5">
            <h1 className="text-lg font-semibold text-ink">Sign in</h1>
            {error && (
              <p className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>
            )}
            <form action={login} className="space-y-3">
              <TextField label="Email" name="email" type="email" required autoComplete="email" />
              <TextField label="Password" name="password" type="password" required autoComplete="current-password" />
              <Button type="submit" variant="primary" className="w-full">
                Sign in
              </Button>
            </form>
            <p className="text-center text-xs text-ink-soft">
              First time? <Link href="/signup" className="text-accent-strong hover:underline">Create your operator account</Link>
            </p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
