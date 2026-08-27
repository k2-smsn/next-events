import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import TicketScanner from './TicketScanner'

export default async function TicketScannerPage({
   params,
}: {
   params: Promise<{ id: string }>
}) {
   const { id } = await params
   const supabase = await createClient()

   const { data: event } = await supabase
      .from('events')
      .select('id, title, venue, event_date, event_time')
      .eq('id', id)
      .single()

   if (!event) notFound()

   return (
      <main className="mx-auto max-w-2xl space-y-6 p-8">
         <div className="flex items-center justify-between gap-4">
            <div>
               <Link
                  href={`/admin/events/${event.id}`}
                  className="text-sm text-gray-500 hover:underline"
               >
                  ← Back to event
               </Link>

               <h1 className="mt-2 text-2xl font-semibold">Scan Tickets</h1>
               <p className="mt-1 text-sm text-gray-500">{event.title}</p>
            </div>
         </div>

         <div className="rounded border p-4">
            <p className="text-sm text-gray-500">
               Scan a customer's QR code to validate and redeem the ticket.
            </p>
         </div>

         <TicketScanner eventId={event.id} />
      </main>
   )
}
