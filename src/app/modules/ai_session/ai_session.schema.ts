// src/modules/chat/chat.model.ts

import { Schema, model } from "mongoose";
import { TAdapterResponseDoc, TChatMessage, TChatSession } from "./ai_session.interface";

// ============= Chat Session Schema =============

const chatSessionSchema = new Schema<TChatSession>(
  {
    sessionId: {
      type: String,
      required: [true, "Session ID is required"],
      unique: true,
      trim: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    metadata: {
      type: Map,
      of: Schema.Types.Mixed,
      default: {},
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Compound index for efficient queries
chatSessionSchema.index({ userId: 1, createdAt: -1 });
chatSessionSchema.index({ sessionId: 1, isDeleted: 1 });

export const ChatSession_Model = model<TChatSession>(
  "ChatSession",
  chatSessionSchema
);

// ============= Chat Message Schema =============

const chatMessageSchema = new Schema<TChatMessage>(
  {
    sessionId: {
      type: String,
      required: [true, "Session ID is required"],
      index: true,
    },
    messageType: {
      type: String,
      enum: ["prompt", "response"],
      required: [true, "Message type is required"],
    },
    sequenceNumber: {
      type: Number,
      required: [true, "Sequence number is required"],
      min: 1,
    },
    content: {
      type: String,
      required: [true, "Content is required"],
    },
    selectedAdapter: {
      type: String,
      enum: ["openai", "gemini", "claude", "perplexity"],
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Compound indexes for efficient queries
chatMessageSchema.index({ sessionId: 1, sequenceNumber: 1 });
chatMessageSchema.index({ sessionId: 1, messageType: 1, sequenceNumber: 1 });

// Ensure unique sequence numbers per session and message type
chatMessageSchema.index(
  { sessionId: 1, sequenceNumber: 1, messageType: 1 },
  { unique: true }
);

export const ChatMessage_Model = model<TChatMessage>(
  "ChatMessage",
  chatMessageSchema
);

// ============= Adapter Response Schema =============

const adapterResponseSchema = new Schema<TAdapterResponseDoc>(
  {
    messageId: {
      type: Schema.Types.ObjectId,
      ref: "ChatMessage",
      required: [true, "Message ID is required"],
      index: true,
    },
    adapter: {
      type: String,
      required: [true, "Adapter name is required"],
      enum: ["openai", "gemini", "claude", "perplexity"],
    },
    text: {
      type: String,
      required: [true, "Text is required"],
    },
    isSelected: {
      type: Boolean,
      default: false,
    },
    responseTimeMs: {
      type: Number,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Compound index
adapterResponseSchema.index({ messageId: 1, adapter: 1 });

export const AdapterResponse_Model = model<TAdapterResponseDoc>(
  "AdapterResponse",
  adapterResponseSchema
);