import Link from 'next/link'
import type { ReactNode } from 'react'

type Props = {
  href: string
  children: ReactNode
}

export default function BackButton({ href, children }: Props) {
  return (
    <Link href={href} className="back-button">
      <span aria-hidden="true">←</span>
      <span>{children}</span>
    </Link>
  )
}
