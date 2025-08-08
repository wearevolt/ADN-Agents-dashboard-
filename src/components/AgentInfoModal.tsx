'use client'

import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { motion, AnimatePresence } from 'framer-motion'
import { AgentTag } from './Dashboard'

interface Agent {
  id: string
  name: string
  type: 'personal' | 'team'
  description?: string
  status: 'active' | 'error'
  errorMessage?: string
  items?: string[]
  updatedTime?: string
  isCustom?: boolean
  apiKey?: string
  agentUrl?: string
  webhookUrl?: string
  createdBy?: string
  tags?: AgentTag[]
}

interface AgentInfoModalProps {
  isOpen: boolean
  onClose: () => void
  agent: Agent | null
}

export const AgentInfoModal = ({ isOpen, onClose, agent }: AgentInfoModalProps) => {
  if (!agent) return null

  // Функция для получения имени создателя
  const getCreatorName = (email?: string) => {
    if (!email) return 'Unknown'
    
    // Извлекаем имя из email (до @)
    const name = email.split('@')[0]
    
    // Преобразуем в формат "First Last" (если есть точка или подчеркивание)
    const formattedName = name
      .replace(/[._]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
    
    return formattedName
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-lg p-6 w-full max-w-md border border-gray-200 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Agent Info
              </h2>
              <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-gray-100">
                <X className="h-4 w-4 text-gray-600" />
              </Button>
            </div>

            <div className="space-y-4">
              {/* Agent Name */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-1">Agent Name</h3>
                <p className="text-gray-900 text-sm">{agent.name}</p>
              </div>

              {/* Created By */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-1">Created by</h3>
                <p className="text-gray-900 text-sm">{getCreatorName(agent.createdBy)}</p>
              </div>

              {/* Description */}
              {agent.description && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-1">Description</h3>
                  <p className="text-gray-900 text-sm break-words whitespace-pre-wrap">{agent.description}</p>
                </div>
              )}

              {/* Tags */}
              {agent.tags && agent.tags.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-1">
                    {agent.tags.map(tag => (
                      <Badge 
                        key={tag}
                        variant="secondary" 
                        className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 border-0"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
} 