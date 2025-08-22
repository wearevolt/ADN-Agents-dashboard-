"use client";

import { useState, useEffect } from "react";
import { X, Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { AgentTag } from "./Dashboard";
import { useUserRoles } from "@/hooks/useUserRoles";
import { useSecurityKeysStore } from "@/store/securityKeys";
import { useTagsStore } from "@/store/tags";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

interface Agent {
  id: string;
  name: string;
  displayName?: string;
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
    id: string;
    name: string;
    displayName: string;
    apiKey: string;
    agentUrl: string;
    webhookUrl: string;
    description: string;
    tags: AgentTag[];
  }) => void;
  onUpdateAgent?: (
    agentId: string,
    agent: {
      name: string;
      displayName: string;
      apiKey: string;
      agentUrl: string;
      webhookUrl: string;
      description: string;
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

  const [selectedTags, setSelectedTags] = useState<AgentTag[]>([]);
  const { tags: storeTags, fetchIfNeeded, forceRefresh } = useTagsStore();
  const [availableTags, setAvailableTags] = useState<{ id: string; name: string }[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const toggleTagId = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
    );
  };
  // New form state (mapped to old handlers on submit for compatibility)
  const [toolType, setToolType] = useState<"HARD_CODED" | "N8N" | "DUST">("HARD_CODED");
  const [explicitName, setExplicitName] = useState("");
  const [displayName, setDisplayName] = useState("");
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
  const { keys: securityKeys, loading: securityKeysLoading, fetchIfNeeded: fetchSecurityKeys } = useSecurityKeysStore();

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
        setSelectedTags(editingAgent.tags || []);
        const baseName = editingAgent.name.startsWith("@")
          ? editingAgent.name.slice(1)
          : editingAgent.name;
        setExplicitName(baseName);
        setDisplayName(editingAgent.displayName || baseName);
        setDescription(editingAgent.description || "");
        setFormData({
          name: baseName,
          apiKey: editingAgent.apiKey || "",
          agentUrl: editingAgent.agentUrl || "",
          webhookUrl: editingAgent.webhookUrl || "https://link_id1234.webhook.com",
          description: editingAgent.description || "",
        });
      } else {
        setSelectedTags([]);
        setSelectedTagIds([]);
        setToolType(isAdmin ? "HARD_CODED" : "HARD_CODED");
        setExplicitName("");
        setDisplayName("");
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
    fetchSecurityKeys();
  }, [isAdmin, toolType, fetchSecurityKeys]);

  // Load available tags via store
  useEffect(() => {
    fetchIfNeeded().then(() => setAvailableTags(storeTags as { id: string; name: string }[]));
  }, [storeTags, fetchIfNeeded]);

  // When editing, map existing tag names to ids once tags are available
  useEffect(() => {
    if (!editingAgent) return;
    if (!Array.isArray(editingAgent.tags)) return;
    if (!Array.isArray(availableTags) || availableTags.length === 0) return;
    const nameToId = new Map(availableTags.map((t) => [t.name, t.id]));
    const ids = (editingAgent.tags || [])
      .map((name) => nameToId.get(name))
      .filter((v): v is string => Boolean(v));
    setSelectedTagIds(ids);
  }, [editingAgent, availableTags]);

  // Ensure readable name is loaded from server when missing in editing context
  useEffect(() => {
    if (!isOpen || !editingAgent) return;
    if (editingAgent.displayName) return;
    (async () => {
      try {
        const res = await fetch(`/api/tools/registry/${editingAgent.id}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as {
          readableName?: string;
          toolType?: "HARD_CODED" | "N8N" | "DUST";
        };
        if (data?.readableName) setDisplayName(data.readableName);
        if (data?.toolType) setToolType(data.toolType);
      } catch {
        // noop
      }
    })();
  }, [isOpen, editingAgent]);

  const [errorText, setErrorText] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const mapApiErrorToMessage = (code?: string): string => {
    switch (code) {
      case "explicit_call_name_conflict":
        return "Explicit name is already taken";
      case "missing_fields":
        return "Please fill in all required fields";
      case "missing_profile_fields":
        return "Please fill in all required fields for selected tool type";
      case "invalid_tag_ids":
        return "Some selected tags are invalid";
      case "forbidden":
        return "Only administrators can create this tool type";
      case "create_failed":
        return "Failed to create tool. Please try again later";
      default:
        return "Unexpected error occurred";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorText(null);
    setFieldErrors({});

    const newFieldErrors: Record<string, string> = {};
    const explicit = explicitName.trim();
    const explicitNoAt = explicit.replace(/^@+/, "");
    if (!explicit) newFieldErrors.explicitName = "This field is required";
    if (/@/.test(explicit))
      newFieldErrors.explicitName = "Do not include @ (it's added automatically)";
    if (explicitNoAt && !/^[a-z0-9_-]+$/.test(explicitNoAt)) {
      newFieldErrors.explicitName = "Use lowercase letters, digits, dash or underscore";
    }
    if (!displayName.trim()) newFieldErrors.displayName = "This field is required";

    if (toolType === "N8N") {
      if (!n8nExternalUrl.trim()) newFieldErrors.n8nExternalUrl = "External URL is required";
      if (!n8nSecurityKeyId) newFieldErrors.n8nSecurityKeyId = "Security Key is required";
    }
    if (toolType === "DUST") {
      if (!dustWorkspaceSid.trim()) newFieldErrors.dustWorkspaceSid = "Workspace SID is required";
      if (!dustAgentSid.trim()) newFieldErrors.dustAgentSid = "Agent SID is required";
      if (!dustSecurityKeyId) newFieldErrors.dustSecurityKeyId = "Security Key is required";
    }

    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      setErrorText("Please fix the errors below");
      setSubmitting(false);
      return;
    }

    // RBAC preflight: prevent non-admin from selecting non-hardcoded types
    if (!isAdmin && toolType !== "HARD_CODED") {
      setErrorText("Only administrators can create this tool type");
      setFieldErrors((prev) => ({ ...prev, toolType: "Requires ADMIN role" }));
      setSubmitting(false);
      return;
    }

    if (isEditing && editingAgent && onUpdateAgent) {
      try {
        // Update registry (names + tags)
        const regRes = await fetch(`/api/tools/registry/${editingAgent.id}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            explicit_call_name: explicitName.trim(),
            readable_name: displayName.trim(),
            tag_ids: selectedTagIds,
          }),
        });
        if (regRes.status === 409) {
          setErrorText("Explicit name is already taken");
          setSubmitting(false);
          return;
        }
        if (!regRes.ok) {
          setErrorText("Failed to update tool");
          setSubmitting(false);
          return;
        }

        // Fetch tool type to decide if we should update hardcoded notes
        const regInfo = await fetch(`/api/tools/registry/${editingAgent.id}`, {
          cache: "no-store",
        });
        if (regInfo.ok) {
          const data = (await regInfo.json()) as { toolType?: string };
          if (data?.toolType === "HARD_CODED") {
            // Update notes for hardcoded profile
            await fetch(`/api/tools/hardcoded/${editingAgent.id}`, {
              method: "PATCH",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ notes: description || null }),
            });
          }
        }

        const nameWithAt = explicitName.startsWith("@") ? explicitName : `@${explicitName}`;
        const updatedTagNames = availableTags
          .filter((t) => selectedTagIds.includes(t.id))
          .map((t) => t.name as AgentTag);
        onUpdateAgent(editingAgent.id, {
          name: nameWithAt,
          displayName: displayName.trim(),
          apiKey: "",
          agentUrl: toolType === "N8N" ? n8nExternalUrl : "",
          webhookUrl: formData.webhookUrl,
          description,
          tags: updatedTagNames,
        });
      } catch {
        setErrorText("Network error");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    try {
      const profile =
        toolType === "HARD_CODED"
          ? { notes: description || undefined }
          : toolType === "N8N"
            ? {
                external_url: n8nExternalUrl.trim(),
                security_key_id: n8nSecurityKeyId,
                return_direct: n8nReturnDirect,
                is_isolated: n8nIsIsolated,
                stream_if_single_tool: n8nStreamIfSingle,
                flash_answer_needed: n8nFlashAnswerNeeded,
                timeout_seconds: n8nTimeoutSeconds,
              }
            : {
                dust_workspace_sid: dustWorkspaceSid.trim(),
                dust_agent_sid: dustAgentSid.trim(),
                security_key_id: dustSecurityKeyId,
                return_direct: dustReturnDirect,
                is_isolated: dustIsIsolated,
                stream_if_single_tool: dustStreamIfSingle,
                api_timeout_seconds: dustApiTimeout,
                message_events_timeout_seconds: dustMsgEventsTimeout,
                conversation_events_timeout_seconds: dustConvEventsTimeout,
              };

      const res = await fetch("/api/tools", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          explicit_call_name: explicitName.trim(),
          readable_name: displayName.trim(),
          tool_type: toolType,
          tag_ids: selectedTagIds,
          profile,
        }),
      });
      if (!res.ok) {
        let apiError: string | undefined;
        try {
          const data = (await res.json()) as { error?: string } | null;
          apiError = data?.error;
        } catch {
          apiError = undefined;
        }
        const message = mapApiErrorToMessage(apiError);
        if (res.status === 409 || apiError === "explicit_call_name_conflict") {
          setFieldErrors((prev) => ({ ...prev, explicitName: "Explicit name is already taken" }));
        }
        if (res.status === 403 || apiError === "forbidden") {
          setFieldErrors((prev) => ({
            ...prev,
            toolType: "Only administrators can create this tool type",
          }));
        }
        setErrorText(message);
        setSubmitting(false);
        return;
      }

      const json = (await res.json()) as { id: string };
      const nameWithAt = explicitName.startsWith("@") ? explicitName : `@${explicitName}`;
      onAddAgent({
        id: json.id,
        name: nameWithAt,
        displayName: displayName.trim(),
        apiKey: "",
        agentUrl: toolType === "N8N" ? n8nExternalUrl : "",
        webhookUrl: formData.webhookUrl,
        description,
        tags: availableTags
          .filter((t) => selectedTagIds.includes(t.id))
          .map((t) => t.name as AgentTag),
      });
    } catch {
      setErrorText("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  // Removed webhook copy (no longer shown in the form)

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
            className="bg-white rounded-lg p-6 w-full max-w-md border border-gray-200 shadow-lg max-h-[85vh] overflow-y-auto"
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
              {errorText && (
                <div className="text-sm bg-red-50 border border-red-200 text-red-700 rounded p-3">
                  {errorText}
                </div>
              )}
              {/* Tool type (ADMIN only, locked in edit mode) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tool type</label>
                {isEditing ? (
                  <div className="text-sm text-gray-600">
                    {toolType === "HARD_CODED" && "Hardcoded"}
                    {toolType === "N8N" && "N8N"}
                    {toolType === "DUST" && "DUST"}
                  </div>
                ) : isAdmin ? (
                  <Select value={toolType} onValueChange={(v) => setToolType(v as any)}>
                    <SelectTrigger
                      className={`bg-white text-gray-900 ${
                        fieldErrors.toolType
                          ? "border-red-500 focus:border-red-500"
                          : "border-gray-300"
                      }`}
                    >
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
                {fieldErrors.toolType && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.toolType}</p>
                )}
              </div>

              {/* Explicit name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Explicit name *
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-900 font-medium">
                    @
                  </div>
                  <Input
                    value={explicitName}
                    onChange={(e) => setExplicitName(e.target.value)}
                    placeholder="explicit_call_name"
                    className={`bg-white text-gray-900 placeholder-gray-500 pl-8 ${
                      fieldErrors.explicitName
                        ? "border-red-500 focus:border-red-500"
                        : "border-gray-300 focus:border-gray-400"
                    }`}
                    required
                  />
                </div>
                {fieldErrors.explicitName && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.explicitName}</p>
                )}
              </div>

              {/* Display name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display name *
                </label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Readable name"
                  className={`bg-white text-gray-900 placeholder-gray-500 ${
                    fieldErrors.displayName
                      ? "border-red-500 focus:border-red-500"
                      : "border-gray-300 focus:border-gray-400"
                  }`}
                  required
                />
                {fieldErrors.displayName && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.displayName}</p>
                )}
              </div>

              {/* Enabled removed per simplified schema */}

              {/* N8N Specific (ADMIN) */}
              {toolType === "N8N" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      External URL *
                    </label>
                    <Input
                      value={n8nExternalUrl}
                      onChange={(e) => setN8nExternalUrl(e.target.value)}
                      placeholder="https://..."
                      className={`bg-white text-gray-900 placeholder-gray-500 ${
                        fieldErrors.n8nExternalUrl
                          ? "border-red-500 focus:border-red-500"
                          : "border-gray-300 focus:border-gray-400"
                      }`}
                      required
                    />
                    {fieldErrors.n8nExternalUrl && (
                      <p className="mt-1 text-xs text-red-600">{fieldErrors.n8nExternalUrl}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Security Key *
                    </label>
                    <Select value={n8nSecurityKeyId} onValueChange={setN8nSecurityKeyId}>
                      <SelectTrigger
                        className={`bg-white text-gray-900 ${
                          fieldErrors.n8nSecurityKeyId
                            ? "border-red-500 focus:border-red-500"
                            : "border-gray-300"
                        }`}
                      >
                        <SelectValue
                          placeholder={securityKeysLoading ? "Loading..." : "Select key"}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {securityKeys.map((k) => (
                          <SelectItem key={k.id} value={k.id}>
                            {k.system_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldErrors.n8nSecurityKeyId && (
                      <p className="mt-1 text-xs text-red-600">{fieldErrors.n8nSecurityKeyId}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={n8nReturnDirect}
                        onChange={(e) => setN8nReturnDirect(e.target.checked)}
                      />
                      Return direct
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={n8nIsIsolated}
                        onChange={(e) => setN8nIsIsolated(e.target.checked)}
                      />
                      Is isolated
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={n8nStreamIfSingle}
                        onChange={(e) => setN8nStreamIfSingle(e.target.checked)}
                      />
                      Stream if single tool
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={n8nFlashAnswerNeeded}
                        onChange={(e) => setN8nFlashAnswerNeeded(e.target.checked)}
                      />
                      Flash answer needed
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Timeout seconds
                    </label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dust workspace SID *
                    </label>
                    <Input
                      value={dustWorkspaceSid}
                      onChange={(e) => setDustWorkspaceSid(e.target.value)}
                      placeholder="workspace_sid"
                      className={`bg-white text-gray-900 placeholder-gray-500 ${
                        fieldErrors.dustWorkspaceSid
                          ? "border-red-500 focus:border-red-500"
                          : "border-gray-300 focus:border-gray-400"
                      }`}
                      required
                    />
                    {fieldErrors.dustWorkspaceSid && (
                      <p className="mt-1 text-xs text-red-600">{fieldErrors.dustWorkspaceSid}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dust agent SID *
                    </label>
                    <Input
                      value={dustAgentSid}
                      onChange={(e) => setDustAgentSid(e.target.value)}
                      placeholder="agent_sid"
                      className={`bg-white text-gray-900 placeholder-gray-500 ${
                        fieldErrors.dustAgentSid
                          ? "border-red-500 focus:border-red-500"
                          : "border-gray-300 focus:border-gray-400"
                      }`}
                      required
                    />
                    {fieldErrors.dustAgentSid && (
                      <p className="mt-1 text-xs text-red-600">{fieldErrors.dustAgentSid}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Security Key *
                    </label>
                    <Select value={dustSecurityKeyId} onValueChange={setDustSecurityKeyId}>
                      <SelectTrigger
                        className={`bg-white text-gray-900 ${
                          fieldErrors.dustSecurityKeyId
                            ? "border-red-500 focus:border-red-500"
                            : "border-gray-300"
                        }`}
                      >
                        <SelectValue
                          placeholder={securityKeysLoading ? "Loading..." : "Select key"}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {securityKeys.map((k) => (
                          <SelectItem key={k.id} value={k.id}>
                            {k.system_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldErrors.dustSecurityKeyId && (
                      <p className="mt-1 text-xs text-red-600">{fieldErrors.dustSecurityKeyId}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={dustReturnDirect}
                        onChange={(e) => setDustReturnDirect(e.target.checked)}
                      />
                      Return direct
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={dustIsIsolated}
                        onChange={(e) => setDustIsIsolated(e.target.checked)}
                      />
                      Is isolated
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={dustStreamIfSingle}
                        onChange={(e) => setDustStreamIfSingle(e.target.checked)}
                      />
                      Stream if single tool
                    </label>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        API timeout (s)
                      </label>
                      <Input
                        type="number"
                        min={1}
                        value={String(dustApiTimeout)}
                        onChange={(e) => setDustApiTimeout(Number(e.target.value || 0))}
                        className="bg-white border-gray-300 text-gray-900 focus:border-gray-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Message events (s)
                      </label>
                      <Input
                        type="number"
                        min={1}
                        value={String(dustMsgEventsTimeout)}
                        onChange={(e) => setDustMsgEventsTimeout(Number(e.target.value || 0))}
                        className="bg-white border-gray-300 text-gray-900 focus:border-gray-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Conversation events (s)
                      </label>
                      <Input
                        type="number"
                        min={1}
                        value={String(dustConvEventsTimeout)}
                        onChange={(e) => setDustConvEventsTimeout(Number(e.target.value || 0))}
                        className="bg-white border-gray-300 text-gray-900 focus:border-gray-400"
                      />
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

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags (optional)
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map((tag) => (
                    <Button
                      key={tag.id}
                      type="button"
                      variant="outline"
                      size="sm"
                      className={`text-xs px-2 py-1 h-7 ${
                        selectedTagIds.includes(tag.id)
                          ? "bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100 hover:border-blue-400 hover:text-blue-700"
                          : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                      onClick={() => toggleTagId(tag.id)}
                    >
                      {selectedTagIds.includes(tag.id) ? (
                        <>
                          <Check className="h-3 w-3 mr-1" />
                          {tag.name}
                        </>
                      ) : (
                        <>
                          <Plus className="h-3 w-3 mr-1" />
                          {tag.name}
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
                <Button
                  type="submit"
                  className="flex-1 bg-gray-900 hover:bg-gray-800 text-white disabled:opacity-70 disabled:cursor-not-allowed"
                  disabled={submitting}
                >
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
