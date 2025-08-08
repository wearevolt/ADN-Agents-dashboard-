'use client'

import Sidebar from '@/components/playground/Sidebar'
import { ChatArea } from '@/components/playground/ChatArea'

export default function ChatModalArea() {
  return (
    <div className="flex h-full bg-white">
      <Sidebar initialCollapsed={false} />
      <ChatArea />
    </div>
  )
} 