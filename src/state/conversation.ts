interface Conversation {
  history: any[];
  stage?: string;
}

const conversations =
  new Map<string, Conversation>();

export function getConversation(
  sessionId: string
) {
  if (!conversations.has(sessionId)) {
    conversations.set(sessionId, {
      history: [],
    });
  }

  return conversations.get(sessionId)!;
}