// Suggested location: app/api/webhooks/paymongo/route.ts
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

// Service-role client — bypasses RLS entirely. Only ever used here, never
// in code reachable from the browser.
const supabaseAdmin = createClient(
   process.env.NEXT_PUBLIC_SUPABASE_URL!,
   process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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
      const { error } = await supabaseAdmin.rpc('mark_order_paid_by_intent', { p_payment_intent_id: paymentIntentId })
      console.log('[webhook] mark_order_paid_by_intent error:', error)
      // Next step: fetch the created tickets and email them to the customer
   } else if (eventType === 'payment.failed') {
      const { error } = await supabaseAdmin.rpc('release_order_hold_by_intent', { p_payment_intent_id: paymentIntentId })
      console.log('[webhook] release_order_hold_by_intent error:', error)
   }

   // Always 200, even for event types we don't handle — a non-2xx makes
   // PayMongo retry, which just piles up noise for events we're ignoring on purpose.
   return NextResponse.json({ received: true })
}