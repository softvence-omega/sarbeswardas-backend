// src/modules/chat/chat.interface.ts

import { ObjectId } from "mongoose";

// ============= AI Request/Response Types =============

export type TAdapterType = "openai" | "gemini" | "claude" | "perplexity";

export type TAdapterResponse = {
  adapter: TAdapterType;
  text: string;
};

export type TAIServiceRequest = {
  session_id: string;
  prompt: string;
};

export type TAIServiceResponse = {
  session_id: string;
  selected: TAdapterResponse;
  responses: TAdapterResponse[];
};

// ============= Database Document Types =============

export type TChatSession = {
  sessionId: string;
  userId: ObjectId;
  metadata?: Record<string, any>;
  isDeleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};

export type TMessageType = "prompt" | "response";

export type TChatMessage = {
  sessionId: string;
  messageType: TMessageType;
  sequenceNumber: number;
  content: string;
  selectedAdapter?: TAdapterType;
  userId: ObjectId;
  isDeleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};

export type TAdapterResponseDoc = {
  messageId: ObjectId;
  adapter: TAdapterType;
  text: string;
  isSelected: boolean;
  responseTimeMs?: number;
  createdAt?: Date;
};

// ============= Service Response Types =============

export type TSendPromptResult = {
  sessionId: string;
  sequenceNumber: number;
  prompt: string;
  response: {
    selected: TAdapterResponse;
    allResponses: TAdapterResponse[];
  };
};

export type TConversationMessage = {
  sequenceNumber: number;
  prompt: string;
  response: {
    selected: TAdapterResponse;
    allResponses: TAdapterResponse[];
  };
  timestamp: Date;
};

export type TConversationHistory = {
  sessionId: string;
  userId: string;
  messages: TConversationMessage[];
  totalMessages: number;
  createdAt: Date;
  updatedAt: Date;
};

export type TSessionSummary = {
  sessionId: string;
  messageCount: number;
  lastMessageAt: Date;
  createdAt: Date;
  updatedAt: Date;
};