// src/modules/chat/chat.controller.ts

import { Request, Response } from "express";
import catchAsync from "../../utils/catch_async";
import { chat_service } from "./ai_session.service";
import { sendResponse } from "../../utils/send_response";

/**
 * POST /api/chat/send
 * Send prompt to AI and get response
 */
const send_prompt = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const { session_id, prompt } = req.body;

  const result = await chat_service.send_prompt_to_ai(userId, session_id, prompt);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Prompt processed successfully",
    data: result,
  });
});

/**
 * GET /api/chat/session/:sessionId
 * Get conversation history for a session
 */
const get_session_history = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const { sessionId } = req.params;

  const history = await chat_service.get_session_history_from_db(userId, sessionId);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Session history retrieved successfully",
    data: history,
  });
});

/**
 * PUT /api/chat/prompt
 * Update prompt and regenerate response
 */
const update_prompt = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const { session_id, sequence_number, new_prompt } = req.body;

  const result = await chat_service.update_prompt_in_db(
    userId,
    session_id,
    sequence_number,
    new_prompt
  );

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Prompt updated and response regenerated successfully",
    data: result,
  });
});

/**
 * PATCH /api/chat/selection
 * Update selected adapter for a response
 */
const update_selection = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const { session_id, sequence_number, selected_adapter } = req.body;

  await chat_service.update_selected_adapter_in_db(
    userId,
    session_id,
    sequence_number,
    selected_adapter
  );

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Selected adapter updated successfully",
  });
});

/**
 * DELETE /api/chat/session/:sessionId
 * Delete a session and all its messages
 */
const delete_session = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const { sessionId } = req.params;

  await chat_service.delete_session_from_db(userId, sessionId);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Session deleted successfully",
  });
});

/**
 * GET /api/chat/sessions
 * Get all sessions for the current user
 */
const get_user_sessions = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const limit = parseInt(req.query.limit as string) || 50;
  const skip = parseInt(req.query.skip as string) || 0;

  const sessions = await chat_service.get_user_sessions_from_db(userId, limit, skip);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "User sessions retrieved successfully",
    data: {
      sessions,
      total: sessions.length,
      limit,
      skip,
    },
  });
});

export const chat_controller = {
  send_prompt,
  get_session_history,
  update_prompt,
  update_selection,
  delete_session,
  get_user_sessions,
};