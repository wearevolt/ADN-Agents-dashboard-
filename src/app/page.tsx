"use client";

import { useState, Suspense } from "react";
import Sidebar from "@/components/playground/Sidebar";
import Dashboard from "@/components/Dashboard";
import { ChatModal } from "@/components/ChatModal";
import LoginScreen from "@/components/LoginScreen";
import { initTagsRevalidateOnFocus, useTagsStore } from "@/store/tags";

interface User {
  name: string;
  email: string;
}

export default function Home() {
  const [showChatModal, setShowChatModal] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  // Initialize tags prefetch on app mount
  useState(() => {
    initTagsRevalidateOnFocus();
    useTagsStore.getState().fetchIfNeeded();
    return undefined;
  });

  const handleOpenChat = () => {
    setShowChatModal(true);
  };

  const handleCloseChat = () => {
    setShowChatModal(false);
  };

  const handleLogin = (userInfo: User) => {
    setUser(userInfo);
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <Suspense fallback={<div className="bg-white text-gray-900">Loading...</div>}>
      <div className="flex h-screen bg-gray-50">
        {/* <Sidebar initialCollapsed={true} /> */}
        <Dashboard onOpenChat={handleOpenChat} user={user} onLogout={handleLogout} />
        {/* <ChatModal isOpen={showChatModal} onClose={handleCloseChat} /> */}
      </div>
    </Suspense>
  );
}
