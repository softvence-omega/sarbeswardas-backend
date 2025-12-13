import mongoose from "mongoose";
import { app } from "./app";
import config from "./app/config";
import { startTrialNotifications } from "./app/cron/trialNotification";

async function main() {
  try {
    startTrialNotifications();
    await mongoose.connect(config.database_url!);
    app.listen(config.port, () => {
      console.log(`Server listening on port ${config.port}`);
    });
  } catch (error) {
    console.log(error);
  }
}

main();
