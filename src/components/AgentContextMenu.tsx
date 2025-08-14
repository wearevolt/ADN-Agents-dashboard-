"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Edit2,
  Trash2,
  MoreHorizontal,
  Users,
  UserMinus,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface AgentContextMenuProps {
  onEdit: () => void;
  onDelete: () => void;
  onInfo?: () => void;
  isCustomAgent?: boolean; // Новый пропс для определения типа агента
  onToggleTeam?: () => void; // Новый пропс для добавления/удаления из team
  isInTeam?: boolean; // Есть ли агент в team agents
  showTeamToggle?: boolean; // Показывать ли опцию team toggle
  isTeamTab?: boolean; // Находимся ли на вкладке Team agents
  showRemove?: boolean; // Показывать ли "Remove" вместо "Delete"
  canDelete?: boolean; // Может ли пользователь удалить агента
}

export const AgentContextMenu = ({
  onEdit,
  onDelete,
  onInfo,
  isCustomAgent = false,
  onToggleTeam,
  isInTeam = false,
  showTeamToggle = false,
  isTeamTab = false,
  showRemove = false,
  canDelete = true,
}: AgentContextMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit();
    setIsOpen(false);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
    setIsOpen(false);
  };

  const handleInfo = (e: React.MouseEvent) => {
    e.stopPropagation();
    onInfo?.();
    setIsOpen(false);
  };

  const handleToggleTeam = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleTeam?.();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <Button
        variant="ghost"
        size="icon"
        className={`h-6 w-6 transition-all duration-200 hover:bg-gray-200 ${
          isVisible ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
        onClick={handleMenuToggle}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        <MoreHorizontal className="h-4 w-4 text-gray-600" />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-8 z-50 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1"
          >
            {/* Показываем Edit только для пользовательских агентов */}
            {isCustomAgent && (
              <button
                onClick={handleEdit}
                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
              >
                <Edit2 className="h-4 w-4" />
                <span>Edit</span>
              </button>
            )}

            {/* Показываем Info для всех агентов */}
            {onInfo && (
              <button
                onClick={handleInfo}
                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
              >
                <Info className="h-4 w-4" />
                <span>Info</span>
              </button>
            )}

            {/* Показываем Team toggle только если showTeamToggle = true */}
            {showTeamToggle && (
              <button
                onClick={handleToggleTeam}
                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
              >
                {isInTeam ? (
                  <UserMinus className="h-4 w-4" />
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="currentColor"
                    viewBox="0 0 256 256"
                    className="h-4 w-4"
                  >
                    <path
                      d="M136,108A52,52,0,1,1,84,56,52,52,0,0,1,136,108Z"
                      opacity="0.2"
                    ></path>
                    <path d="M117.25,157.92a60,60,0,1,0-66.5,0A95.83,95.83,0,0,0,3.53,195.63a8,8,0,1,0,13.4,8.74,80,80,0,0,1,134.14,0,8,8,0,0,0,13.4-8.74A95.83,95.83,0,0,0,117.25,157.92ZM40,108a44,44,0,1,1,44,44A44.05,44.05,0,0,1,40,108Zm210.14,98.7a8,8,0,0,1-11.07-2.33A79.83,79.83,0,0,0,172,168a8,8,0,0,1,0-16,44,44,0,1,0-16.34-84.87,8,8,0,1,1-5.94-14.85,60,60,0,0,1,55.53,105.64,95.83,95.83,0,0,1,47.22,37.71A8,8,0,0,1,250.14,206.7Z"></path>
                  </svg>
                )}
                <span>{isInTeam ? "Remove from Team" : "Add to Team"}</span>
              </button>
            )}

            <button
              onClick={handleDelete}
              className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
            >
              <Trash2 className="h-4 w-4" />
              <span>
                {isTeamTab
                  ? "Remove from Team"
                  : showRemove
                    ? "Remove"
                    : canDelete
                      ? "Delete"
                      : "Remove"}
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
