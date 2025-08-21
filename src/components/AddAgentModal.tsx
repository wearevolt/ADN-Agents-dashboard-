"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { AgentTag } from "./Dashboard";
import { useUserRoles } from "@/hooks/useUserRoles";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

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
  isLibraryAgent?: boolean;
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
  // RBAC: fetch roles to determine admin access
  const { isAdmin } = useUserRoles();

  // Deprecated in new model (kept for compatibility with parent handlers)
  const [isPrivate, setIsPrivate] = useState(true);
  const [selectedTags, setSelectedTags] = useState<AgentTag[]>([]);
  // New form state (mapped to old handlers on submit for compatibility)
  const [toolType, setToolType] = useState<"HARD_CODED" | "N8N" | "DUST">("HARD_CODED");
  const [explicitName, setExplicitName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isEnabled, setIsEnabled] = useState(true);
  const [description, setDescription] = useState("");

  // N8N specific
  const [n8nExternalUrl, setN8nExternalUrl] = useState("");
  const [n8nSecurityKeyId, setN8nSecurityKeyId] = useState<string>("");
  const [n8nReturnDirect, setN8nReturnDirect] = useState(false);
  const [n8nIsIsolated, setN8nIsIsolated] = useState(false);
  const [n8nStreamIfSingle, setN8nStreamIfSingle] = useState(false);
  const [n8nFlashAnswerNeeded, setN8nFlashAnswerNeeded] = useState(false);
  const [n8nTimeoutSeconds, setN8nTimeoutSeconds] = useState<number>(30);

  // Dust specific
  const [dustWorkspaceSid, setDustWorkspaceSid] = useState("");
  const [dustAgentSid, setDustAgentSid] = useState("");
  const [dustSecurityKeyId, setDustSecurityKeyId] = useState<string>("");
  const [dustReturnDirect, setDustReturnDirect] = useState(false);
  const [dustIsIsolated, setDustIsIsolated] = useState(false);
  const [dustStreamIfSingle, setDustStreamIfSingle] = useState(false);
  const [dustApiTimeout, setDustApiTimeout] = useState<number>(30);
  const [dustMsgEventsTimeout, setDustMsgEventsTimeout] = useState<number>(180);
  const [dustConvEventsTimeout, setDustConvEventsTimeout] = useState<number>(30);

  // Security Keys for admin (N8N/DUST)
  const [securityKeys, setSecurityKeys] = useState<{ id: string; system_name: string }[]>([]);
  const [securityKeysLoading, setSecurityKeysLoading] = useState(false);

  // Legacy fields preserved for compatibility with parent props
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
        const baseName = editingAgent.name.startsWith("@") ? editingAgent.name.slice(1) : editingAgent.name;
        setExplicitName(baseName);
        setDisplayName(baseName);
        setDescription(editingAgent.description || "");
        setFormData({
          name: baseName,
          apiKey: editingAgent.apiKey || "",
          agentUrl: editingAgent.agentUrl || "",
          webhookUrl: editingAgent.webhookUrl || "https://link_id1234.webhook.com",
          description: editingAgent.description || "",
        });
      } else {
        setIsPrivate(true);
        setSelectedTags([]);
        setToolType(isAdmin ? "HARD_CODED" : "HARD_CODED");
        setExplicitName("");
        setDisplayName("");
        setIsEnabled(true);
        setDescription("");
        // Reset type-specific fields
        setN8nExternalUrl("");
        setN8nSecurityKeyId("");
        setN8nReturnDirect(false);
        setN8nIsIsolated(false);
        setN8nStreamIfSingle(false);
        setN8nFlashAnswerNeeded(false);
        setN8nTimeoutSeconds(30);
        setDustWorkspaceSid("");
        setDustAgentSid("");
        setDustSecurityKeyId("");
        setDustReturnDirect(false);
        setDustIsIsolated(false);
        setDustStreamIfSingle(false);
        setDustApiTimeout(30);
        setDustMsgEventsTimeout(180);
        setDustConvEventsTimeout(30);
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

  // Load security keys for admin when needed
  useEffect(() => {
    if (!isAdmin) return;
    if (!(toolType === "N8N" || toolType === "DUST")) return;
    let cancelled = false;
    (async () => {
      try {
        setSecurityKeysLoading(true);
        const res = await fetch("/api/tools/security-keys", { cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        const list = (await res.json()) as { id: string; system_name: string }[];
        if (!cancelled) setSecurityKeys(list || []);
      } catch {
        if (!cancelled) setSecurityKeys([]);
      } finally {
        if (!cancelled) setSecurityKeysLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAdmin, toolType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Basic validation for new fields
    if (!explicitName.trim() || !displayName.trim()) return;

    const nameWithAt = explicitName.startsWith("@") ? explicitName : `@${explicitName}`;

    // Map new-form data to legacy handler shape for compatibility with current Dashboard
    const mapped = {
      name: nameWithAt,
      apiKey: "", // not used anymore
      agentUrl: toolType === "N8N" ? n8nExternalUrl : "",
      webhookUrl: formData.webhookUrl,
      description: description,
      isPrivate: true, // Private/Tags removed in MVP, keep default for parent expectations
      tags: [] as AgentTag[],
    };

      if (isEditing && editingAgent && onUpdateAgent) {
      onUpdateAgent(editingAgent.id, mapped);
      } else {
      onAddAgent(mapped);
      }
      // Don't reset form data or close modal here - parent component handles it
  };

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(formData.webhookUrl);
  };

  // Clipboard helpers no longer required for API key / Agent URL in hardcoded

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
                {isEditing ? "Edit tool" : "Create new tool"}
              </h2>
              <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-gray-100">
                <X className="h-4 w-4 text-gray-600" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Tool type (ADMIN only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tool type</label>
                {isAdmin ? (
                  <Select value={toolType} onValueChange={(v) => setToolType(v as any)}>
                    <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                      <SelectValue placeholder="Select tool type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HARD_CODED">Hardcoded</SelectItem>
                      <SelectItem value="N8N">N8N</SelectItem>
                      <SelectItem value="DUST">DUST</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="text-sm text-gray-600">Hardcoded</div>
                )}
              </div>

              {/* Explicit name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Explicit name *</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-900 font-medium">
                    @
                  </div>
                  <Input
                    value={explicitName}
                    onChange={(e) => setExplicitName(e.target.value)}
                    placeholder="explicit_call_name"
                    className="bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-gray-400 pl-8"
                    required
                  />
                </div>
              </div>

              {/* Display name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display name *</label>
                  <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Readable name"
                  className="bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-gray-400"
                    required
                />
              </div>

              {/* Enable switch */}
              <div className="flex items-center">
                <label className="block text-sm font-medium text-gray-700 mb-1 mr-2">Enabled</label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isEnabled}
                    onChange={(e) => setIsEnabled(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-11 h-6 rounded-full transition-colors flex items-center ${isEnabled ? "bg-blue-600" : "bg-gray-200"}`}>
                    <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${isEnabled ? "translate-x-5" : "translate-x-0.5"}`}></div>
                </div>
                </label>
              </div>

              {/* N8N Specific (ADMIN) */}
              {toolType === "N8N" && (
                <div className="space-y-4">
              <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">External URL *</label>
                  <Input
                      value={n8nExternalUrl}
                      onChange={(e) => setN8nExternalUrl(e.target.value)}
                      placeholder="https://..."
                      className="bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-gray-400"
                    required
                  />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Security Key *</label>
                    <Select value={n8nSecurityKeyId} onValueChange={setN8nSecurityKeyId}>
                      <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                        <SelectValue placeholder={securityKeysLoading ? "Loading..." : "Select key"} />
                      </SelectTrigger>
                      <SelectContent>
                        {securityKeys.map((k) => (
                          <SelectItem key={k.id} value={k.id}>{k.system_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input type="checkbox" checked={n8nReturnDirect} onChange={(e) => setN8nReturnDirect(e.target.checked)} />
                      Return direct
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input type="checkbox" checked={n8nIsIsolated} onChange={(e) => setN8nIsIsolated(e.target.checked)} />
                      Is isolated
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input type="checkbox" checked={n8nStreamIfSingle} onChange={(e) => setN8nStreamIfSingle(e.target.checked)} />
                      Stream if single tool
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input type="checkbox" checked={n8nFlashAnswerNeeded} onChange={(e) => setN8nFlashAnswerNeeded(e.target.checked)} />
                      Flash answer needed
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Timeout seconds</label>
                    <Input
                      value={String(n8nTimeoutSeconds)}
                      onChange={(e) => setN8nTimeoutSeconds(Number(e.target.value || 0))}
                      type="number"
                      min={1}
                      className="bg-white border-gray-300 text-gray-900 focus:border-gray-400"
                    />
                  </div>
                </div>
              )}

              {/* DUST Specific (ADMIN) */}
              {toolType === "DUST" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dust workspace SID *</label>
                    <Input
                      value={dustWorkspaceSid}
                      onChange={(e) => setDustWorkspaceSid(e.target.value)}
                      placeholder="workspace_sid"
                      className="bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-gray-400"
                      required
                    />
              </div>
              <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dust agent SID *</label>
                  <Input
                      value={dustAgentSid}
                      onChange={(e) => setDustAgentSid(e.target.value)}
                      placeholder="agent_sid"
                      className="bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-gray-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Security Key *</nlabel>
                    <Select value={dustSecurityKeyId} onValueChange={setDustSecurityKeyId}>
                      <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                        <SelectValue placeholder={securityKeysLoading ? "Loading..." : "Select key"} />
                      </SelectTrigger>
                      <SelectContent>
                        {securityKeys.map((k) => (
                          <SelectItem key={k.id} value={k.id}>{k.system_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input type="checkbox" checked={dustReturnDirect} onChange={(e) => setDustReturnDirect(e.target.checked)} />
                      Return direct
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input type="checkbox" checked={dustIsIsolated} onChange={(e) => setDustIsIsolated(e.target.checked)} />
                      Is isolated
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input type="checkbox" checked={dustStreamIfSingle} onChange={(e) => setDustStreamIfSingle(e.target.checked)} />
                      Stream if single tool
                    </label>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">API timeout (s)</label>
                      <Input type="number" min={1} value={String(dustApiTimeout)} onChange={(e) => setDustApiTimeout(Number(e.target.value || 0))} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Message events (s)</label>
                      <Input type="number" min={1} value={String(dustMsgEventsTimeout)} onChange={(e) => setDustMsgEventsTimeout(Number(e.target.value || 0))} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Conversation events (s)</label>
                      <Input type="number" min={1} value={String(dustConvEventsTimeout)} onChange={(e) => setDustConvEventsTimeout(Number(e.target.value || 0))} />
                    </div>
                  </div>
                </div>
              )}

              {/* Description (Hardcoded + others) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add description"
                  rows={3}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-gray-900 placeholder-gray-500"
                />
              </div>

              {/* Tags (hidden for MVP) */}

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
                  {isEditing ? "Save" : "Create Tool"}
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
