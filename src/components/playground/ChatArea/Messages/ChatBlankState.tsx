'use client'

import React from 'react'

const ChatBlankState = () => {

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] px-4">
      {/* Пустое состояние без центрального инпута */}
      <div className="text-center">
        {/* Изображение над текстом */}
        <div className="mb-4">
          <img 
            src="/image.png" 
            alt="Chat interface icon"
            className="h-16 w-auto mx-auto"
          />
        </div>
        
        <p className="text-xl text-gray-800 font-medium">
          Here, a real chat interface will be connected
        </p>
      </div>
    </div>
  )
}

export default ChatBlankState
