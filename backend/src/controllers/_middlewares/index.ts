import { DrizzleError, DrizzleQueryError } from "drizzle-orm";
import type { ErrorRequestHandler, RequestHandler } from "express";
import status from "http-status";
import jwt from "jsonwebtoken";
import multer from "multer";
import z, { ZodError, ZodSchema } from "zod";

import config from "../../config";
import env from "../../config/env";
import ResponseError from "../../utils/ResponseError";
import UserModel, { User } from "../../models/User";

export const globalErrorHandler = ((err, _, res, __) => {
  if (!env.isProduction)
    console.dir(err, { colors: true, depth: 6, showHidden: true });
  const error = new ResponseError();

  if (err instanceof ZodError) {
    error.statusCode = status.UNPROCESSABLE_ENTITY;
    error.message = err.issues
      .map((issue) => {
        return `${issue}`;
      })
      .join(",");
  } else if (err instanceof ResponseError) {
    error.message = err.message;
    error.statusCode = err.statusCode;
  } else if (
    err instanceof DrizzleError ||
    err.code === "23505" || // Duplicate key entry.
    err.code === "23503" // Foreign key constraint violated.
  )
    error.message = "Please contact the developer";
  else if (err instanceof DrizzleQueryError) {
    if ((err.cause as any)?.code === "23505") {
      // Duplicate key entry.
      error.message = "Duplicate " + (err.cause as any)?.table;
      error.statusCode = status.CONFLICT;
    } else if ((err.cause as any)?.code === "23503") {
      // Foreign key constraint violated.
      error.message =
        "Unknown " +
        (err.cause as any)?.constraint
          .replace("_fkey", "")
          .replaceAll("_", " ");
      error.statusCode = status.UNPROCESSABLE_ENTITY;
    }
  }
  if (res.headersSent) return console.log("Already Sent Response");

  res
    .status(error.statusCode)
    .json({ message: error.message || status["500"] });
}) as ErrorRequestHandler;

const storage = multer.diskStorage({
  destination: (_, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, config.imageDir);
    } else {
      cb(null, config.pdfDir);
    }
  },
  filename: (_, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const fileFilter: multer.Options["fileFilter"] = (req, file, cb) => {
  if (
    file.fieldname === ("cvUrl" satisfies keyof User) &&
    file.mimetype !== "application/pdf"
  ) {
    cb(new ResponseError("Invalid PDF format", status.UNSUPPORTED_MEDIA_TYPE));
  } else if (
    file.fieldname === ("profilePicture" satisfies keyof User) &&
    !file.mimetype.startsWith("image/")
  ) {
    cb(
      new ResponseError(
        "Please upload a profile picture",
        status.UNSUPPORTED_MEDIA_TYPE,
      ),
    );
  } else {
    cb(null, true);
  }
};

export const upload = multer({
  storage,
  fileFilter,
});

export const authMiddleware: RequestHandler = async (req, _res, next) => {
  const { token } = req.cookies;
  if (!token)
    throw new ResponseError("No JWT token provided", status.UNAUTHORIZED);

  let verifiedToken: string | jwt.JwtPayload;

  try {
    verifiedToken = jwt.verify(token, env.jwtSecret);
  } catch (error) {
    throw new ResponseError("The JWT token is broken", status.UNAUTHORIZED);
  }

  if (!verifiedToken)
    throw new ResponseError(
      "No JWT token found, you are unauthorzied",
      status.UNAUTHORIZED,
    );

  const { id } = await jwtSchema.parseAsync(verifiedToken).catch((reason) => {
    console.error(reason);

    throw new ResponseError(
      "JWT token is invalid. Please provide a valid JWT token",
      status.UNPROCESSABLE_ENTITY,
    );
  });

  const user = await UserModel.getUserById(id);

  if (!user) throw new ResponseError("No valid user found", status.NOT_FOUND);

  // Omitting password
  const { password, ...userWithoutPass } = user;
  req.user = userWithoutPass;

  next();
};

export const roleMiddleware = (requiredRole: User["role"]): RequestHandler => {
  return (req, _res, next) => {
    const user = req.user;

    if (!user || user.role !== requiredRole) {
      throw new ResponseError(
        `You must have role "${requiredRole}" to access this resource`,
      );
    }

    next();
  };
};

const jwtSchema = z.object({
  id: z.number().int().min(1),
  iat: z.number().int().optional(),
} satisfies { [key in keyof JwtToken]: ZodSchema });
