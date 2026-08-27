// Suggested location: app/admin/events/new/page.tsx
import { createEvent } from '@/lib/actions/events'
import SubmitButton from '@/app/components/ui/SubmitButton'

export default async function NewEventPage({
   searchParams,
}: {
   searchParams: Promise<{ error?: string }>
}) {
   const { error } = await searchParams

   return (
      <div className="mx-auto max-w-lg p-8">
         <h1 className="mb-6 text-2xl font-semibold">New Event</h1>

         {error && (
            <p className="mb-4 rounded bg-red-50 px-3 py-2 text-sm text-red-600">
               Something went wrong creating the event. Try again.
            </p>
         )}

         <form action={createEvent} className="space-y-4">
            <div>
               <label className="text-sm font-medium">Title</label>
               <input name="title" required className="w-full rounded border px-3 py-2 text-sm" />
            </div>

            <div>
               <label className="text-sm font-medium">Description</label>
               <textarea name="description" rows={3} className="w-full rounded border px-3 py-2 text-sm" />
            </div>

            <div>
               <label className="text-sm font-medium">Venue</label>
               <input name="venue" required className="w-full rounded border px-3 py-2 text-sm" />
            </div>

            <div className="flex gap-3">
               <div className="flex-1">
                  <label className="text-sm font-medium">Date</label>
                  <input type="date" name="event_date" required className="w-full rounded border px-3 py-2 text-sm" />
               </div>
               <div className="flex-1">
                  <label className="text-sm font-medium">Time</label>
                  <input type="time" name="event_time" required className="w-full rounded border px-3 py-2 text-sm" />
               </div>
            </div>

            <div>
               <label className="text-sm font-medium">Banner Image URL</label>
               <input name="banner_image_url" className="w-full rounded border px-3 py-2 text-sm" />
            </div>

            <hr />
            <p className="text-sm text-gray-500">Starting ticket type — add more later from the event page.</p>

            <div>
               <label className="text-sm font-medium">Ticket Name</label>
               <input
                  name="ticket_name"
                  defaultValue="General Admission"
                  className="w-full rounded border px-3 py-2 text-sm"
               />
            </div>

            <div className="flex gap-3">
               <div className="flex-1">
                  <label className="text-sm font-medium">Price (PHP)</label>
                  <input
                     type="number"
                     name="price"
                     step="0.01"
                     min="0"
                     required
                     className="w-full rounded border px-3 py-2 text-sm"
                  />
               </div>
               <div className="flex-1">
                  <label className="text-sm font-medium">Quantity</label>
                  <input
                     type="number"
                     name="total_quantity"
                     min="1"
                     required
                     className="w-full rounded border px-3 py-2 text-sm"
                  />
               </div>
            </div>

            <SubmitButton pendingLabel="Creating..." className="w-full rounded bg-black px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60">
               Create Event (Draft)
            </SubmitButton>
         </form>
      </div>
   )
}