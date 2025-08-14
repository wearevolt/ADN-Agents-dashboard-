"use client";

import { usePlaygroundStore } from "@/store";
import Messages from "./playground/ChatArea/Messages";
import ScrollToBottom from "@/components/playground/ChatArea/ScrollToBottom";
import { StickToBottom } from "use-stick-to-bottom";

const MessageModalArea = () => {
  const { messages } = usePlaygroundStore();

  return (
    <StickToBottom
      className="relative mb-4 flex max-h-full min-h-0 flex-grow flex-col bg-white"
      resize="smooth"
      initial="smooth"
    >
      <StickToBottom.Content className="flex min-h-full flex-col justify-center bg-white">
        <div className="mx-auto w-full max-w-2xl space-y-9 px-4 pb-4">
          <Messages messages={messages} />
        </div>
      </StickToBottom.Content>
      <ScrollToBottom />
    </StickToBottom>
  );
};

export default MessageModalArea;
