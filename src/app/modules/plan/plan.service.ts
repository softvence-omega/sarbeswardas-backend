import Stripe from "stripe";
import { AppError } from "../../utils/app_error";
import { User_Model } from "../auth/auth.schema";
import { Plan_Model } from "./plan.schema";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

const get_all_plan_from_db = async () => {
  const result = await Plan_Model.find();

  return result;
};

const create_plan_into_db = async (payload: any) => {
  const result = await Plan_Model.create(payload);

  return result;
};

const create_checkout_session = async (userId: string, planId: string) => {
  try {
    const user = await User_Model.findById(userId);
    if (!user) throw new AppError(404, "User not found");

    const plan = await Plan_Model.findById(planId);
    if (!plan) throw new AppError(404, "Plan not found");
console.log("user: ",user)
    if (!user.stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.fullName,
      });
      console.log("stripe customer: ", customer)
      user.stripeCustomerId = customer.id;
      await user.save();
    }

    // Decide trial dynamically
    const sessionConfig: any = {
      mode: "subscription",
      payment_method_types: ["card"],
      customer: user.stripeCustomerId,
      line_items: [
        {
          price: plan.priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.CLIENT_URL}/payment/success`,
      cancel_url: `${process.env.CLIENT_URL}/payment/cancel`,
    };

    //  Give trial only if user hasn’t used it before
    // if (!user.hasUsedTrial) {
    //   sessionConfig.subscription_data = {
    //     trial_period_days: 30,
    //   };
    // }

    const session = await stripe.checkout.sessions.create(sessionConfig);
    return { url: session.url };
  } catch (error) {
    console.error(error);
    throw new AppError(500, "Error creating checkout session");
  }
};

export const plan_service = {
  get_all_plan_from_db,
  create_plan_into_db,
  create_checkout_session,
};
