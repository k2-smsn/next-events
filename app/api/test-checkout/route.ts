// TEMPORARY — delete once the real customer checkout form exists.
// Suggested location: app/api/test-checkout/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createPaymentIntent, createPaymentMethod, attachPaymentMethod } from '@/lib/paymongo'

type OrderRow = {
   id: string
   event_id: string
   ticket_type_id: string
   total_amount: number
}

export async function POST(req: NextRequest) {
   const body = await req.json()
   const { ticket_type_id, quantity, email, name, phone, payment_method } = body

   const supabase = await createClient()

   const { data: order, error: reserveError } = await supabase
      .rpc('reserve_tickets', {
         p_ticket_type_id: ticket_type_id,
         p_quantity: quantity,
         p_customer_email: email,
         p_customer_name: name,
      })
      .single<OrderRow>()

   if (reserveError || !order) {
      return NextResponse.json({ error: reserveError?.message ?? 'reserve_failed' }, { status: 400 })
   }

   const returnUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/${order.id}/return`

   try {
      const intent = await createPaymentIntent(order.total_amount, `Order ${order.id}`, payment_method)
      const pm = await createPaymentMethod(payment_method, { name, email, phone })
      const attached = await attachPaymentMethod(intent.id, pm.id, intent.attributes.client_key, returnUrl)

      const checkoutUrl = attached.attributes.next_action?.redirect?.url
      if (!checkoutUrl) throw new Error('No redirect URL returned from PayMongo')

      const { error: linkError } = await supabase.rpc('set_order_payment_intent', {
         p_order_id: order.id,
         p_payment_intent_id: intent.id,
         p_checkout_url: checkoutUrl,
      })
      if (linkError) throw linkError

      return NextResponse.json({ order_id: order.id, checkout_url: checkoutUrl })
   } catch (err) {
      await supabase.rpc('release_order_hold', { p_order_id: order.id })
      return NextResponse.json({ error: String(err) }, { status: 500 })
   }
}