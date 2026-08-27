// Suggested location: app/checkout/[orderId]/return/page.tsx
import { createAdminClient } from '@/lib/supabase/admin'

export default async function ReturnPage({ params }: { params: Promise<{ orderId: string }> }) {
   const { orderId } = await params
   const supabase = createAdminClient()

   const { data: order, error } = await supabase
   .from('orders')
   .select('status, quantity, event_id')
   .eq('id', orderId)
   .single()

   if (error) console.error('[return page] order fetch error:', error)

   if (!order) {
      return <div className="p-8 text-center">Order not found.</div>
   }

   const { data: event } = await supabase
      .from('events')
      .select('title')
      .eq('id', order.event_id)
      .single()

   if (order.status === 'pending') {
      return (
         <div className="p-8 text-center">
            <meta httpEquiv="refresh" content="3" />
            <h1 className="text-xl font-semibold">Confirming your payment…</h1>
            <p className="mt-2 text-gray-500">This page refreshes automatically. Please don't close this tab.</p>
         </div>
      )
   }

   if (order.status === 'paid') {
      return (
         <div className="p-8 text-center">
            <h1 className="text-xl font-semibold">You're all set!</h1>
            <p className="mt-2 text-gray-500">
               We emailed your ticket{order.quantity > 1 ? 's' : ''} for {event?.title} to your inbox.
            </p>
         </div>
      )
   }

   return (
      <div className="p-8 text-center">
         <h1 className="text-xl font-semibold">Payment didn't go through</h1>
         <p className="mt-2 text-gray-500">Your reservation was released. Feel free to try again.</p>
      </div>
   )
}