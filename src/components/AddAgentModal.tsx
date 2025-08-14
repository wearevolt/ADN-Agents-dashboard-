"use client";

import { useState, useEffect } from "react";
import { X, Copy, Clipboard, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { AgentTag, AVAILABLE_TAGS } from "./Dashboard";

interface Agent {
  id: string;
  name: string;
  type: "personal" | "team";
  description?: string;
  status: "active" | "error";
  errorMessage?: string;
  items?: string[];
  updatedTime?: string;
  isCustom?: boolean;
  apiKey?: string;
  agentUrl?: string;
  webhookUrl?: string;
  tags?: AgentTag[];
}

interface AddAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddAgent: (agent: {
    name: string;
    apiKey: string;
    agentUrl: string;
    webhookUrl: string;
    description: string;
    isPrivate: boolean;
    tags: AgentTag[];
  }) => void;
  onUpdateAgent?: (
    agentId: string,
    agent: {
      name: string;
      apiKey: string;
      agentUrl: string;
      webhookUrl: string;
      description: string;
      isPrivate: boolean;
      tags: AgentTag[];
    }
  ) => void;
  editingAgent?: Agent | null;
}

export const AddAgentModal = ({
  isOpen,
  onClose,
  onAddAgent,
  onUpdateAgent,
  editingAgent,
}: AddAgentModalProps) => {
  const isEditing = !!editingAgent;
  const [isPrivate, setIsPrivate] = useState(true);
  const [selectedTags, setSelectedTags] = useState<AgentTag[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    apiKey: "",
    agentUrl: "",
    webhookUrl: "https://link_id1234.webhook.com",
    description: "",
  });

  // Reset form when modal opens/closes or editingAgent changes
  useEffect(() => {
    console.log("AddAgentModal useEffect triggered:", {
      editingAgent,
      isOpen,
    });

    if (isOpen) {
      if (editingAgent) {
        // Определяем private status - если агент не находится в библиотеке команды, то он приватный
        const isAgentPrivate = editingAgent.type === "personal" && !editingAgent.isLibraryAgent;
        setIsPrivate(isAgentPrivate);
        setSelectedTags(editingAgent.tags || []);
        setFormData({
          name: editingAgent.name.startsWith("@") ? editingAgent.name.slice(1) : editingAgent.name,
          apiKey: editingAgent.apiKey || "", // Keep existing API key
          agentUrl: editingAgent.agentUrl || "",
          webhookUrl: editingAgent.webhookUrl || "https://link_id1234.webhook.com",
          description: editingAgent.description || "",
        });
      } else {
        setIsPrivate(true);
        setSelectedTags([]);
        setFormData({
          name: "",
          apiKey: "",
          agentUrl: "",
          webhookUrl: "https://link_id1234.webhook.com",
          description: "",
        });
      }
    }
  }, [editingAgent, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.apiKey && formData.agentUrl) {
      const nameWithAt = formData.name.startsWith("@") ? formData.name : `@${formData.name}`;
      if (isEditing && editingAgent && onUpdateAgent) {
        onUpdateAgent(editingAgent.id, {
          ...formData,
          name: nameWithAt,
          isPrivate,
          tags: selectedTags,
        });
      } else {
        onAddAgent({
          ...formData,
          name: nameWithAt,
          isPrivate,
          tags: selectedTags,
        });
      }
      // Don't reset form data or close modal here - parent component handles it
    }
  };

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(formData.webhookUrl);
  };

  const pasteApiKey = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setFormData({ ...formData, apiKey: text });
    } catch (err) {
      console.error("Failed to paste: ", err);
    }
  };

  const pasteAgentUrl = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setFormData({ ...formData, agentUrl: text });
    } catch (err) {
      console.error("Failed to paste: ", err);
    }
  };

  // Функции управления тегами
  const handleTagToggle = (tag: AgentTag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

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
                {isEditing ? "Edit agent" : "Create new agent"}
              </h2>
              <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-gray-100">
                <X className="h-4 w-4 text-gray-600" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Private Agent Toggle */}
              <div className="flex items-center">
                <label className="block text-sm font-medium text-gray-700 mb-1 mr-2">Private</label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPrivate}
                    onChange={(e) => setIsPrivate(e.target.checked)}
                    className="sr-only"
                  />
                  <div
                    className={`w-11 h-6 rounded-full transition-colors flex items-center ${isPrivate ? "bg-blue-600" : "bg-gray-200"}`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${isPrivate ? "translate-x-5" : "translate-x-0.5"}`}
                    ></div>
                  </div>
                </label>
              </div>

              {/* Agent Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Agent name *</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-900 font-medium">
                    @
                  </div>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Add name for agent"
                    className="bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-gray-400 pl-8"
                    required
                  />
                </div>
              </div>

              {/* API Key */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">API key *</label>
                <div className="relative">
                  <Input
                    value={formData.apiKey}
                    onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                    placeholder="Add API key"
                    className="pr-10 bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-gray-400"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 hover:bg-gray-100"
                    onClick={pasteApiKey}
                  >
                    <Clipboard className="h-3 w-3 text-gray-600" />
                  </Button>
                </div>
              </div>

              {/* Agent URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Agent URL *</label>
                <div className="relative">
                  <Input
                    value={formData.agentUrl}
                    onChange={(e) => setFormData({ ...formData, agentUrl: e.target.value })}
                    placeholder="Add Agent URL"
                    className="pr-10 bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-gray-400"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 hover:bg-gray-100"
                    onClick={pasteAgentUrl}
                  >
                    <Clipboard className="h-3 w-3 text-gray-600" />
                  </Button>
                </div>
              </div>

              {/* Webhook URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Webhook URL *
                </label>
                <div className="relative">
                  <Input
                    value={formData.webhookUrl}
                    onChange={(e) => setFormData({ ...formData, webhookUrl: e.target.value })}
                    className="pr-10 bg-gray-100 border-gray-300 text-gray-700 placeholder-gray-500 cursor-not-allowed"
                    readOnly
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 hover:bg-gray-100"
                    onClick={copyWebhookUrl}
                  >
                    <Copy className="h-3 w-3 text-gray-600" />
                  </Button>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Add agent description"
                  rows={3}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-gray-900 placeholder-gray-500"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags (optional)
                </label>

                {/* Available Tags */}
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_TAGS.map((tag) => (
                    <Button
                      key={tag}
                      type="button"
                      variant="outline"
                      size="sm"
                      className={`text-xs px-2 py-1 h-7 ${
                        selectedTags.includes(tag)
                          ? "bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100 hover:border-blue-400 hover:text-blue-700"
                          : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                      onClick={() => handleTagToggle(tag)}
                    >
                      {selectedTags.includes(tag) ? (
                        <>
                          <Check className="h-3 w-3 mr-1" />
                          {tag}
                        </>
                      ) : (
                        <>
                          <Plus className="h-3 w-3 mr-1" />
                          {tag}
                        </>
                      )}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 bg-white border-gray-300 text-gray-900 hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 bg-gray-900 hover:bg-gray-800 text-white">
                  {isEditing ? "Save" : "Create Agent"}
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
