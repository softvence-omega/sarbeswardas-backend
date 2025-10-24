import Stripe from "stripe";
import { AppError } from "../../utils/app_error";
import catchAsync from "../../utils/catch_async";
import { sendResponse } from "../../utils/send_response";
import { plan_service } from "./plan.service";
import { User_Model } from "../auth/auth.schema";
import { Request, Response } from "express";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export const handle_stripe_webhook = async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"];
  if (!sig) {
    return res.status(400).send("No signature found");
  }

  let event: Stripe.Event;

  try {
    // ✅ Verify Stripe signature
    event = stripe.webhooks.constructEvent(
      req.body,
      sig as string,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (err: any) {
    console.error("❌ Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      // ✅ Triggered after checkout session completed
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        if (!session.subscription || !session.customer) {
          console.warn("⚠️ Missing subscription or customer in session");
          break;
        }

        // Retrieve the subscription details from Stripe
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);

        // Find user by Stripe customer ID
        const user = await User_Model.findOne({
          stripeCustomerId: session.customer,
        });

        if (user) {
          user.subscriptionId = subscription.id;
          user.subscriptionStatus = subscription.status; // trialing | active | etc.
          user.trialEndsAt = subscription.trial_end
            ? new Date(subscription.trial_end * 1000)
            : user.trialEndsAt;
          user.hasUsedTrial = true;
          await user.save();
          console.log(` Updated user ${user.email} subscription info`);
        } else {
          console.warn(" No user found for Stripe customer:", session.customer);
        }
        break;
      }

      // Triggered when subscription is renewed, canceled, or status changed
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

        await User_Model.findOneAndUpdate(
          { stripeCustomerId: subscription.customer },
          {
            subscriptionStatus: subscription.status,
          },
          { new: true }
        );

        console.log(
          ` Subscription status updated for customer ${subscription.customer}: ${subscription.status}`
        );
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error(" Error handling webhook:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

const get_all_plan = catchAsync(async (req, res) => {
  const result = await plan_service.get_all_plan_from_db();

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Plan retrieved successfully",
    data: result,
  });
});

const create_plan = catchAsync(async (req, res) => {
  const payload = req.body;
  if (!payload) {
    throw new AppError(404, "Payload not found");
  }

  const result = await plan_service.create_plan_into_db(payload);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Plan retrieved successfully",
    data: result,
  });
});

const stripe_checkout = catchAsync(async (req, res) => {
  const { subscribedPlanId } = req.body;
  const userId = req.user?.userId;
  if (!subscribedPlanId) {
    throw new AppError(404, "subscribedPlanId not found in payload");
  }

  const result = await plan_service.create_checkout_session(userId, subscribedPlanId);

  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "Plan subscribed successfully",
    data: result,
  });
});

export const plan_controller = {
  get_all_plan,
  create_plan,
  stripe_checkout,
};
