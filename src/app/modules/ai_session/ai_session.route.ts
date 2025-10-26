import { Router } from "express";
import { chat_controller } from "./ai_session.controller";
import auth from "../../middlewares/auth";
import { verifySubscription } from "../../utils/verifySubscription";

const router = Router();

/**
 * @route   POST /api/chat/send
 * @desc    Send a prompt to AI and get a response
 * @access  Protected
 */
router.post("/send", auth(), verifySubscription(), chat_controller.send_prompt);

/**
 * @route   GET /api/chat/session/:sessionId
 * @desc    Get conversation history for a session
 * @access  Protected
 */
router.get("/session/:sessionId", auth(), chat_controller.get_session_history);

/**
 * @route   PUT /api/chat/prompt
 * @desc    Update a prompt and regenerate response
 * @access  Protected
 */
router.put("/prompt", auth(), chat_controller.update_prompt);

/**
 * @route   PATCH /api/chat/selection
 * @desc    Update selected adapter for a response
 * @access  Protected
 */
router.patch("/selection", auth(), chat_controller.update_selection);

/**
 * @route   DELETE /api/chat/session/:sessionId
 * @desc    Delete a session and its messages
 * @access  Protected
 */
router.delete("/session/:sessionId", auth(), chat_controller.delete_session);

/**
 * @route   GET /api/chat/sessions
 * @desc    Get all chat sessions for a user
 * @access  Protected
 */
router.get("/sessions", auth(), chat_controller.get_user_sessions);

export const chatRouter = router;
