// Suggested location: lib/tickets.ts
import QRCode from 'qrcode'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

type Ticket = { id: string; ticket_code: string }
type EmailContext = {
   customerEmail: string
   customerName: string | null
   eventTitle: string
   venue: string
   eventDate: string
   eventTime: string
}

export async function sendTicketEmail(tickets: Ticket[], ctx: EmailContext) {
   // Each QR encodes just the raw ticket_code — the door-scan flow (built
   // later) looks this up directly against the tickets table.
   const attachments = await Promise.all(
      tickets.map(async (ticket, i) => ({
         filename: `ticket-${i + 1}.png`,
         content: await QRCode.toBuffer(ticket.ticket_code, { width: 300 }),
         content_id: `ticket-qr-${i}`, // referenced via cid: below
      }))
   )

   const ticketBlocks = tickets
      .map((_, i) => `<p>Ticket ${i + 1}<br/><img src="cid:ticket-qr-${i}" width="200" /></p>`)
      .join('')

   await resend.emails.send({
      from: 'Tickets <onboarding@resend.dev>', // swap once your domain is verified
      to: [ctx.customerEmail],
      subject: `Your ticket${tickets.length > 1 ? 's' : ''} for ${ctx.eventTitle}`,
      html: `
         <p>Hi ${ctx.customerName ?? 'there'},</p>
         <p>Here ${tickets.length > 1 ? 'are your tickets' : 'is your ticket'} for <strong>${ctx.eventTitle}</strong>.</p>
         <p>${ctx.venue} — ${ctx.eventDate} at ${ctx.eventTime}</p>
         ${ticketBlocks}
         <p>Show this QR code at the door. Each code is single-use.</p>
      `,
      attachments,
   })
}