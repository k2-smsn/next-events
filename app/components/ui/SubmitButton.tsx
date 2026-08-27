'use client'

import { useFormStatus } from 'react-dom'

type Props = {
  children: React.ReactNode
  pendingLabel?: string
  className?: string
}

export default function SubmitButton({ children, pendingLabel = 'Working...', className }: Props) {
  const { pending } = useFormStatus()

  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? pendingLabel : children}
    </button>
  )
}