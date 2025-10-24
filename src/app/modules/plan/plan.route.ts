import { Router } from "express";
import { plan_controller } from "./plan.controller";
import auth from "../../middlewares/auth";

const router = Router();

router.get("/all", plan_controller.get_all_plan);
router.post("/create", plan_controller.create_plan);
router.post("/checkout", auth(), plan_controller.stripe_checkout);

export const planRoute = router;
