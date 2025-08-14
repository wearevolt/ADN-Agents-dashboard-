"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import ChatModalArea from "@/components/ChatModalArea";
import { motion, AnimatePresence } from "framer-motion";

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChatModal = ({ isOpen, onClose }: ChatModalProps) => {
  // Предотвращаем скролл страницы когда модал открыт
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Закрытие по Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 bg-black bg-opacity-50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-white shadow-xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Кнопка закрытия */}
            <div className="absolute top-4 right-4 z-10">
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8 hover:bg-gray-100 text-gray-700 hover:text-gray-900"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Содержимое модала */}
            <div className="flex-1 overflow-hidden bg-white">
              <div
                className="h-full w-full bg-white text-gray-900 flex flex-col"
                style={
                  {
                    "--background": "255 255 255",
                    "--foreground": "9 9 11",
                    "--card": "255 255 255",
                    "--card-foreground": "9 9 11",
                    "--popover": "255 255 255",
                    "--popover-foreground": "9 9 11",
                    "--primary": "9 9 11",
                    "--primary-foreground": "250 250 250",
                    "--secondary": "244 244 245",
                    "--secondary-foreground": "9 9 11",
                    "--muted": "244 244 245",
                    "--muted-foreground": "113 113 122",
                    "--accent": "244 244 245",
                    "--accent-foreground": "9 9 11",
                    "--destructive": "239 68 68",
                    "--destructive-foreground": "250 250 250",
                    "--border": "228 228 231",
                    "--input": "228 228 231",
                    "--ring": "9 9 11",
                  } as React.CSSProperties
                }
              >
                <div className="flex-1 bg-white">
                  <ChatModalArea />
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
