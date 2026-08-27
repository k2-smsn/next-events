import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { updateEvent, setEventStatus, addTicketType, deleteTicketType } from '@/lib/actions/events'
import BackButton from '@/app/components/ui/BackButton'
import ConfirmAction from '@/app/components/ui/ConfirmAction'

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
      <main className="page-narrow">
         <BackButton href="/admin">Back to events</BackButton>

         <div className="mt-5 mb-7 flex flex-col gap-4">
            <div>
               <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold capitalize text-gray-700">{event.status}</span>
               </div>
               <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{event.title}</h1>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
               {event.status === 'published' && (
                  <Link href={`/admin/events/${event.id}/scan`} className="button button-primary inline-flex items-center justify-center">
                     Scan Tickets
                  </Link>
               )}

               {NEXT_STATUS[event.status]?.map((action) => (
                  <ConfirmAction
                     key={action.value}
                     action={setEventStatus.bind(null, id, event.status, action.value)}
                     triggerLabel={action.label}
                     title={`${action.label}?`}
                     description={
                        action.value === 'cancelled'
                           ? 'This will cancel the event. Make sure you really want to change its status before continuing.'
                           : `This will change the event status to ${action.label.toLowerCase()}.`
                     }
                     confirmLabel={action.label}
                     destructive={action.value === 'cancelled'}
                     triggerClassName={action.value === 'cancelled' ? 'button button-danger' : 'button button-secondary'}
                  />
               ))}
            </div>
         </div>

         <section className="card mb-6 grid grid-cols-1 gap-px overflow-hidden bg-gray-100 sm:grid-cols-3">
            <div className="bg-white p-5">
               <p className="text-sm text-gray-500">Status</p>
               <p className="mt-1 text-lg font-bold capitalize">{event.status}</p>
            </div>
            <div className="bg-white p-5">
               <p className="text-sm text-gray-500">Tickets Sold</p>
               <p className="mt-1 text-lg font-bold">{ticketsSold}</p>
            </div>
            <div className="bg-white p-5">
               <p className="text-sm text-gray-500">Revenue</p>
               <p className="mt-1 text-lg font-bold">₱{revenue.toFixed(2)}</p>
            </div>
         </section>

         <section className="card p-5 sm:p-7">
            <div className="mb-6">
               <h2 className="text-xl font-bold">Event details</h2>
               <p className="mt-1 text-sm text-gray-500">Update the information customers will see.</p>
            </div>

            <form action={updateEventWithId} className="space-y-5">
               <div className="space-y-2">
                  <label htmlFor="title" className="text-sm font-bold">Title</label>
                  <input id="title" name="title" defaultValue={event.title} required className="w-full" />
               </div>
               <div className="space-y-2">
                  <label htmlFor="description" className="text-sm font-bold">Description</label>
                  <textarea id="description" name="description" defaultValue={event.description ?? ''} rows={4} className="w-full" />
               </div>
               <div className="space-y-2">
                  <label htmlFor="venue" className="text-sm font-bold">Venue</label>
                  <input id="venue" name="venue" defaultValue={event.venue} required className="w-full" />
               </div>
               <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                     <label htmlFor="event_date" className="text-sm font-bold">Date</label>
                     <input id="event_date" type="date" name="event_date" defaultValue={event.event_date} required className="w-full" />
                  </div>
                  <div className="space-y-2">
                     <label htmlFor="event_time" className="text-sm font-bold">Time</label>
                     <input id="event_time" type="time" name="event_time" defaultValue={event.event_time} required className="w-full" />
                  </div>
               </div>
               <div className="space-y-2">
                  <label htmlFor="banner_image_url" className="text-sm font-bold">Banner Image URL</label>
                  <input id="banner_image_url" name="banner_image_url" defaultValue={event.banner_image_url ?? ''} className="w-full" />
               </div>
               <button type="submit" className="button button-primary w-full sm:w-auto">Save Changes</button>
            </form>
         </section>

         <section className="card mt-6 p-5 sm:p-7">
            <div className="mb-5">
               <h2 className="text-xl font-bold">Ticket Types</h2>
               <p className="mt-1 text-sm text-gray-500">Manage the tickets available for this event.</p>
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-200">
               {ticketTypes?.length ? (
                  <div className="divide-y divide-gray-100">
                     {ticketTypes.map((tt) => (
                        <div key={tt.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                           <div>
                              <p className="font-bold">{tt.name}</p>
                              <p className="mt-1 text-sm text-gray-500">₱{tt.price} · {tt.remaining_quantity}/{tt.total_quantity} left</p>
                           </div>
                           <ConfirmAction
                              action={deleteTicketType.bind(null, id, tt.id)}
                              triggerLabel="Remove"
                              title="Remove ticket type?"
                              description={`Remove “${tt.name}” from this event? This action cannot be undone.`}
                              confirmLabel="Remove ticket"
                              destructive
                              triggerClassName="button button-danger w-full sm:w-auto"
                           />
                        </div>
                     ))}
                  </div>
               ) : (
                  <p className="p-4 text-sm text-gray-500">No ticket types yet.</p>
               )}
            </div>

            <form action={addTicketTypeWithId} className="mt-5 grid gap-3 sm:grid-cols-[1fr_140px_120px_auto]">
               <input name="name" placeholder="Ticket name" required />
               <input type="number" name="price" placeholder="Price" step="0.01" min="0" required />
               <input type="number" name="total_quantity" placeholder="Qty" min="1" required />
               <button type="submit" className="button button-secondary">Add Ticket</button>
            </form>
         </section>
      </main>
   )
}
