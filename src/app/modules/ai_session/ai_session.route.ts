import { Router } from "express";
import { chat_controller } from "./ai_session.controller";
import auth from "../../middlewares/auth";
import { verifySubscription } from "../../utils/verifySubscription";

const router = Router();

/***/
router.post("/send", auth(), verifySubscription(), chat_controller.send_prompt);

/***/
router.get("/session/:sessionId", auth(), chat_controller.get_session_history);

/***/
router.put("/prompt", auth(), verifySubscription(), chat_controller.update_prompt);

/***/
router.patch("/selection", auth(), chat_controller.update_selection);

/***/
router.delete("/session/:sessionId", auth(), chat_controller.delete_session);

/***/
router.get("/sessions", auth(), chat_controller.get_user_sessions);

/***/
router.patch("/session/update-title", auth(), chat_controller.update_session_title);

/***/
router.post("/generate-image", auth(), verifySubscription(), chat_controller.generate_ai_image);

export const chatRouter = router;
