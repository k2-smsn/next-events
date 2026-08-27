import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { checkout } from '@/lib/actions/checkout'

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
      <div className="mx-auto max-w-lg p-8">
         <h1 className="text-2xl font-semibold">{event.title}</h1>
         <p className="mt-1 text-gray-500">
            {event.venue} · {event.event_date} · {event.event_time}
         </p>
         {event.description && <p className="mt-4">{event.description}</p>}

         {error && (
            <p className="mt-4 rounded bg-red-50 px-3 py-2 text-sm text-red-600">
               {ERROR_MESSAGES[error] ?? 'Something went wrong. Please try again.'}
            </p>
         )}

         {ticketTypes?.length ? (
            <form action={checkout} className="mt-6 space-y-4 rounded border p-4">
               <input type="hidden" name="event_id" value={event.id} />

               <div>
                  <label className="text-sm font-medium">Ticket Type</label>
                  <select name="ticket_type_id" required className="w-full rounded border px-3 py-2 text-sm">
                     {ticketTypes.map((tt) => (
                        <option key={tt.id} value={tt.id}>
                           {tt.name} — ₱{tt.price} ({tt.remaining_quantity} left)
                        </option>
                     ))}
                  </select>
               </div>

               <div>
                  <label className="text-sm font-medium">Quantity</label>
                  <input
                     type="number"
                     name="quantity"
                     min={1}
                     defaultValue={1}
                     required
                     className="w-full rounded border px-3 py-2 text-sm"
                  />
               </div>

               <div>
                  <label className="text-sm font-medium">Full Name</label>
                  <input name="name" required className="w-full rounded border px-3 py-2 text-sm" />
               </div>

               <div>
                  <label className="text-sm font-medium">Email</label>
                  <input type="email" name="email" required className="w-full rounded border px-3 py-2 text-sm" />
                  <p className="mt-1 text-xs text-gray-500">Your ticket QR code will be sent here.</p>
               </div>

               <div>
                  <label className="text-sm font-medium">Phone</label>
                  <input
                     type="tel"
                     name="phone"
                     required
                     placeholder="+639171234567"
                     className="w-full rounded border px-3 py-2 text-sm"
                  />
               </div>

               <div>
                  <label className="text-sm font-medium">Payment Method</label>
                  <div className="mt-1 flex gap-3 text-sm">
                     <label className="flex items-center gap-1">
                        <input type="radio" name="payment_method" value="gcash" defaultChecked required /> GCash
                     </label>
                     <label className="flex items-center gap-1">
                        <input type="radio" name="payment_method" value="grab_pay" required /> GrabPay
                     </label>
                     <label className="flex items-center gap-1">
                        <input type="radio" name="payment_method" value="paymaya" required /> Maya
                     </label>
                  </div>
               </div>

               <p className="text-xs text-gray-500">
                  Your ticket selection is held for 15 minutes to complete payment.
               </p>

               <button type="submit" className="w-full rounded bg-black px-4 py-2 text-sm font-medium text-white">
                  Proceed to Payment
               </button>
            </form>
         ) : (
            <p className="mt-6 text-gray-500">Sold out.</p>
         )}
      </div>
   )
}