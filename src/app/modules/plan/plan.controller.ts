import Stripe from "stripe";
import { AppError } from "../../utils/app_error";
import catchAsync from "../../utils/catch_async";
import { sendResponse } from "../../utils/send_response";
import { plan_service } from "./plan.service";
import { User_Model } from "../auth/auth.schema";
import { Request, Response } from "express";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export const handle_stripe_webhook = async (req: Request, res: Response) => {
  console.log("📩 Webhook received");
  const sig = req.headers["stripe-signature"];

  if (!sig) {
    return res.status(400).send("No signature found");
  }

  let event: Stripe.Event;

  try {
    // Verify Stripe signature
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
      // Checkout session completed (subscriptions)
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        if (!session.subscription || !session.customer) {
          console.warn("⚠️ Missing subscription or customer in session");
          break;
        }

        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        );

        const user = await User_Model.findOne({
          stripeCustomerId: session.customer,
        });

        if (user) {
          user.subscriptionId = subscription.id;
          user.subscriptionStatus = subscription.status;
          user.trialEndsAt = subscription.trial_end
            ? new Date(subscription.trial_end * 1000)
            : user.trialEndsAt;
          user.hasUsedTrial = true;
          await user.save();
          console.log(`✅ Updated user ${user.email} subscription info`);
        } else {
          console.warn("⚠️ No user found for Stripe customer:", session.customer);
        }
        break;
      }

      // ✅ Subscription updated
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await User_Model.findOneAndUpdate(
          { stripeCustomerId: subscription.customer },
          {
            subscriptionStatus: subscription.status,
            trialEndsAt: subscription.trial_end
              ? new Date(subscription.trial_end * 1000)
              : null,
          }
        );
        console.log(`🔔 Subscription updated for ${subscription.customer}: ${subscription.status}`);
        break;
      }

      // ❌ Subscription deleted
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await User_Model.findOneAndUpdate(
          { stripeCustomerId: subscription.customer },
          { subscriptionStatus: "canceled" } // Explicitly set to canceled or 'none'
        );
        console.log(`❌ Subscription deleted for ${subscription.customer}`);
        break;
      }

      // 💰 Invoice payment succeeded (Renewals)
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        if ((invoice as any).subscription) {
          await User_Model.findOneAndUpdate(
            { stripeCustomerId: invoice.customer },
            { subscriptionStatus: "active" }
          );
          console.log(`✅ Invoice paid for ${invoice.customer}, subscription active.`);
        }
        break;
      }

      // ⚠️ Invoice payment failed
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        if ((invoice as any).subscription) {
          await User_Model.findOneAndUpdate(
            { stripeCustomerId: invoice.customer },
            { subscriptionStatus: "past_due" }
          );
          console.warn(`⚠️ Invoice payment failed for ${invoice.customer}, status: past_due`);
        }
        break;
      }

      // PaymentIntent succeeded (one-time payments - optional if not using one-time)
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log("💰 PaymentIntent succeeded:", paymentIntent.id);
        break;
      }

      // Charge succeeded
      case "charge.succeeded": {
        const charge = event.data.object as Stripe.Charge;
        console.log("💳 Charge succeeded:", charge.id);
        break;
      }

      default:
        console.log(`⚠️ Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error("❌ Error handling webhook:", err);
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

const cancel_subscription = catchAsync(async (req, res) => {
  const userId = req.user?.userId;
  const result = await plan_service.cancel_subscription(userId);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Subscription canceled successfully",
    data: result,
  });
});

export const plan_controller = {
  get_all_plan,
  create_plan,
  stripe_checkout,
  cancel_subscription,
};
