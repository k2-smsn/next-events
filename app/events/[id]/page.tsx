import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { checkout } from '@/lib/actions/checkout'
import BackButton from '@/app/components/ui/BackButton'
import SubmitButton from '@/app/components/ui/SubmitButton'

const ERROR_MESSAGES: Record<string, string> = {
   sold_out: 'Sorry, not enough tickets left for that selection.',
   reserve_failed: 'Something went wrong reserving your tickets. Please try again.',
   payment_setup_failed: 'Something went wrong setting up payment. Please try again.',
}

export default async function EventPage({
   params,
   searchParams,
}: {
   params: Promise<{ id: string }>
   searchParams: Promise<{ error?: string }>
}) {
   const { id } = await params
   const { error } = await searchParams
   const supabase = await createClient()

   const { data: event } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .eq('status', 'published')
      .single()
   if (!event) notFound()

   const { data: ticketTypes } = await supabase
      .from('ticket_types')
      .select('*')
      .eq('event_id', id)
      .gt('remaining_quantity', 0)

   return (
      <main className="page-narrow">
         <BackButton href="/">Back to events</BackButton>

         <div className="mt-5 mb-7">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{event.title}</h1>
            <p className="mt-2 text-base text-gray-500">{event.venue} · {event.event_date} · {event.event_time}</p>
            {event.description && <p className="mt-5 text-gray-700">{event.description}</p>}
         </div>

         {error && (
            <p className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
               {ERROR_MESSAGES[error] ?? 'Something went wrong. Please try again.'}
            </p>
         )}

         {ticketTypes?.length ? (
            <form action={checkout} className="card space-y-6 p-5 sm:p-7">
               <input type="hidden" name="event_id" value={event.id} />

               <div>
                  <h2 className="text-xl font-bold">Book your tickets</h2>
                  <p className="mt-1 text-sm text-gray-500">Your selection will be held for 15 minutes while payment is completed.</p>
               </div>

               <div className="space-y-2">
                  <label htmlFor="ticket_type_id" className="text-sm font-bold">Ticket Type</label>
                  <select id="ticket_type_id" name="ticket_type_id" required className="w-full">
                     {ticketTypes.map((tt) => (
                        <option key={tt.id} value={tt.id}>{tt.name} — ₱{tt.price} ({tt.remaining_quantity} left)</option>
                     ))}
                  </select>
               </div>

               <div className="space-y-2">
                  <label htmlFor="quantity" className="text-sm font-bold">Quantity</label>
                  <input id="quantity" type="number" name="quantity" min={1} defaultValue={1} required className="w-full" />
               </div>

               <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-bold">Full Name</label>
                  <input id="name" name="name" required autoComplete="name" className="w-full" />
               </div>

               <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-bold">Email</label>
                  <input id="email" type="email" name="email" required autoComplete="email" className="w-full" />
                  <p className="text-xs text-gray-500">Your ticket QR code will be sent here.</p>
               </div>

               <div className="space-y-2">
                  <label htmlFor="phone" className="text-sm font-bold">Phone</label>
                  <input id="phone" type="tel" name="phone" required autoComplete="tel" placeholder="+639171234567" className="w-full" />
               </div>

               <fieldset>
                  <legend className="text-sm font-bold">Payment Method</legend>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                     {[
                        ['gcash', 'GCash'],
                        ['grab_pay', 'GrabPay'],
                        ['paymaya', 'Maya'],
                     ].map(([value, label]) => (
                        <label key={value} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-gray-200 px-4 font-medium hover:bg-gray-50">
                           <input type="radio" name="payment_method" value={value} defaultChecked={value === 'gcash'} required className="!min-h-0" />
                           {label}
                        </label>
                     ))}
                  </div>
               </fieldset>

               <SubmitButton pendingLabel="Preparing payment..." className="button button-primary w-full disabled:cursor-not-allowed disabled:opacity-60">Proceed to Payment</SubmitButton>
            </form>
         ) : (
            <div className="card p-6 text-center">
               <p className="text-lg font-bold">Sold out</p>
               <p className="mt-1 text-gray-500">There are no tickets currently available for this event.</p>
               <Link href="/" className="button button-secondary mt-5 inline-flex items-center justify-center">Browse other events</Link>
            </div>
         )}
      </main>
   )
}
