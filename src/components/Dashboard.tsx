"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Paperclip, Send, ArrowUpRight, Plus, Maximize2, Check, X } from "lucide-react";
import { AddAgentModal } from "./AddAgentModal";
import { AgentContextMenu } from "./AgentContextMenu";
import { AgentInfoModal } from "./AgentInfoModal";
import ConfirmationModal from "./ConfirmationModal";
import { TagsList } from "@/components/ui/TagsList";
import { useTagsStore } from "@/store/tags";
import { toast } from "sonner";

// Типы для тегов
export type AgentTag = string;

// Функция для генерации случайных тегов (1-2 тега)
const getRandomTags = (available: AgentTag[]): AgentTag[] => {
  if (!available?.length) return [];
  const shuffled = [...available].sort(() => 0.5 - Math.random());
  const count = Math.floor(Math.random() * 2) + 1;
  return shuffled.slice(0, count);
};

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
  createdBy?: string; // Email создателя агента
  isLibraryAgent?: boolean; // Флаг для определения, является ли агент библиотечным
  tags?: AgentTag[]; // Теги агента
}

interface LibraryAgent {
  id: string;
  name: string;
  displayName?: string;
  description: string;
  category: "Analysis" | "Metrics";
  emoji: string;
  createdBy: string;
  tags?: AgentTag[]; // Теги агента
}

// Initial agents are empty; we'll load them from backend registry
const initialAgents: Agent[] = [];

const initialLibraryAgents: LibraryAgent[] = [];

interface User {
  name: string;
  email: string;
}

interface DashboardProps {
  onOpenChat: () => void;
  user: User;
  onLogout: () => void;
}

const Dashboard = ({ onOpenChat, user, onLogout }: DashboardProps) => {
  const [activeTab, setActiveTab] = useState("My agents");
  const { tags: storeTags, fetchIfNeeded } = useTagsStore();
  const [inputValue, setInputValue] = useState("");
  const [agents, setAgents] = useState<Agent[]>(initialAgents);
  const [libraryAgents, setLibraryAgents] = useState<LibraryAgent[]>(initialLibraryAgents);
  const [isAgentsLoading, setIsAgentsLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [agentToDelete, setAgentToDelete] = useState<string | null>(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [selectedTagsFilter, setSelectedTagsFilter] = useState<AgentTag[]>([]);

  // Load tools from backend registry + hardcoded notes
  useEffect(() => {
    const load = async () => {
      try {
        setIsAgentsLoading(true);
        const [regRes, hcRes] = await Promise.all([
          fetch("/api/tools/registry", { cache: "no-store" }),
          fetch("/api/tools/hardcoded", { cache: "no-store" }),
        ]);
        const registry = regRes.ok ? await regRes.json() : [];
        const hardcoded = hcRes.ok ? await hcRes.json() : [];
        const notesById = new Map<string, string | undefined>();
        for (const h of hardcoded) {
          notesById.set(h.id, h?.notes || h?.registry?.notes || undefined);
        }
        const mapped: Agent[] = (registry as any[]).map((r) => ({
          id: r.id,
          name: `@${r.explicitCallName}`,
          displayName: r.readableName,
          type: "personal",
          status: "active",
          description:
            r.toolType === "HARD_CODED" ? notesById.get(r.id) || "" : `${r.toolType} tool`,
          isCustom: true,
          tags: Array.isArray(r.tags) ? (r.tags as any[]).map((t: any) => t.name) : [],
        }));
        setAgents(mapped);
      } catch {
        setAgents([]);
      } finally {
        setIsAgentsLoading(false);
      }
    };
    load();
  }, [storeTags]);

  const [addedAgents, setAddedAgents] = useState<{
    personal: Set<string>;
  }>({
    personal: new Set(),
  });

  const tabs = ["My agents", "Team Library"];

  // Функция для создания полной даты в американском формате
  const getFullDateTooltip = (relativeTime: string) => {
    const now = new Date();
    let targetDate = new Date(now);

    // Парсим различные форматы относительного времени
    if (relativeTime.includes("min ago")) {
      const minutes = parseInt(relativeTime.replace("min ago", ""));
      targetDate.setMinutes(now.getMinutes() - minutes);
    } else if (relativeTime.includes("hour ago")) {
      const hours = parseInt(relativeTime.replace("hour ago", ""));
      targetDate.setHours(now.getHours() - hours);
    } else if (relativeTime.includes("hours ago")) {
      const hours = parseInt(relativeTime.replace("hours ago", ""));
      targetDate.setHours(now.getHours() - hours);
    } else if (relativeTime.includes("day ago")) {
      const days = parseInt(relativeTime.replace("day ago", ""));
      targetDate.setDate(now.getDate() - days);
    } else if (relativeTime.includes("days ago")) {
      const days = parseInt(relativeTime.replace("days ago", ""));
      targetDate.setDate(now.getDate() - days);
    } else if (relativeTime === "yesterday") {
      targetDate.setDate(now.getDate() - 1);
    } else if (relativeTime === "just now") {
      // Оставляем текущее время
    } else {
      // Если формат не распознан, возвращаем null
      return null;
    }

    return targetDate.toLocaleString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handleSendClick = () => {
    onOpenChat();
  };

  const handleCardClick = () => {
    onOpenChat();
  };

  const handleAddAgent = (newAgent: {
    name: string;
    displayName: string;
    apiKey: string;
    agentUrl: string;
    webhookUrl: string;
    description: string;
    tags: AgentTag[];
  }) => {
    const agent: Agent = {
      id: Date.now().toString(),
      name: newAgent.name,
      displayName: newAgent.displayName,
      description: newAgent.description,
      type: "personal",
      status: "active",
      isCustom: true,
      createdBy: user.email,
      tags: newAgent.tags,
    };

    setAgents([agent, ...agents]);

    // Clear editing state after successful creation
    setEditingAgent(null);
    setShowAddModal(false);

    // TODO: Save agent to backend
    // POST /api/agents with user ID and agent data
    // Update user's agent list in database
  };

  const handleAddLibraryAgent = (libraryAgent: LibraryAgent) => {
    const isAdded = addedAgents.personal.has(libraryAgent.id);

    if (isAdded) {
      // Remove from agents and addedAgents
      setAgents(
        agents.filter((agent) => !(agent.name === libraryAgent.name && agent.type === "personal"))
      );
      setAddedAgents((prev) => ({
        ...prev,
        personal: new Set(Array.from(prev.personal).filter((id) => id !== libraryAgent.id)),
      }));
    } else {
      // Add to agents and addedAgents
      const newAgent: Agent = {
        id: Date.now().toString(),
        name: libraryAgent.name,
        type: "personal",
        description: libraryAgent.description,
        status: "active",
        isCustom: false,
        createdBy: libraryAgent.createdBy,
        tags: libraryAgent.tags,
      };
      setAgents([newAgent, ...agents]);
      setAddedAgents((prev) => ({
        ...prev,
        personal: new Set(Array.from(prev.personal).concat(libraryAgent.id)),
      }));
    }
  };

  const handleLibraryAgentAction = (
    libraryAgent: LibraryAgent,
    action: "personal" | "remove-personal"
  ) => {
    switch (action) {
      case "personal":
        handleAddLibraryAgent(libraryAgent);
        toast.success("Agent added to My Agents");
        break;
      case "remove-personal":
        handleAddLibraryAgent(libraryAgent); // This will remove it since it's already added
        toast.success("Agent removed from My Agents");
        break;
    }
  };

  const handleEditAgent = (agentId: string) => {
    const agent = agents.find((a) => a.id === agentId);
    console.log("handleEditAgent called:", {
      agentId,
      foundAgent: agent,
      agentType: agent?.type,
      agentName: agent?.name,
    });
    if (agent) {
      setEditingAgent(agent);
      setShowAddModal(true);
    }
  };

  const handleUpdateAgent = (
    agentId: string,
    updatedAgent: {
      name: string;
      displayName: string;
      apiKey: string;
      agentUrl: string;
      webhookUrl: string;
      description: string;
      tags: AgentTag[];
    }
  ) => {
    const currentAgent = agents.find((a) => a.id === agentId);
    if (!currentAgent) return;

    // Обновляем агента
    setAgents(
      agents.map((agent) =>
        agent.id === agentId
          ? {
              ...agent,
              name: updatedAgent.name,
              displayName: updatedAgent.displayName,
              description: updatedAgent.description,
              tags: updatedAgent.tags,
            }
          : agent
      )
    );

    // Team Library sync removed for MVP

    // Clear editing state after successful update
    setEditingAgent(null);
    setShowAddModal(false);

    // TODO: Update agent in backend
    // PUT /api/agents/{agentId} with user ID and updated agent data
  };

  const handleDeleteAgent = (agentId: string) => {
    const agent = agents.find((a) => a.id === agentId);
    if (!agent) return;

    // Если это библиотечный агент - удаляем без подтверждения
    if (!agent.isCustom) {
      // Удаляем агента из списка
      setAgents(agents.filter((a) => a.id !== agentId));

      // Если это библиотечный агент, также удаляем из addedAgents
      const libraryAgent = libraryAgents.find((lib) => lib.name === agent.name);
      if (libraryAgent) {
        setAddedAgents((prev) => ({
          ...prev,
          personal: new Set(Array.from(prev.personal).filter((id) => id !== libraryAgent.id)),
        }));
      }

      toast.success("Agent removed");
    } else {
      // Для пользовательских агентов показываем модалку подтверждения
      setAgentToDelete(agentId);
      setShowDeleteConfirmation(true);
    }
  };

  const handleRemoveFromPersonal = (agentId: string) => {
    const agent = agents.find((a) => a.id === agentId);
    if (!agent) return;

    // Удаляем агента из персонального списка
    setAgents(agents.filter((a) => a.id !== agentId));

    // Если это библиотечный агент, также удаляем из addedAgents
    if (!agent.isCustom) {
      const libraryAgent = libraryAgents.find((lib) => lib.name === agent.name);
      if (libraryAgent) {
        setAddedAgents((prev) => ({
          ...prev,
          personal: new Set(Array.from(prev.personal).filter((id) => id !== libraryAgent.id)),
        }));
      }
    }

    toast.success("Agent removed from personal list");
  };

  // Функция для определения может ли пользователь удалить агента полностью
  const canDeleteAgent = (agent: Agent) => {
    // Библиотечные агенты можно только убирать, не удалять
    if (!agent.isCustom) return false;

    // Пользовательские агенты может удалить только создатель
    return agent.isCustom && agent.createdBy === user.email;
  };

  // Функция для определения должен ли показываться пункт "Remove" вместо "Delete"
  const shouldShowRemove = (agent: Agent) => {
    // Для библиотечных агентов всегда показываем Remove
    if (!agent.isCustom) return true;

    // Для пользовательских агентов показываем Remove если это не создатель
    return agent.isCustom && agent.createdBy !== user.email;
  };

  const confirmDeleteAgent = () => {
    if (!agentToDelete) return;

    const deletedAgent = agents.find((agent) => agent.id === agentToDelete);
    if (deletedAgent) {
      // Если это библиотечный агент, удаляем из addedAgents
      if (!deletedAgent.isCustom) {
        const libraryAgent = libraryAgents.find((lib) => lib.name === deletedAgent.name);
        if (libraryAgent) {
          setAddedAgents((prev) => ({
            ...prev,
            personal: new Set(Array.from(prev.personal).filter((id) => id !== libraryAgent.id)),
          }));
        }
      } else {
        // Если это пользовательский агент, который был добавлен в библиотеку, удаляем из библиотеки
        if (deletedAgent.isLibraryAgent) {
          setLibraryAgents(
            libraryAgents.filter(
              (lib) => lib.name !== deletedAgent.name || !lib.id.startsWith("custom-")
            )
          );
        }
      }
    }

    setAgents(agents.filter((agent) => agent.id !== agentToDelete));
    setAgentToDelete(null);

    // TODO: Delete agent from backend
    // DELETE /api/agents/{agentId} with user ID
    // Remove from user's agent list in database
  };

  const handleLogout = () => {
    setShowLogoutConfirmation(true);
  };

  const confirmLogout = () => {
    onLogout();
  };

  const handleShowInfo = (agent: Agent) => {
    setSelectedAgent(agent);
    setShowInfoModal(true);
  };

  const getTabIcon = (tab: string) => {
    switch (tab) {
      case "My agents":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            fill="currentColor"
            viewBox="0 0 256 256"
          >
            <path d="M192,96a64,64,0,1,1-64-64A64,64,0,0,1,192,96Z" opacity="0.2"></path>
            <path d="M230.92,212c-15.23-26.33-38.7-45.21-66.09-54.16a72,72,0,1,0-73.66,0C63.78,166.78,40.31,185.66,25.08,212a8,8,0,1,0,13.85,8c18.84-32.56,52.14-52,89.07-52s70.23,19.44,89.07,52a8,8,0,1,0,13.85-8ZM72,96a56,56,0,1,1,56,56A56.06,56.06,0,0,1,72,96Z"></path>
          </svg>
        );
      case "Team Library":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            fill="currentColor"
            viewBox="0 0 256 256"
          >
            <path
              d="M232,56V200H160a32,32,0,0,0-32,32,32,32,0,0,0-32-32H24V56H96a32,32,0,0,1,32,32,32,32,0,0,1,32-32Z"
              opacity="0.2"
            ></path>
            <path d="M232,48H160a40,40,0,0,0-32,16A40,40,0,0,0,96,48H24a8,8,0,0,0-8,8V200a8,8,0,0,0,8,8H96a24,24,0,0,1,24,24,8,8,0,0,0,16,0,24,24,0,0,1,24-24h72a8,8,0,0,0,8-8V56A8,8,0,0,0,232,48ZM96,192H32V64H96a24,24,0,0,1,24,24V200A39.81,39.81,0,0,0,96,192Zm128,0H160a39.81,39.81,0,0,0-24,8V88a24,24,0,0,1,24-24h64Z"></path>
          </svg>
        );
      default:
        return null;
    }
  };

  const filteredAgents = agents.filter((agent) => {
    switch (activeTab) {
      case "My agents":
        return agent.type === "personal";
      default:
        return false;
    }
  });

  // Функции для управления фильтром по тегам
  const handleTagFilterToggle = (tag: AgentTag) => {
    setSelectedTagsFilter((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const clearTagFilter = () => {
    setSelectedTagsFilter([]);
  };

  // Фильтрация библиотечных агентов по выбранным тегам
  const filteredLibraryAgents = libraryAgents.filter((agent) => {
    if (selectedTagsFilter.length === 0) return true;
    return selectedTagsFilter.some((tag) => agent.tags?.includes(tag));
  });

  const groupedLibraryAgents = filteredLibraryAgents.reduce(
    (acc, agent) => {
      if (!acc[agent.category]) {
        acc[agent.category] = [];
      }
      acc[agent.category].push(agent);
      return acc;
    },
    {} as Record<string, LibraryAgent[]>
  );

  const renderLibraryView = () => {
    return (
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Фильтр по тегам */}
        <div className="bg-white py-4 pr-4 rounded-lg">
          <div className="flex items-center gap-4">
            <h3 className="text-sm font-medium text-gray-900">Filter by tags</h3>

            <div className="flex flex-wrap gap-2">
              {(storeTags as any[]).map((tag: any) => (
                <Button
                  key={tag.id}
                  variant="outline"
                  size="sm"
                  className={`text-xs px-3 py-1 h-8 ${
                    selectedTagsFilter.includes(tag.name)
                      ? "bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100 hover:border-blue-400"
                      : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                  onClick={() => handleTagFilterToggle(tag.name)}
                >
                  {selectedTagsFilter.includes(tag.name) ? (
                    <>
                      <Check className="h-3 w-3 mr-1" />
                      {tag.name}
                    </>
                  ) : (
                    tag.name
                  )}
                </Button>
              ))}

              {selectedTagsFilter.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearTagFilter}
                  className="text-xs px-3 py-1 h-8 bg-white border-gray-300 text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                >
                  Clear all
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Проверка на пустые результаты */}
        {Object.keys(groupedLibraryAgents).length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-2">No agents found with selected tags</div>
          </div>
        ) : (
          Object.entries(groupedLibraryAgents).map(([category, agents]) => (
            <div key={category}>
              <h2 className="text-xl font-semibold mb-4 text-gray-900">
                {category} ({agents.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {agents.map((agent) => {
                  const isAddedToPersonal = addedAgents.personal.has(agent.id);

                  return (
                    <Card
                      key={agent.id}
                      className="bg-white border-gray-200 shadow-sm h-full flex flex-col"
                    >
                      <CardContent className="p-6 flex-1 flex flex-col">
                        <div className="mb-4 flex-1">
                          <h3
                            className="font-semibold text-gray-900 mb-2 flex items-center gap-2"
                            style={{ fontSize: "14px" }}
                          >
                            <span style={{ fontSize: "14px" }}>{agent.emoji}</span>
                            {agent.name}
                          </h3>
                          <p
                            className="text-gray-600 mb-3"
                            style={{ fontSize: "14px", marginLeft: "22px" }}
                          >
                            {agent.description}
                          </p>
                        </div>

                        <div className="mt-auto">
                          {/* Tags */}
                          <TagsList
                            tags={agent.tags || []}
                            maxVisibleTags={3}
                            className="mb-2"
                            selectedTags={selectedTagsFilter}
                          />

                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onOpenChat()}
                                className="text-white bg-blue-600 border-blue-600 hover:bg-blue-700 hover:text-white"
                                style={{ fontSize: "14px" }}
                              >
                                Open
                                <ArrowUpRight className="h-3 w-3" style={{ marginLeft: "4px" }} />
                              </Button>

                              {/* My Agents Button - скрываем для агентов, созданных текущим пользователем */}
                              {agent.createdBy !== user.name && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleLibraryAgentAction(
                                      agent,
                                      isAddedToPersonal ? "remove-personal" : "personal"
                                    );
                                  }}
                                  className={`text-gray-700 border-gray-300 hover:bg-gray-50 ${isAddedToPersonal ? "bg-green-50 border-green-300" : "bg-white"}`}
                                  style={{ fontSize: "14px" }}
                                >
                                  {isAddedToPersonal ? (
                                    <>
                                      <Check
                                        className="h-3 w-3 text-green-600"
                                        style={{ marginRight: "4px" }}
                                      />
                                      My Agents
                                    </>
                                  ) : (
                                    <>
                                      <Plus className="h-3 w-3" style={{ marginRight: "4px" }} />
                                      My Agents
                                    </>
                                  )}
                                </Button>
                              )}
                            </div>

                            <div className="text-right">
                              <p className="text-xs text-gray-500">Created by</p>
                              <p className="text-xs text-gray-700 font-medium">{agent.createdBy}</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    );
  };

  const renderAgentsGrid = () => {
    // Проверяем, есть ли агенты для отображения
    if (filteredAgents.length === 0) {
      const emptyStateConfig = {
        "My agents": {
          title: "No agents added yet",
          description: "Add an agent from the library",
        },
      };

      const config = emptyStateConfig[activeTab as keyof typeof emptyStateConfig];

      return (
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col items-center justify-center py-16">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">{config.title}</h3>
              <p className="text-gray-600 mb-6">{config.description}</p>
              <Button
                onClick={() => setActiveTab("Team Library")}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Browse Library
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAgents.map((agent) => (
            <Card
              key={agent.id}
              className="group bg-white border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer relative shadow-sm h-[212px] flex flex-col"
              onClick={handleCardClick}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-sm font-semibold text-gray-900">{agent.name}</span>
                  </div>
                  <div className="absolute top-3 right-3">
                    <AgentContextMenu
                      onEdit={() => handleEditAgent(agent.id)}
                      onDelete={() => {
                        if (shouldShowRemove(agent)) {
                          handleRemoveFromPersonal(agent.id);
                        } else {
                          handleDeleteAgent(agent.id);
                        }
                      }}
                      onInfo={() => handleShowInfo(agent)}
                      isCustomAgent={agent.isCustom}
                      showRemove={shouldShowRemove(agent)}
                      canDelete={canDeleteAgent(agent)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col relative pb-12">
                <div className="flex-1">
                  {agent.status === "error" ? (
                    <div className="text-sm text-red-600 whitespace-pre-line line-clamp-3">
                      {agent.errorMessage}
                    </div>
                  ) : agent.items && agent.items.length > 0 ? (
                    <ul className="space-y-2 max-h-20 overflow-hidden">
                      {agent.items.slice(0, 3).map((item, index) => (
                        <li key={index} className="text-sm text-gray-700 flex items-start">
                          <span className="w-1 h-1 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                          <span className="line-clamp-1">{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-sm text-gray-700 line-clamp-3">
                      {agent.description || "Custom agent"}
                    </div>
                  )}
                </div>

                {/* Tags */}
                <TagsList tags={agent.tags || []} maxVisibleTags={3} className="mt-2" />

                <div
                  className={`absolute bottom-4 left-6 right-6 flex items-center ${agent.status === "error" ? "justify-end" : "justify-between"}`}
                >
                  {agent.status !== "error" && (
                    <button
                      className="text-sm font-medium flex items-center text-blue-600 hover:text-blue-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCardClick();
                      }}
                    >
                      Open
                      <ArrowUpRight className="ml-1 h-3 w-3" />
                    </button>
                  )}

                  {agent.updatedTime && agent.status !== "error" && (
                    <span
                      className="text-xs text-gray-500"
                      title={getFullDateTooltip(agent.updatedTime) || undefined}
                    >
                      Updated {agent.updatedTime}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 px-6 py-4 relative">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="36"
              height="36"
              fill="#3b3e45"
              viewBox="0 0 256 256"
            >
              <path
                d="M240,124a48,48,0,0,1-32,45.27h0V176a40,40,0,0,1-80,0,40,40,0,0,1-80,0v-6.73h0a48,48,0,0,1,0-90.54V72a40,40,0,0,1,80,0,40,40,0,0,1,80,0v6.73A48,48,0,0,1,240,124Z"
                opacity="0.2"
              ></path>
              <path d="M248,124a56.11,56.11,0,0,0-32-50.61V72a48,48,0,0,0-88-26.49A48,48,0,0,0,40,72v1.39a56,56,0,0,0,0,101.2V176a48,48,0,0,0,88,26.49A48,48,0,0,0,216,176v-1.41A56.09,56.09,0,0,0,248,124ZM88,208a32,32,0,0,1-31.81-28.56A55.87,55.87,0,0,0,64,180h8a8,8,0,0,0,0-16H64A40,40,0,0,1,50.67,86.27,8,8,0,0,0,56,78.73V72a32,32,0,0,1,64,0v68.26A47.8,47.8,0,0,0,88,128a8,8,0,0,0,0,16,32,32,0,0,1,0,64Zm104-44h-8a8,8,0,0,0,0,16h8a55.87,55.87,0,0,0,7.81-.56A32,32,0,1,1,168,144a8,8,0,0,0,0-16,47.8,47.8,0,0,0-32,12.26V72a32,32,0,0,1,64,0v6.73a8,8,0,0,0,5.33,7.54A40,40,0,0,1,192,164Zm16-52a8,8,0,0,1-8,8h-4a36,36,0,0,1-36-36V80a8,8,0,0,1,16,0v4a20,20,0,0,0,20,20h4A8,8,0,0,1,208,112ZM60,120H56a8,8,0,0,1,0-16h4A20,20,0,0,0,80,84V80a8,8,0,0,1,16,0v4A36,36,0,0,1,60,120Z"></path>
            </svg>
          </div>

          {/* Navigation - Центрированная навигация */}
          <nav className="absolute left-1/2 transform -translate-x-1/2 flex items-center space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center space-x-2 text-sm font-medium transition-colors duration-200 pb-1 ${
                  activeTab === tab
                    ? "text-gray-900 border-b-2 border-gray-900"
                    : "text-gray-600 hover:text-gray-800 border-b-2 border-transparent"
                }`}
              >
                {getTabIcon(tab)}
                <span className="whitespace-nowrap">{tab}</span>
              </button>
            ))}
          </nav>

          {/* Add Agent Button and Logout */}
          <div className="flex items-center space-x-3">
            <Button
              className="bg-gray-200 hover:bg-gray-300 text-gray-900 flex items-center gap-2 px-3 sm:px-4"
              onClick={() => {
                setEditingAgent(null);
                setShowAddModal(true);
              }}
            >
              <span className="hidden sm:inline">New agent</span>
              <Plus className="h-4 w-4" />
            </Button>
            {/* <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 hover:bg-gray-100 text-gray-600"
              onClick={handleLogout}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </Button> */}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6">
        {/* Search Input - только для My agents */}
        {activeTab === "My agents" && (
          <div className="max-w-4xl mx-auto mb-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Hi Alex 👋</h2>
              <p className="text-gray-600">Start a conversation with your AI agents</p>
            </div>

            {/* <div className="relative bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask me anything..."
                className="w-full p-4 text-gray-900 placeholder-gray-500 resize-none border-0 rounded-lg focus:outline-none focus:ring-0 min-h-[120px] bg-gray-50"
                rows={4}
              />

              <Button
                variant="ghost"
                size="icon"
                className="absolute top-3 right-3 h-8 w-8 text-gray-500 hover:text-gray-700 bg-white/80 hover:bg-gray-100/90 backdrop-blur-sm"
                onClick={handleSendClick}
              >
                <Maximize2 className="h-4 w-4" />
              </Button>

              <div className="flex items-center justify-between p-3 border-t border-gray-100">
                <div className="flex items-center space-x-3">
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-100">
                    <Paperclip className="h-4 w-4 text-gray-600" />
                  </Button>
                </div>

                <Button
                  size="sm"
                  className={`px-4 ${inputValue.trim() ? "bg-gray-900 hover:bg-gray-800 text-white" : "bg-gray-300 text-gray-500 cursor-not-allowed"}`}
                  onClick={handleSendClick}
                  disabled={!inputValue.trim()}
                >
                  Send
                </Button>
              </div>
            </div> */}
          </div>
        )}

        {/* Content based on active tab */}
        {activeTab === "Team Library" ? renderLibraryView() : renderAgentsGrid()}
      </main>

      {/* Add Agent Modal */}
      <AddAgentModal
        isOpen={showAddModal}
        onClose={() => {
          console.log("Modal closing, current editingAgent:", editingAgent);
          setShowAddModal(false);
          // Don't reset editingAgent here - let it be handled explicitly
        }}
        onAddAgent={handleAddAgent}
        onUpdateAgent={handleUpdateAgent}
        editingAgent={editingAgent}
      />

      {/* Logout Confirmation Modal */}
      <ConfirmationModal
        isOpen={showLogoutConfirmation}
        onClose={() => setShowLogoutConfirmation(false)}
        onConfirm={confirmLogout}
        title="Confirm Sign Out"
        description="Are you sure you want to sign out? You will need to log in again to access your agents."
        confirmText="Sign Out"
        cancelText="Cancel"
        variant="default"
      />

      {/* Agent Info Modal */}
      <AgentInfoModal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        agent={selectedAgent}
      />

      {/* Delete Agent Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirmation}
        onClose={() => {
          setShowDeleteConfirmation(false);
          setAgentToDelete(null);
        }}
        onConfirm={confirmDeleteAgent}
        title="Delete Agent"
        description={`Are you sure you want to delete this agent? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
};

export default Dashboard;
