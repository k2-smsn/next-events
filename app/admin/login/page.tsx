import { signIn } from '@/lib/actions/auth'
import SubmitButton from '@/app/components/ui/SubmitButton'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <form action={signIn} className="card w-full max-w-md space-y-6 p-6 sm:p-8">
        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-gray-500">Administration</p>
          <h1 className="text-3xl font-bold tracking-tight">Admin Login</h1>
          <p className="mt-2 text-sm text-gray-500">Sign in to manage events and validate tickets.</p>
        </div>

        {error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            Invalid email or password. Please try again.
          </p>
        )}

        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-bold">Email</label>
          <input id="email" name="email" type="email" required autoComplete="email" className="w-full" />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-bold">Password</label>
          <input id="password" name="password" type="password" required autoComplete="current-password" className="w-full" />
        </div>

        <SubmitButton pendingLabel="Signing in..." className="button button-primary w-full disabled:cursor-not-allowed disabled:opacity-60">Sign in</SubmitButton>
      </form>
    </main>
  )
}
