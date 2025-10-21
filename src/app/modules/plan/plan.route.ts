import { Router } from "express";
import { plan_controller } from "./plan.controller";

const router = Router();

router.get("/all", plan_controller.get_all_plan);
router.post("/create", plan_controller.create_plan);

export const planRoute = router;
