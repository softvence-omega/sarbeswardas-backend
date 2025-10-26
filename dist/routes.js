"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_route_1 = require("./app/modules/auth/auth.route");
const profile_route_1 = require("./app/modules/profile/profile.route");
const plan_route_1 = require("./app/modules/plan/plan.route");
const ai_session_route_1 = require("./app/modules/ai_session/ai_session.route");
const appRouter = (0, express_1.Router)();
const moduleRoutes = [
    { path: "/auth", route: auth_route_1.authRouter },
    { path: "/profile", route: profile_route_1.profileRoute },
    { path: "/plan", route: plan_route_1.planRoute },
    { path: "/ai", route: ai_session_route_1.chatRouter },
];
moduleRoutes.forEach((route) => appRouter.use(route.path, route.route));
exports.default = appRouter;
