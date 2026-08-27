import Link from 'next/link'
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
      return (
         <main className="page-shell flex min-h-screen items-center justify-center">
            <div className="card w-full max-w-md p-7 text-center">
               <h1 className="text-2xl font-bold">Order not found</h1>
               <p className="mt-2 text-gray-500">We couldn&apos;t find that order.</p>
               <Link href="/" className="button button-secondary mt-6 inline-flex items-center justify-center">Back to events</Link>
            </div>
         </main>
      )
   }

   const { data: event } = await supabase
      .from('events')
      .select('title')
      .eq('id', order.event_id)
      .single()

   if (order.status === 'pending') {
      return (
         <main className="page-shell flex min-h-screen items-center justify-center">
            <meta httpEquiv="refresh" content="3" />
            <div className="card w-full max-w-md p-7 text-center">
               <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-gray-100 text-xl">…</div>
               <h1 className="mt-5 text-2xl font-bold">Confirming your payment</h1>
               <p className="mt-2 text-gray-500">This page refreshes automatically. Please don&apos;t close this tab.</p>
            </div>
         </main>
      )
   }

   if (order.status === 'paid') {
      return (
         <main className="page-shell flex min-h-screen items-center justify-center">
            <div className="card w-full max-w-md p-7 text-center">
               <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-green-100 text-xl text-green-700">✓</div>
               <h1 className="mt-5 text-2xl font-bold">You&apos;re all set!</h1>
               <p className="mt-2 text-gray-500">
                  We emailed your ticket{order.quantity > 1 ? 's' : ''} for {event?.title} to your inbox.
               </p>
               <Link href="/" className="button button-secondary mt-6 inline-flex items-center justify-center">Back to events</Link>
            </div>
         </main>
      )
   }

   return (
      <main className="page-shell flex min-h-screen items-center justify-center">
         <div className="card w-full max-w-md p-7 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-red-100 text-xl text-red-700">!</div>
            <h1 className="mt-5 text-2xl font-bold">Payment didn&apos;t go through</h1>
            <p className="mt-2 text-gray-500">Your reservation was released. Feel free to try again.</p>
            <Link href="/" className="button button-secondary mt-6 inline-flex items-center justify-center">Back to events</Link>
         </div>
      </main>
   )
}
