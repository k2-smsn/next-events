import { signOut } from '@/lib/actions/auth'

export default function AdminDashboardPage() {
  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
        <form action={signOut}>
          <button
            type="submit"
            className="rounded border px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            Sign out
          </button>
        </form>
      </div>
      <p className="mt-4 text-gray-600">
        Placeholder — event management UI goes here next.
      </p>
    </div>
  )
}