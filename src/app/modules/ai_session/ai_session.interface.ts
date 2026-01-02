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
  summary: string;
  selected?: TAdapterResponse;
  responses: TAdapterResponse[];
};

export interface TAdapterImageMeta {
  url: string; // Cloudinary URL after upload
  compressed?: boolean;
  original_size_kb?: number;
  compressed_size_kb?: number;
}

// ============= Database Document Types =============

export type TChatSession = {
  title: string;
  sessionId: string;
  userId: ObjectId;
  metadata?: Record<string, any>;
  isDeleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};

export type TMessageType = "prompt" | "response";
export type TContentType = "text" | "image";

export type TChatMessage = {
  sessionId: string;
  messageType: TMessageType;
  sequenceNumber: number;
  content: string;
  contentType: TContentType;
  selectedAdapter?: TAdapterType;
  summary?: string;
  userId: ObjectId;
  isDeleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};

export interface TAdapterResponseDoc {
  messageId: string;
  adapter: TAdapterType;
  text?: string; // For text responses
  image?: TAdapterImageMeta; // For image responses
  isSelected?: boolean;
  responseTimeMs?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// ============= Service Response Types =============

export type TSendPromptResult = {
  sessionId: string;
  sequenceNumber: number;
  prompt: string;
  summary: string;
  response: {
    selected: TAdapterResponse;
    allResponses: TAdapterResponse[];
  };
};

export type TConversationMessage = {
  sequenceNumber: number;
  prompt: string;
  summary?: string;
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
