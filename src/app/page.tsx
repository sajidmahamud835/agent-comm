"use client";

import { useEffect, useState, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import ChatArea from "@/components/ChatArea";
import AgentPanel from "@/components/AgentPanel";
import { Agent, Message, Room } from "@/types";

export default function Home() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeView, setActiveView] = useState<{ type: "room" | "dm"; id: string }>({
    type: "room",
    id: "general",
  });
  const [currentAgentId] = useState("agent-alpha");

  const fetchData = useCallback(async () => {
    const [agentsRes, roomsRes] = await Promise.all([
      fetch("/api/agents"),
      fetch("/api/rooms"),
    ]);
    setAgents(await agentsRes.json());
    setRooms(await roomsRes.json());
  }, []);

  const fetchMessages = useCallback(async () => {
    const params = new URLSearchParams();
    if (activeView.type === "room") {
      params.set("roomId", activeView.id);
    } else {
      params.set("senderId", currentAgentId);
      params.set("recipientId", activeView.id);
    }
    const res = await fetch(`/api/messages?${params}`);
    setMessages(await res.json());
  }, [activeView, currentAgentId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 2000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  const handleSendMessage = async (content: string) => {
    const body: Record<string, string> = {
      senderId: currentAgentId,
      content,
      type: "text",
    };
    if (activeView.type === "room") {
      body.roomId = activeView.id;
    } else {
      body.recipientId = activeView.id;
    }

    await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    fetchMessages();
  };

  const activeRoom =
    activeView.type === "room"
      ? rooms.find((r) => r.id === activeView.id)
      : undefined;
  const activeDMAgent =
    activeView.type === "dm"
      ? agents.find((a) => a.id === activeView.id)
      : undefined;

  return (
    <div className="h-screen flex">
      <Sidebar
        agents={agents}
        rooms={rooms}
        activeView={activeView}
        onSelectRoom={(id) => setActiveView({ type: "room", id })}
        onSelectDM={(id) => setActiveView({ type: "dm", id })}
        currentAgentId={currentAgentId}
      />
      <ChatArea
        messages={messages}
        agents={agents}
        room={activeRoom}
        dmAgent={activeDMAgent}
        currentAgentId={currentAgentId}
        onSendMessage={handleSendMessage}
      />
      <AgentPanel agents={agents} />
    </div>
  );
}
