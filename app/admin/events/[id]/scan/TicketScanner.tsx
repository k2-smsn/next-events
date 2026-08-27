'use client'

import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import { redeemTicket, type TicketScanResult } from '@/lib/actions/tickets'

type Props = {
   eventId: string
}

export default function TicketScanner({ eventId }: Props) {
   const scannerRef = useRef<Html5Qrcode | null>(null)
   const scanningRef = useRef(false)
   const processingRef = useRef(false)

   const [running, setRunning] = useState(false)
   const [result, setResult] = useState<TicketScanResult | null>(null)
   const [error, setError] = useState<string | null>(null)

   const stopScanner = async () => {
      const scanner = scannerRef.current

      if (!scanner || !scanningRef.current) return

      try {
         await scanner.stop()
      } catch (err) {
         console.error('[scanner] stop failed:', err)
      } finally {
         scanningRef.current = false
         setRunning(false)
      }
   }

   const startScanner = async () => {
      setError(null)
      setResult(null)

      try {
         const scanner = new Html5Qrcode('ticket-qr-reader', {
            formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
            verbose: false,
         })

         scannerRef.current = scanner

         await scanner.start(
            { facingMode: 'environment' },
            {
               fps: 10,
               qrbox: { width: 250, height: 250 },
            },
            async (decodedText) => {
               // A scanner can detect the same QR several times before the
               // server response arrives. Ignore those duplicate callbacks.
               if (processingRef.current) return

               processingRef.current = true
               setResult(null)

               try {
                  const scanResult = await redeemTicket(eventId, decodedText.trim())
                  setResult(scanResult)

                  // Stop after a successful or meaningful scan so the admin
                  // can see the result instead of immediately scanning again.
                  await stopScanner()
               } finally {
                  processingRef.current = false
               }
            },
            () => {
               // QR detection failures are expected while the camera is
               // searching, so don't display them as errors.
            },
         )

         scanningRef.current = true
         setRunning(true)
      } catch (err) {
         console.error('[scanner] start failed:', err)
         setError(
            'Could not access the camera. Check the browser camera permission and make sure the site is running over HTTPS (or localhost).',
         )
      }
   }

   useEffect(() => {
      return () => {
         const scanner = scannerRef.current

         if (scanner && scanningRef.current) {
            scanner.stop().catch((err) => {
               console.error('[scanner] cleanup failed:', err)
            })
         }
      }
   }, [])

   const scanAgain = () => {
      setResult(null)
      setError(null)
      void startScanner()
   }

   const renderResult = () => {
      if (!result) return null

      if (result.ok) {
         return (
            <div className="rounded-2xl border border-green-200 bg-green-50 p-5 shadow-sm">
               <p className="text-lg font-semibold text-green-800">
                  ✓ Valid ticket
               </p>

               <div className="mt-4 space-y-1 text-sm">
                  <p>
                     <span className="font-medium">Customer:</span>{' '}
                     {result.ticket.customer_name ?? 'N/A'}
                  </p>
                  <p>
                     <span className="font-medium">Ticket:</span>{' '}
                     {result.ticket.ticket_type_name ?? 'N/A'}
                  </p>
                  <p>
                     <span className="font-medium">Event:</span>{' '}
                     {result.ticket.event_title ?? 'N/A'}
                  </p>
                  <p>
                     <span className="font-medium">Redeemed:</span>{' '}
                     {new Date(result.ticket.redeemed_at).toLocaleString()}
                  </p>
               </div>
            </div>
         )
      }

      const messages: Record<string, string> = {
         not_authenticated: 'You must be signed in as the admin.',
         invalid_code: 'The QR code did not contain a valid ticket code.',
         not_found: 'This ticket does not exist.',
         wrong_event: 'This ticket belongs to a different event.',
         already_redeemed: 'This ticket has already been redeemed.',
         void: 'This ticket has been voided.',
         invalid: 'This ticket could not be validated.',
      }

      return (
         <div className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">
            <p className="text-lg font-semibold text-red-800">
               ✕ {messages[result.reason] ?? 'Invalid ticket'}
            </p>

            {result.ticket && (
               <div className="mt-4 space-y-1 text-sm">
                  <p>
                     <span className="font-medium">Customer:</span>{' '}
                     {result.ticket.customer_name ?? 'N/A'}
                  </p>
                  <p>
                     <span className="font-medium">Ticket:</span>{' '}
                     {result.ticket.ticket_type_name ?? 'N/A'}
                  </p>

                  {result.ticket.redeemed_at && (
                     <p>
                        <span className="font-medium">Redeemed:</span>{' '}
                        {new Date(result.ticket.redeemed_at).toLocaleString()}
                     </p>
                  )}
               </div>
            )}
         </div>
      )
   }

   return (
      <div className="space-y-4">
         <div
            id="ticket-qr-reader"
            className="scanner-frame overflow-hidden rounded-2xl border border-gray-800 bg-black"
         />

         {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">
               {error}
            </div>
         )}

         {renderResult()}

         <div className="flex flex-col gap-3 sm:flex-row">
            {!running && !result && (
               <button
                  type="button"
                  onClick={() => void startScanner()}
                  className="button button-primary w-full sm:w-auto"
               >
                  Start Scanner
               </button>
            )}

            {running && (
               <button
                  type="button"
                  onClick={() => void stopScanner()}
                  className="button button-secondary w-full sm:w-auto"
               >
                  Stop Scanner
               </button>
            )}

            {result && (
               <button
                  type="button"
                  onClick={scanAgain}
                  className="button button-primary w-full sm:w-auto"
               >
                  Scan Another Ticket
               </button>
            )}
         </div>
      </div>
   )
}
