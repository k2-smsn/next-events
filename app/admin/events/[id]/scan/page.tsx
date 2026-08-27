import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import TicketScanner from './TicketScanner'
import BackButton from '@/app/components/ui/BackButton'

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
      <main className="page-narrow">
         <BackButton href={`/admin/events/${event.id}`}>Back to event</BackButton>

         <div className="mt-5 mb-6">
            <p className="mb-1 text-sm font-semibold uppercase tracking-wider text-gray-500">Ticket validation</p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Scan Tickets</h1>
            <p className="mt-2 text-gray-500">{event.title}</p>
         </div>

         <div className="card mb-5 p-5">
            <p className="text-sm leading-6 text-gray-600">
               Point the camera at a customer&apos;s QR code to validate and redeem the ticket.
            </p>
         </div>

         <TicketScanner eventId={event.id} />
      </main>
   )
}
