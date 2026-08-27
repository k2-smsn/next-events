import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { updateEvent, setEventStatus, addTicketType, deleteTicketType } from '@/lib/actions/events'

const NEXT_STATUS: Record<string, { label: string; value: string }[]> = {
   draft: [
      { label: 'Publish', value: 'published' },
      { label: 'Cancel', value: 'cancelled' },
   ],
   published: [
      { label: 'Mark Completed', value: 'completed' },
      { label: 'Cancel', value: 'cancelled' },
   ],
   completed: [],
   cancelled: [],
}

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
   const { id } = await params
   const supabase = await createClient()

   const { data: event } = await supabase.from('events').select('*').eq('id', id).single()
   if (!event) notFound()

   const { data: ticketTypes } = await supabase.from('ticket_types').select('*').eq('event_id', id)

   const { data: paidOrders } = await supabase
      .from('orders')
      .select('quantity, total_amount')
      .eq('event_id', id)
      .eq('status', 'paid')

   const ticketsSold = paidOrders?.reduce((sum, o) => sum + o.quantity, 0) ?? 0
   const revenue = paidOrders?.reduce((sum, o) => sum + Number(o.total_amount), 0) ?? 0

   const updateEventWithId = updateEvent.bind(null, id)
   const addTicketTypeWithId = addTicketType.bind(null, id)

   return (
      <div className="mx-auto max-w-2xl space-y-8 p-8">
         <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold">{event.title}</h1>

            <div className="flex gap-2">
               {event.status === 'published' && (
                  <Link
                     href={`/admin/events/${event.id}/scan`}
                     className="rounded bg-black px-3 py-1.5 text-sm font-medium text-white"
                  >
                     Scan Tickets
                  </Link>
               )}

               {NEXT_STATUS[event.status]?.map((action) => (
                  <form key={action.value} action={setEventStatus.bind(null, id, event.status, action.value)}>
                     <button type="submit" className="rounded border px-3 py-1.5 text-sm">
                        {action.label}
                     </button>
                  </form>
               ))}
            </div>
         </div>

         <div className="grid grid-cols-3 gap-4 rounded border p-4 text-sm">
            <div>
               <p className="text-gray-500">Status</p>
               <p className="font-medium capitalize">{event.status}</p>
            </div>
            <div>
               <p className="text-gray-500">Tickets Sold</p>
               <p className="font-medium">{ticketsSold}</p>
            </div>
            <div>
               <p className="text-gray-500">Revenue</p>
               <p className="font-medium">₱{revenue.toFixed(2)}</p>
            </div>
         </div>

         <form action={updateEventWithId} className="space-y-4">
            <div>
               <label className="text-sm font-medium">Title</label>
               <input name="title" defaultValue={event.title} required className="w-full rounded border px-3 py-2 text-sm" />
            </div>
            <div>
               <label className="text-sm font-medium">Description</label>
               <textarea
                  name="description"
                  defaultValue={event.description ?? ''}
                  rows={3}
                  className="w-full rounded border px-3 py-2 text-sm"
               />
            </div>
            <div>
               <label className="text-sm font-medium">Venue</label>
               <input name="venue" defaultValue={event.venue} required className="w-full rounded border px-3 py-2 text-sm" />
            </div>
            <div className="flex gap-3">
               <div className="flex-1">
                  <label className="text-sm font-medium">Date</label>
                  <input
                     type="date"
                     name="event_date"
                     defaultValue={event.event_date}
                     required
                     className="w-full rounded border px-3 py-2 text-sm"
                  />
               </div>
               <div className="flex-1">
                  <label className="text-sm font-medium">Time</label>
                  <input
                     type="time"
                     name="event_time"
                     defaultValue={event.event_time}
                     required
                     className="w-full rounded border px-3 py-2 text-sm"
                  />
               </div>
            </div>
            <div>
               <label className="text-sm font-medium">Banner Image URL</label>
               <input
                  name="banner_image_url"
                  defaultValue={event.banner_image_url ?? ''}
                  className="w-full rounded border px-3 py-2 text-sm"
               />
            </div>
            <button type="submit" className="rounded bg-black px-4 py-2 text-sm font-medium text-white">
               Save Changes
            </button>
         </form>

         <div>
            <h2 className="mb-3 text-lg font-semibold">Ticket Types</h2>
            <div className="divide-y rounded border">
               {ticketTypes?.map((tt) => (
                  <div key={tt.id} className="flex items-center justify-between p-3 text-sm">
                     <div>
                        <p className="font-medium">{tt.name}</p>
                        <p className="text-gray-500">
                           ₱{tt.price} · {tt.remaining_quantity}/{tt.total_quantity} left
                        </p>
                     </div>
                     <form action={deleteTicketType.bind(null, id, tt.id)}>
                        <button type="submit" className="text-red-600 hover:underline">
                           Remove
                        </button>
                     </form>
                  </div>
               ))}
            </div>

            <form action={addTicketTypeWithId} className="mt-4 flex gap-2">
               <input name="name" placeholder="Name" required className="flex-1 rounded border px-3 py-2 text-sm" />
               <input
                  type="number"
                  name="price"
                  placeholder="Price"
                  step="0.01"
                  min="0"
                  required
                  className="w-24 rounded border px-3 py-2 text-sm"
               />
               <input
                  type="number"
                  name="total_quantity"
                  placeholder="Qty"
                  min="1"
                  required
                  className="w-24 rounded border px-3 py-2 text-sm"
               />
               <button type="submit" className="rounded border px-3 py-2 text-sm">
                  Add
               </button>
            </form>
         </div>
      </div>
   )
}
