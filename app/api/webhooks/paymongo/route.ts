import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendTicketEmail } from '@/lib/tickets'

const supabaseAdmin = createAdminClient()

function isValidSignature(rawBody: string, header: string, secret: string) {
   const parts = Object.fromEntries(header.split(',').map((p) => p.split('=') as [string, string]))
   const expected = crypto.createHmac('sha256', secret).update(`${parts.t}.${rawBody}`).digest('hex')

   return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(parts.te ?? ''))
}

export async function POST(req: NextRequest) {
   const rawBody = await req.text()
   const signature = req.headers.get('Paymongo-Signature')

   if (!signature || !isValidSignature(rawBody, signature, process.env.PAYMONGO_WEBHOOK_SECRET!)) {
      return NextResponse.json({ error: 'invalid signature' }, { status: 401 })
   }

   const event = JSON.parse(rawBody)
   const eventType = event.data?.attributes?.type
   const paymentIntentId = event.data?.attributes?.data?.attributes?.payment_intent_id

   if (eventType === 'payment.paid') {
      const { data: tickets, error } = await supabaseAdmin.rpc('mark_order_paid_by_intent', {
         p_payment_intent_id: paymentIntentId,
      })

      if (tickets && tickets.length > 0) {
        const { data: orderInfo, error: orderInfoError } = await supabaseAdmin
            .from('orders')
            .select('customer_email, customer_name, events(title, venue, event_date, event_time)')
            .eq('id', tickets[0].order_id)
            .single()

         if (orderInfoError) console.error('[webhook] orderInfo fetch error:', orderInfoError)

         if (orderInfo?.events) {
            const eventInfo = Array.isArray(orderInfo.events) ? orderInfo.events[0] : orderInfo.events
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
   }

   return NextResponse.json({ received: true })
}