import { Router } from "express";
import { authRouter } from "./app/modules/auth/auth.route";
import { profileRoute } from "./app/modules/profile/profile.route";
import { planRoute } from "./app/modules/plan/plan.route";
import { chatRouter } from "./app/modules/ai_session/ai_session.route";

const appRouter = Router();

const moduleRoutes = [
  { path: "/auth", route: authRouter },
  { path: "/profile", route: profileRoute },
  { path: "/plan", route: planRoute },
  { path: "/ai", route: chatRouter },
];

moduleRoutes.forEach((route) => appRouter.use(route.path, route.route));

export default appRouter;
