import { Router } from "express";
import { authRouter } from "./app/modules/auth/auth.route";
import { profileRoute } from "./app/modules/profile/profile.route";

const appRouter = Router();

const moduleRoutes = [
  { path: "/auth", route: authRouter },
  { path: "/profile", route: profileRoute },
];

moduleRoutes.forEach((route) => appRouter.use(route.path, route.route));

export default appRouter;
