// src/modules/chat/chat.service.ts

import axios, { AxiosError } from "axios";
import mongoose from "mongoose";
import fs from "fs";
import {
  TAdapterResponse,
  TAIServiceResponse,
  TConversationHistory,
  TSendPromptResult,
  TSessionSummary,
} from "./ai_session.interface";
import { AdapterResponse_Model, ChatMessage_Model, ChatSession_Model } from "./ai_session.schema";
import { AppError } from "../../utils/app_error";
import { uploadToCloudinary } from "../../utils/cloudinaryUploader";
// import { fs } from 'fs';
import { call_ai_image_service } from "../../utils/call_ai_image_service";

/**
 * Send prompt to AI and store response
 */
const send_prompt_to_ai = async (
  userId: string,
  sessionId: string,
  prompt: string,
  contentType: string,
): Promise<TSendPromptResult> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Ensure session exists
    await ensure_session_exists(userId, sessionId, session, prompt);

    // 2. Get next sequence number
    const sequenceNumber = await get_next_sequence_number(sessionId);

    // 3. Store prompt BEFORE calling AI
    const [promptMessage] = await ChatMessage_Model.create(
      [
        {
          sessionId,
          messageType: "prompt",
          sequenceNumber,
          content: prompt,
          userId,
        },
      ],
      { session }
    );

    // 4. Commit transaction for prompt
    await session.commitTransaction();

    // 5. Call AI service (outside transaction)
    let aiResponse: TAIServiceResponse;
    try {
      aiResponse = await call_ai_service(sessionId, prompt);
    } catch (error) {
      throw new AppError(502, "AI service is unavailable. Please try again later.");
    }

    // 6. Store AI response in new transaction
    const responseSession = await mongoose.startSession();
    responseSession.startTransaction();

    try {
      await store_ai_response(sessionId, userId, sequenceNumber, aiResponse, responseSession);
      await responseSession.commitTransaction();
    } catch (error) {
      await responseSession.abortTransaction();
      throw error;
    } finally {
      responseSession.endSession();
    }

    return {
      sessionId,
      sequenceNumber,
      prompt,
      response: {
        selected: aiResponse.selected,
        allResponses: aiResponse.responses,
      },
    };
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Get conversation history
 */
const get_session_history_from_db = async (
  userId: string,
  sessionId: string
): Promise<TConversationHistory> => {
  // Verify session ownership
  const session = await ChatSession_Model.findOne({
    sessionId,
    userId,
    isDeleted: false,
  });

  if (!session) {
    throw new AppError(404, "Session not found or access denied");
  }

  // Get all messages
  const messages = await ChatMessage_Model.find({
    sessionId,
    isDeleted: false,
  })
    .sort({ sequenceNumber: 1, messageType: -1 })
    .lean();

  if (messages.length === 0) {
    return {
      sessionId,
      userId: userId,
      messages: [],
      totalMessages: 0,
      createdAt: session.createdAt!,
      updatedAt: session.updatedAt!,
    };
  }

  // Get response message IDs
  const responseMessageIds = messages.filter((m) => m.messageType === "response").map((m) => m._id);

  // Get all adapter responses
  const adapterResponses = await AdapterResponse_Model.find({
    messageId: { $in: responseMessageIds },
  }).lean();

  // Group by message ID
  const adapterResponseMap = new Map<string, TAdapterResponse[]>();
  adapterResponses.forEach((ar) => {
    const msgId = ar.messageId.toString();
    if (!adapterResponseMap.has(msgId)) {
      adapterResponseMap.set(msgId, []);
    }
    adapterResponseMap.get(msgId)!.push({
      adapter: ar.adapter,
      text: ar.text ?? "",
    });
  });

  // Group messages by sequence
  const conversationMessages = group_messages_by_sequence(messages, adapterResponseMap);

  return {
    sessionId,
    userId: userId,
    messages: conversationMessages,
    totalMessages: conversationMessages.length,
    createdAt: session.createdAt!,
    updatedAt: session.updatedAt!,
  };
};

/**
 * Update prompt and regenerate response
 */
const update_prompt_in_db = async (
  userId: string,
  sessionId: string,
  sequenceNumber: number,
  newPrompt: string
): Promise<TSendPromptResult> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Verify session ownership
    const chatSession = await ChatSession_Model.findOne({
      sessionId,
      userId,
      isDeleted: false,
    });

    if (!chatSession) {
      throw new AppError(404, "Session not found or access denied");
    }

    // 2. Find and update prompt
    const promptMessage = await ChatMessage_Model.findOne({
      sessionId,
      sequenceNumber,
      messageType: "prompt",
      isDeleted: false,
    });

    if (!promptMessage) {
      throw new AppError(404, "Prompt message not found");
    }

    promptMessage.content = newPrompt;
    await promptMessage.save({ session });

    // 3. Delete old response
    const responseMessage = await ChatMessage_Model.findOne({
      sessionId,
      sequenceNumber,
      messageType: "response",
      isDeleted: false,
    });

    if (responseMessage) {
      await AdapterResponse_Model.deleteMany({ messageId: responseMessage._id }, { session });
      await ChatMessage_Model.deleteOne({ _id: responseMessage._id }, { session });
    }

    await session.commitTransaction();

    // 4. Call AI with new prompt
    let aiResponse: TAIServiceResponse;
    try {
      aiResponse = await call_ai_service(sessionId, newPrompt);
    } catch (error) {
      throw new AppError(502, "AI service is unavailable. Please try again later.");
    }

    // 5. Store new response
    const newSession = await mongoose.startSession();
    newSession.startTransaction();

    try {
      await store_ai_response(sessionId, userId, sequenceNumber, aiResponse, newSession);
      await newSession.commitTransaction();
    } catch (error) {
      await newSession.abortTransaction();
      throw error;
    } finally {
      newSession.endSession();
    }

    return {
      sessionId,
      sequenceNumber,
      prompt: newPrompt,
      response: {
        selected: aiResponse.selected,
        allResponses: aiResponse.responses,
      },
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Update selected adapter
 */
const update_selected_adapter_in_db = async (
  userId: string,
  sessionId: string,
  sequenceNumber: number,
  selectedAdapter: string
): Promise<void> => {
  // Verify session
  const session = await ChatSession_Model.findOne({
    sessionId,
    userId,
    isDeleted: false,
  });

  if (!session) {
    throw new AppError(404, "Session not found or access denied");
  }

  // Find response message
  const responseMessage = await ChatMessage_Model.findOne({
    sessionId,
    sequenceNumber,
    messageType: "response",
    isDeleted: false,
  });

  if (!responseMessage) {
    throw new AppError(404, "Response message not found");
  }

  // Find adapter response
  const adapterResponse = await AdapterResponse_Model.findOne({
    messageId: responseMessage._id,
    adapter: selectedAdapter,
  });

  if (!adapterResponse) {
    throw new AppError(404, `Adapter ${selectedAdapter} not found for this message`);
  }

  // Update response message
  responseMessage.content = adapterResponse.text ?? "";
  responseMessage.selectedAdapter = selectedAdapter as any;
  await responseMessage.save();

  // Update selection flags
  await AdapterResponse_Model.updateMany({ messageId: responseMessage._id }, { isSelected: false });

  await AdapterResponse_Model.updateOne(
    { messageId: responseMessage._id, adapter: selectedAdapter },
    { isSelected: true }
  );
};

/**
 * Delete session
 */
const delete_session_from_db = async (userId: string, sessionId: string): Promise<void> => {
  const mongoSession = await mongoose.startSession();
  mongoSession.startTransaction();

  try {
    const session = await ChatSession_Model.findOne({
      sessionId,
      userId,
      isDeleted: false,
    });

    if (!session) {
      throw new AppError(404, "Session not found or access denied");
    }

    // Get response message IDs
    const responseMessages = await ChatMessage_Model.find({
      sessionId,
      messageType: "response",
      isDeleted: false,
    }).select("_id");

    const messageIds = responseMessages.map((m) => m._id);

    // Delete adapter responses
    if (messageIds.length > 0) {
      await AdapterResponse_Model.deleteMany(
        { messageId: { $in: messageIds } },
        { session: mongoSession }
      );
    }

    // Delete messages
    await ChatMessage_Model.deleteMany({ sessionId }, { session: mongoSession });

    // Delete session
    await ChatSession_Model.deleteOne({ sessionId }, { session: mongoSession });

    await mongoSession.commitTransaction();
  } catch (error) {
    await mongoSession.abortTransaction();
    throw error;
  } finally {
    mongoSession.endSession();
  }
};

/**
 * Get user sessions
 */
const get_user_sessions_from_db = async (
  userId: string,
  limit: number = 50,
  skip: number = 0
): Promise<TSessionSummary[]> => {
  const sessions = await ChatSession_Model.find({
    userId,
    isDeleted: false,
  })
    .sort({ updatedAt: -1 })
    .limit(limit)
    .skip(skip)
    .lean();

  const sessionIds = sessions.map((s) => s.sessionId);

  const messageCounts = await ChatMessage_Model.aggregate([
    {
      $match: {
        sessionId: { $in: sessionIds },
        messageType: "prompt",
        isDeleted: false,
      },
    },
    {
      $group: {
        _id: "$sessionId",
        count: { $sum: 1 },
        lastMessageAt: { $max: "$createdAt" },
      },
    },
  ]);

  const countMap = new Map(
    messageCounts.map((mc) => [mc._id, { count: mc.count, lastMessageAt: mc.lastMessageAt }])
  );

  return sessions.map((s) => {
    const stats = countMap.get(s.sessionId) || {
      count: 0,
      lastMessageAt: s.createdAt,
    };
    return {
      sessionId: s.sessionId,
      title: s.title || "Untitled Chat",
      messageCount: stats.count,
      lastMessageAt: stats.lastMessageAt,
      createdAt: s.createdAt!,
      updatedAt: s.updatedAt!,
    };
  });
};

const update_session_title_into_bd = async (sessionId: string, newTitle: string) => {
  const updatedSession = await ChatSession_Model.findOneAndUpdate(
    { sessionId },
    { title: newTitle },
    { new: true }
  );

  if (!updatedSession) {
    throw new AppError(500, "Failed to update session title");
  }

  return "";
};

const handle_ai_image = async (userId: string, sessionId: string, prompt: string) => {
  // 1 Ensure session exists
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    await ensure_session_exists(userId, sessionId, session, prompt);
    await session.commitTransaction();
  } catch (err) {
    if (session.inTransaction()) await session.abortTransaction();
    session.endSession();
    throw err;
  } finally {
    session.endSession();
  }

  // 2️⃣ Call AI Image API
  const aiResponse = await call_ai_image_service({
    session_id: sessionId,
    prompt,
    size: "1024x1024",
    compress: true,
    max_size_kb: 500,
  });

  // 3️⃣ Convert base64 -> file and upload to Cloudinary
  const base64Data = aiResponse.url.split(";base64,").pop();
  const buffer = Buffer.from(base64Data!, "base64");
  const filePath = `uploads/${Date.now()}-${sessionId}.jpg`;
  await fs.promises.writeFile(filePath, buffer);

  const cloudinaryResult = await uploadToCloudinary(filePath);

  // 4️⃣ Store image response in DB (message + adapter)
  const message = await ChatMessage_Model.create({
    sessionId,
    messageType: "response",
    sequenceNumber: Date.now(), // or your normal sequence system
    content: "[IMAGE_GENERATED]",
    selectedAdapter: aiResponse.adapter,
    userId,
  });

  await AdapterResponse_Model.create({
    messageId: message._id,
    adapter: aiResponse.adapter,
    text: prompt, // store prompt text for reference
    image: {
      url: cloudinaryResult.url,
      publicId: cloudinaryResult.public_id,
      compressed: aiResponse.compressed,
      originalSizeKb: aiResponse.original_size_kb,
      compressedSizeKb: aiResponse.compressed_size_kb,
    },
    isSelected: true,
  });

  return {
    sessionId,
    prompt,
    imageUrl: cloudinaryResult.url,
    adapter: aiResponse.adapter,
  };
};

// ============= Helper Functions =============

const call_ai_service = async (sessionId: string, prompt: string): Promise<TAIServiceResponse> => {
  const aiServiceUrl = process.env.AI_SERVICE_URL || "http://localhost:5000/api/ai/chat";
  const timeout = parseInt(process.env.AI_SERVICE_TIMEOUT || "30000", 10);

  try {
    const response = await axios.post<TAIServiceResponse>(
      aiServiceUrl,
      {
        session_id: sessionId,
        prompt: prompt,
      },
      {
        timeout,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.data.selected || !response.data.responses) {
      throw new AppError(502, "Invalid AI service response format");
    }

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      if (axiosError.code === "ECONNABORTED") {
        throw new AppError(504, "AI service request timeout");
      }
      if (axiosError.response) {
        throw new AppError(502, `AI service error: ${axiosError.response.status}`);
      }
    }
    throw new AppError(502, "Failed to connect to AI service");
  }
};

const store_ai_response = async (
  sessionId: string,
  userId: string,
  sequenceNumber: number,
  aiResponse: TAIServiceResponse,
  session: mongoose.ClientSession
): Promise<void> => {
  const [responseMessage] = await ChatMessage_Model.create(
    [
      {
        sessionId,
        messageType: "response",
        sequenceNumber,
        content: aiResponse.selected.text,
        selectedAdapter: aiResponse.selected.adapter,
        userId,
      },
    ],
    { session }
  );

  const adapterResponses = aiResponse.responses.map((resp) => ({
    messageId: responseMessage._id,
    adapter: resp.adapter,
    text: resp.text,
    isSelected: resp.adapter === aiResponse.selected.adapter,
  }));

  await AdapterResponse_Model.insertMany(adapterResponses, { session });

  await ChatSession_Model.findOneAndUpdate({ sessionId }, { updatedAt: new Date() }, { session });
};

const ensure_session_exists = async (
  userId: string,
  sessionId: string,
  session: mongoose.ClientSession,
  prompt: string
): Promise<void> => {
  const title = prompt.slice(0, 40);
  const exists = await ChatSession_Model.findOne({ sessionId });
  if (!exists) {
    await ChatSession_Model.create([{ sessionId, userId, title }], { session });
  } else if (exists.userId.toString() !== userId) {
    throw new AppError(403, "Session belongs to another user");
  }
};

const get_next_sequence_number = async (sessionId: string): Promise<number> => {
  const lastMessage = await ChatMessage_Model.findOne({ sessionId })
    .sort({ sequenceNumber: -1 })
    .select("sequenceNumber")
    .lean();

  return lastMessage ? lastMessage.sequenceNumber + 1 : 1;
};

const group_messages_by_sequence = (
  messages: any[],
  adapterResponseMap: Map<string, TAdapterResponse[]>
): TConversationHistory["messages"] => {
  const grouped = new Map<number, any>();

  messages.forEach((msg) => {
    if (!grouped.has(msg.sequenceNumber)) {
      grouped.set(msg.sequenceNumber, {
        sequenceNumber: msg.sequenceNumber,
        prompt: "",
        response: {
          selected: { adapter: "", text: "" },
          allResponses: [],
        },
        timestamp: msg.createdAt,
      });
    }

    const item = grouped.get(msg.sequenceNumber)!;

    if (msg.messageType === "prompt") {
      item.prompt = msg.content;
    } else if (msg.messageType === "response") {
      const responses = adapterResponseMap.get(msg._id.toString()) || [];
      item.response.selected = {
        adapter: msg.selectedAdapter,
        text: msg.content,
      };
      item.response.allResponses = responses;
    }
  });

  return Array.from(grouped.values()).sort((a, b) => a.sequenceNumber - b.sequenceNumber);
};

export const chat_service = {
  send_prompt_to_ai,
  get_session_history_from_db,
  update_prompt_in_db,
  update_selected_adapter_in_db,
  delete_session_from_db,
  get_user_sessions_from_db,
  update_session_title_into_bd,
  handle_ai_image,
};
