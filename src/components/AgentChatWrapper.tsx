'use client'

import dynamic from 'next/dynamic'

const AgentChat = dynamic(() => import('@/components/AgentChat'), { ssr: false })

export default function AgentChatWrapper() {
  return <AgentChat />
}