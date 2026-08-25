import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/lib/actions/auth'

const STATUS_STYLES: Record<string, string> = {
   draft: 'bg-gray-100 text-gray-700',
   published: 'bg-green-100 text-green-700',
   completed: 'bg-blue-100 text-blue-700',
   cancelled: 'bg-red-100 text-red-700',
}

export default async function AdminDashboardPage() {
   const supabase = await createClient()
   const { data: events } = await supabase
      .from('events')
      .select('id, title, venue, event_date, status')
      .order('event_date', { ascending: true })

   return (
      <div className="p-8">
         <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-semibold">Events</h1>
            <div className="flex gap-3">
               <Link href="/admin/events/new" className="rounded bg-black px-4 py-2 text-sm text-white">
                  + New Event
               </Link>
               <form action={signOut}>
                  <button type="submit" className="rounded border px-3 py-2 text-sm">
                     Sign out
                  </button>
               </form>
            </div>
         </div>

         <div className="divide-y rounded border">
            {events?.length ? (
               events.map((event) => (
                  <Link
                     key={event.id}
                     href={`/admin/events/${event.id}`}
                     className="flex items-center justify-between p-4 hover:bg-gray-50"
                  >
                     <div>
                        <p className="font-medium">{event.title}</p>
                        <p className="text-sm text-gray-500">
                           {event.venue} · {event.event_date}
                        </p>
                     </div>
                     <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLES[event.status]}`}>
                        {event.status}
                     </span>
                  </Link>
               ))
            ) : (
               <p className="p-4 text-sm text-gray-500">No events yet.</p>
            )}
         </div>
      </div>
   )
}