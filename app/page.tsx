import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function HomePage() {
   const supabase = await createClient()
   const { data: events } = await supabase
      .from('events')
      .select('id, title, venue, event_date, event_time')
      .eq('status', 'published')
      .order('event_date', { ascending: true })

   return (
      <>
         <Link
            href="/admin/login"
            className="fixed right-4 top-4 z-50 rounded-lg border bg-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-gray-50"
         >
            Admin Login
         </Link>

         <div className="mx-auto max-w-3xl p-8">
            <h1 className="mb-6 text-2xl font-semibold">Upcoming Events</h1>

            <div className="grid gap-4">
               {events?.length ? (
                  events.map((event) => (
                     <Link
                        key={event.id}
                        href={`/events/${event.id}`}
                        className="block rounded border p-4 hover:bg-gray-50"
                     >
                        <p className="font-medium">{event.title}</p>
                        <p className="text-sm text-gray-500">
                           {event.venue} · {event.event_date} · {event.event_time}
                        </p>
                     </Link>
                  ))
               ) : (
                  <p className="text-gray-500">
                     No upcoming events right now.
                  </p>
               )}
            </div>
         </div>
      </>
   )
}