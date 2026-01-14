import cron from "node-cron";
import { User_Model } from "../modules/auth/auth.schema";
import { sendEmail } from "../utils/send_email";

export const startTrialNotifications = () => {
  // Run every day at midnight (00:00)
  cron.schedule("0 0 * * *", async () => {
    console.log("running trial notification cron job");
    try {
      const now = new Date();
      const twoDaysFromNow = new Date();
      twoDaysFromNow.setDate(now.getDate() + 2);

      // Define start and end of that specific day to match users whose trial ends on that day
      const startOfDay = new Date(twoDaysFromNow.setHours(0, 0, 0, 0));
      const endOfDay = new Date(twoDaysFromNow.setHours(23, 59, 59, 999));

      const usersToNotify = await User_Model.find({
        subscriptionStatus: "trialing",
        trialEndsAt: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
      });

      console.log(`Found ${usersToNotify.length} users to notify about trial ending.`);

      for (const user of usersToNotify) {
        if (!user.email) continue;
        
        const message = `
          <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h2>Your Free Trial is Ending Soon!</h2>
            <p>Hi ${user.fullName || "there"},</p>
            <p>We hope you're enjoying your premium features.</p>
            <p>This is a reminder that your free trial will end in <strong>2 days</strong>.</p>
            <p>After the trial ends, your access to AI features will be limited. If you wish to continue using these features, please subscribe to one of our premium plans.</p>
            <br/> 
            <p>Thank you,</p>
            <p>The Team</p>
          </div>
        `;

        try {
          await sendEmail(user.email, "Your Free Trial Ends in 2 Days", message);
          console.log(`Notification sent to ${user.email}`);
        } catch (emailError) {
          console.error(`Failed to send email to ${user.email}:`, emailError);
        }
      }
    } catch (error) {
      console.error("Error in trial notification cron job:", error);
    }
  });
};
