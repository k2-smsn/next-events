'use server'

import { createClient } from '@/lib/supabase/server'

export type TicketScanResult =
   | {
        ok: true
        reason: 'redeemed'
        ticket: {
           id: string
           ticket_code: string
           status: string
           redeemed_at: string
           event_title: string | null
           ticket_type_name: string | null
           customer_name: string | null
        }
     }
   | {
        ok: false
        reason:
           | 'not_authenticated'
           | 'invalid_code'
           | 'not_found'
           | 'wrong_event'
           | 'already_redeemed'
           | 'void'
           | 'invalid'
        ticket?: {
           id: string
           ticket_code: string
           status: string
           redeemed_at: string | null
           event_title: string | null
           ticket_type_name: string | null
           customer_name: string | null
        }
     }

export async function redeemTicket(
   eventId: string,
   ticketCode: string,
): Promise<TicketScanResult> {
   const supabase = await createClient()

   const { data: user } = await supabase.auth.getUser()

   if (!user.user) {
      return { ok: false, reason: 'not_authenticated' }
   }

   const { data, error } = await supabase.rpc('redeem_ticket', {
      p_ticket_code: ticketCode,
      p_event_id: eventId,
   })

   if (error) {
      console.error('[tickets] redeem_ticket RPC failed:', error)
      return { ok: false, reason: 'invalid' }
   }

   return data as TicketScanResult
}
