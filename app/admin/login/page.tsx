import { signIn } from '@/lib/actions/auth'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <form
        action={signIn}
        className="w-full max-w-sm space-y-4 rounded-lg border bg-white p-6 shadow-sm"
      >
        <h1 className="text-xl font-semibold">Admin Login</h1>

        {error && (
          <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-600">
            Invalid email or password. Please try again.
          </p>
        )}

        <div className="space-y-1">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full rounded border px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="password" className="text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="w-full rounded border px-3 py-2 text-sm"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded bg-black px-3 py-2 text-sm font-medium text-white"
        >
          Sign in
        </button>
      </form>
    </div>
  )
}