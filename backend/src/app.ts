import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import status from "http-status";

import env from "./config/env";
import { globalErrorHandler } from "./controllers/_middlewares";
import router from "./routes";
import ResponseError from "./utils/ResponseError";

const app = express();

// Configuring app
app.use(cors({ origin: env.frontend_API, credentials: true }));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Using the router for accessing the routes
app.use(router);

app.use(() => {
  throw new ResponseError("Route Not Found", status.NOT_FOUND);
});
app.use(globalErrorHandler);

export default app;
