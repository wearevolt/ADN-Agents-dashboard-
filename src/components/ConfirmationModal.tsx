'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface ConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'default'
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default'
}: ConfirmationModalProps) {
  if (!isOpen) return null

  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  const confirmButtonClass = variant === 'danger' 
    ? 'bg-red-600 hover:bg-red-700 text-white'
    : 'bg-gray-900 hover:bg-gray-800 text-white'

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4 bg-white border border-gray-200 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">{title}</CardTitle>
          <CardDescription className="text-gray-600">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="bg-white border-gray-300 text-gray-900 hover:bg-gray-50"
            >
              {cancelText}
            </Button>
            <Button
              className={confirmButtonClass}
              onClick={handleConfirm}
            >
              {confirmText}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 