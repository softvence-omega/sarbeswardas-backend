import express from "express";
import useragent from "express-useragent";
import cors from "cors";
import appRouter from "./routes";
import notFound from "./app/middlewares/not_found_route";
import { globalErrorHandler } from "./app/middlewares/global_error_handler";

export const app = express();

// parsers
app.use(useragent.express());
app.use(express.json());
app.use(cors());

app.use("/api/v1", appRouter);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use(globalErrorHandler);
app.use(notFound);
