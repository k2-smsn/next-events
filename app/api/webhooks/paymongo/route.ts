// Suggested location: app/api/webhooks/paymongo/route.ts
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendTicketEmail } from '@/lib/tickets'

const supabaseAdmin = createAdminClient()

function isValidSignature(rawBody: string, header: string, secret: string) {
   const parts = Object.fromEntries(header.split(',').map((p) => p.split('=') as [string, string]))
   const expected = crypto.createHmac('sha256', secret).update(`${parts.t}.${rawBody}`).digest('hex')

   // Checking `te` (test mode) — swap to `parts.li` once this runs against
   // a live webhook secret in production.
   return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(parts.te ?? ''))
}

export async function POST(req: NextRequest) {
   console.log('[webhook] received request')

   const rawBody = await req.text()
   const signature = req.headers.get('Paymongo-Signature')
   console.log('[webhook] signature header present:', !!signature)

   if (!signature || !isValidSignature(rawBody, signature, process.env.PAYMONGO_WEBHOOK_SECRET!)) {
      console.log('[webhook] signature check FAILED')
      return NextResponse.json({ error: 'invalid signature' }, { status: 401 })
   }
   console.log('[webhook] signature check passed')

   const event = JSON.parse(rawBody)
   const eventType = event.data?.attributes?.type
   const paymentIntentId = event.data?.attributes?.data?.attributes?.payment_intent_id
   console.log('[webhook] event type:', eventType, '| payment_intent_id:', paymentIntentId)

   if (eventType === 'payment.paid') {
      const { data: tickets, error } = await supabaseAdmin.rpc('mark_order_paid_by_intent', {
         p_payment_intent_id: paymentIntentId,
      })
      console.log('[webhook] mark_order_paid_by_intent error:', error)
      console.log('[webhook] tickets returned:', tickets)

      // Empty on a duplicate/retry delivery (order already processed) — the
      // guard inside mark_order_paid_by_intent already prevents that from
      // re-running, so this also naturally prevents a duplicate email.
      if (tickets && tickets.length > 0) {
        const { data: orderInfo, error: orderInfoError } = await supabaseAdmin
            .from('orders')
            .select('customer_email, customer_name, events(title, venue, event_date, event_time)')
            .eq('id', tickets[0].order_id)
            .single()

         if (orderInfoError) console.error('[webhook] orderInfo fetch error:', orderInfoError)

         if (orderInfo?.events?.[0]) {
            const eventInfo = orderInfo.events[0]
            await sendTicketEmail(tickets, {
               customerEmail: orderInfo.customer_email,
               customerName: orderInfo.customer_name,
               eventTitle: eventInfo.title,
               venue: eventInfo.venue,
               eventDate: eventInfo.event_date,
               eventTime: eventInfo.event_time,
            })
         }
      }
   } else if (eventType === 'payment.failed') {
      const { error } = await supabaseAdmin.rpc('release_order_hold_by_intent', { p_payment_intent_id: paymentIntentId })
      console.log('[webhook] release_order_hold_by_intent error:', error)
   }

   // Always 200, even for event types we don't handle — a non-2xx makes
   // PayMongo retry, which just piles up noise for events we're ignoring on purpose.
   return NextResponse.json({ received: true })
}