'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { error } from 'console'

export async function createEvent(formData: FormData) {
   const supabase = await createClient()

   const { data: event, error: eventError } = await supabase
      .from('events')
      .insert({
         title: formData.get('title') as string,
         description: formData.get('description') as string,
         venue: formData.get('venue') as string,
         event_date: formData.get('event_date') as string,
         event_time: formData.get('event_time') as string,
         banner_image_url: (formData.get('banner_image_url') as string) || null,
      })
      .select()
      .single()

   if (eventError || !event) {console.log(eventError); redirect('/admin/events/new?error=create_failed')}

   const quantity = Number(formData.get('total_quantity'))

   const { error: ticketError } = await supabase.from('ticket_types').insert({
      event_id: event.id,
      name: (formData.get('ticket_name') as string) || 'General Admission',
      price: Number(formData.get('price')),
      total_quantity: quantity,
      remaining_quantity: quantity,
   })

   if (ticketError) redirect(`/admin/events/${event.id}?warning=ticket_type_failed`)

   revalidatePath('/admin')
   redirect(`/admin/events/${event.id}`)
}

export async function updateEvent(eventId: string, formData: FormData) {
   const supabase = await createClient()

   const { error } = await supabase
      .from('events')
      .update({
         title: formData.get('title') as string,
         description: formData.get('description') as string,
         venue: formData.get('venue') as string,
         event_date: formData.get('event_date') as string,
         event_time: formData.get('event_time') as string,
         banner_image_url: (formData.get('banner_image_url') as string) || null,
      })
      .eq('id', eventId)

   if (error) redirect(`/admin/events/${eventId}?error=update_failed`)

   revalidatePath('/admin')
   revalidatePath(`/admin/events/${eventId}`)
   redirect(`/admin/events/${eventId}?success=updated`)
}

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
   draft: ['published', 'cancelled'],
   published: ['completed', 'cancelled'],
   completed: [],
   cancelled: [],
}

export async function setEventStatus(eventId: string, currentStatus: string, newStatus: string) {
   if (!ALLOWED_TRANSITIONS[currentStatus]?.includes(newStatus)) {
      throw new Error(`Cannot change status from ${currentStatus} to ${newStatus}`)
   }

   const supabase = await createClient()
   const { error } = await supabase.from('events').update({ status: newStatus }).eq('id', eventId)
   if (error) throw error

   revalidatePath('/admin')
   revalidatePath(`/admin/events/${eventId}`)
}

export async function deleteEvent(eventId: string, status: string) {
   // Draft only — published events have real customer history, cancel instead
   if (status !== 'draft') throw new Error('Only draft events can be deleted.')

   const supabase = await createClient()
   const { error } = await supabase.from('events').delete().eq('id', eventId)
   if (error) throw error

   revalidatePath('/admin')
   redirect('/admin')
}

export async function addTicketType(eventId: string, formData: FormData) {
   const supabase = await createClient()
   const quantity = Number(formData.get('total_quantity'))

   const { error } = await supabase.from('ticket_types').insert({
      event_id: eventId,
      name: formData.get('name') as string,
      price: Number(formData.get('price')),
      total_quantity: quantity,
      remaining_quantity: quantity,
   })
   if (error) throw error

   revalidatePath(`/admin/events/${eventId}`)
}

export async function deleteTicketType(eventId: string, ticketTypeId: string) {
   const supabase = await createClient()
   const { error } = await supabase.from('ticket_types').delete().eq('id', ticketTypeId)
   if (error) throw error

   revalidatePath(`/admin/events/${eventId}`)
}