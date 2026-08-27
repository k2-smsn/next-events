'use client'

import { useEffect, useRef, useState } from 'react'
import SubmitButton from './SubmitButton'

type ServerAction = (formData: FormData) => void | Promise<void>

type Props = {
  action: ServerAction
  triggerLabel: string
  title: string
  description: string
  confirmLabel: string
  destructive?: boolean
  triggerClassName?: string
}

export default function ConfirmAction({
  action,
  triggerLabel,
  title,
  description,
  confirmLabel,
  destructive = false,
  triggerClassName,
}: Props) {
  const [open, setOpen] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('keydown', onKeyDown)
    dialogRef.current?.focus()

    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={triggerClassName ?? (destructive ? 'button button-danger' : 'button button-secondary')}
      >
        {triggerLabel}
      </button>

      {open && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setOpen(false)}>
          <div
            ref={dialogRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-action-title"
            className="modal"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="modal-icon" aria-hidden="true">
              {destructive ? '!' : '?'}
            </div>
            <h2 id="confirm-action-title" className="modal-title">
              {title}
            </h2>
            <p className="modal-description">{description}</p>

            <div className="modal-actions">
              <button type="button" className="button button-secondary" onClick={() => setOpen(false)}>
                Go Back
              </button>
              <form action={action}>
                <SubmitButton pendingLabel="Working..." className={`${destructive ? 'button button-danger' : 'button button-primary'} disabled:cursor-not-allowed disabled:opacity-60`}>
                  {confirmLabel}
                </SubmitButton>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
