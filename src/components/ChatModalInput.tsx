"use client";
import { useState } from "react";
import { toast } from "sonner";
import { TextArea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { usePlaygroundStore } from "@/store";
import useAIChatStreamHandler from "@/hooks/useAIStreamHandler";
import { useQueryState } from "nuqs";
import Icon from "@/components/ui/icon";

const ChatModalInput = () => {
  const { chatInputRef } = usePlaygroundStore();

  const { handleStreamResponse } = useAIChatStreamHandler();
  const [selectedAgent] = useQueryState("agent");
  const [inputMessage, setInputMessage] = useState("");
  const isStreaming = usePlaygroundStore((state) => state.isStreaming);
  const handleSubmit = async () => {
    if (!inputMessage.trim()) return;

    const currentMessage = inputMessage;
    setInputMessage("");

    try {
      await handleStreamResponse(currentMessage);
    } catch (error) {
      toast.error(
        `Error in handleSubmit: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  };

  return (
    <div className="relative mx-auto mb-1 flex w-full max-w-2xl items-end justify-center gap-x-2 font-geist">
      <TextArea
        placeholder={"Ask anything"}
        value={inputMessage}
        onChange={(e) => setInputMessage(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.nativeEvent.isComposing && !e.shiftKey && !isStreaming) {
            e.preventDefault();
            handleSubmit();
          }
        }}
        className="w-full border border-gray-300 bg-white px-4 text-sm focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
        style={{ color: "#111827" }}
        disabled={!selectedAgent}
        ref={chatInputRef}
      />
      <Button
        onClick={handleSubmit}
        disabled={!selectedAgent || !inputMessage.trim() || isStreaming}
        size="icon"
        className="rounded-xl bg-gray-900 p-5 text-white hover:bg-gray-800"
      >
        <Icon type="send" className="text-white" />
      </Button>
    </div>
  );
};

export default ChatModalInput;
