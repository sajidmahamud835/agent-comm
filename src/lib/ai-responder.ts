import { Message } from "@/types";
import {
  getActiveAIAgentsInRoom,
  getAIAgentByAgentId,
  getAgent,
  getAgents,
  getMessages,
  addMessage,
  getRoom,
  getWebhooks,
} from "./store";
import { generateResponse } from "./ai-engine";

export async function fireWebhooks(roomId: string, message: Message): Promise<void> {
  try {
    const room = await getRoom(roomId);
    if (!room) return;

    for (const memberId of room.members) {
      const urls = await getWebhooks(memberId);
      for (const url of urls) {
        fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(message),
        }).catch(() => {});
      }
    }
  } catch {
    // silent
  }
}

export async function triggerAIResponses(
  roomId: string,
  triggerMessage: Message
): Promise<void> {
  try {
    // Get active AI agents in this room
    const aiConfigs = await getActiveAIAgentsInRoom(roomId);
    if (aiConfigs.length === 0) return;

    // Check if sender is an AI agent — prevent response loops
    const senderIsAI = await getAIAgentByAgentId(triggerMessage.senderId);
    if (senderIsAI) return;

    // Build name map for context
    const allAgents = await getAgents();
    const agentNameMap: Record<string, string> = {};
    for (const a of allAgents) {
      agentNameMap[a.id] = a.name;
    }

    // Fetch recent room history (last 20 messages)
    const history = await getMessages({ roomId, limit: 20 });

    for (const config of aiConfigs) {
      if (!config.autoReply) continue;

      try {
        const agentRecord = await getAgent(config.agentId);
        const agentName = agentRecord?.name || "AI Agent";

        // Apply reply delay if configured
        if (config.replyDelay > 0) {
          await new Promise((resolve) => setTimeout(resolve, config.replyDelay));
        }

        const response = await generateResponse(config, history, agentName, agentNameMap);

        if (response && response.trim()) {
          const aiMsg = await addMessage({
            senderId: config.agentId,
            content: response.trim(),
            roomId,
            type: "text",
          });
          fireWebhooks(roomId, aiMsg);
        }
      } catch (err) {
        console.error(`AI agent ${config.agentId} response error:`, err);
      }
    }
  } catch (err) {
    console.error("triggerAIResponses error:", err);
  }
}
