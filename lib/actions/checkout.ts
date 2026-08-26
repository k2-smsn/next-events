'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createPaymentIntent, createPaymentMethod, attachPaymentMethod } from '@/lib/paymongo'

const ALLOWED_METHODS = ['gcash', 'grab_pay', 'paymaya']

type OrderRow = {
   id: string
   event_id: string
   ticket_type_id: string
   customer_email: string
   customer_name: string | null
   quantity: number
   total_amount: number
   status: string
   paymongo_payment_intent_id: string | null
   paymongo_checkout_url: string | null
   expires_at: string
   created_at: string
   paid_at: string | null
}

export async function checkout(formData: FormData) {
   const eventId = formData.get('event_id') as string
   const ticketTypeId = formData.get('ticket_type_id') as string
   const quantity = Number(formData.get('quantity'))
   const customerEmail = formData.get('email') as string
   const customerName = formData.get('name') as string
   const customerPhone = formData.get('phone') as string
   const paymentMethod = formData.get('payment_method') as string

   if (!ALLOWED_METHODS.includes(paymentMethod)) throw new Error('Unsupported payment method')

   const supabase = await createClient()

   // Step 1: atomically hold the seats (reserve_tickets from earlier)
   const { data: order, error: reserveError } = await supabase
      .rpc('reserve_tickets', {
         p_ticket_type_id: ticketTypeId,
         p_quantity: quantity,
         p_customer_email: customerEmail,
         p_customer_name: customerName,
      })
      .single<OrderRow>()

   if (reserveError || !order) {
      const msg = reserveError?.message.includes('sold_out')
         ? 'sold_out'
         : 'reserve_failed'
      redirect(`/events/${eventId}?error=${msg}`)
   }

   const returnUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/${order.id}/return`

   // NOTE: redirect() throws internally to interrupt execution — it must
   // NOT be called inside this try block, or our own catch would treat a
   // successful redirect as a failure and wrongly release the seat hold.
   let checkoutUrl: string | undefined

   try {
      const intent = await createPaymentIntent(order.total_amount, `Order ${order.id}`, paymentMethod)
      const pm = await createPaymentMethod(paymentMethod, {
         name: customerName,
         email: customerEmail,
         phone: customerPhone,
      })
      const attached = await attachPaymentMethod(intent.id, pm.id, intent.attributes.client_key, returnUrl)

      checkoutUrl = attached.attributes.next_action?.redirect?.url
      if (!checkoutUrl) throw new Error('No redirect URL returned from PayMongo')

      const { error: linkError } = await supabase.rpc('set_order_payment_intent', {
         p_order_id: order.id,
         p_payment_intent_id: intent.id,
         p_checkout_url: checkoutUrl,
      })
      if (linkError) throw linkError
   } catch (err) {
      // PayMongo failed after we already held the seat — give it back.
      await supabase.rpc('release_order_hold', { p_order_id: order.id })
      console.error('checkout failed:', err)
      redirect(`/events/${eventId}?error=payment_setup_failed`)
   }

   redirect(checkoutUrl!)
}