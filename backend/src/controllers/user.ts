import { RequestHandler } from "express";
import { promises as fs } from "fs";
import status from "http-status";
import path from "path";

import config, { jwtToken } from "../config";
import { db } from "../config/database";
import env from "../config/env";
import UserModel, {
  addUserSchema,
  updateUserSchema,
  User,
  UserWithOutPassword,
} from "../models/User";
import {
  fileExists,
  generateAccessToken,
  passwordChecker,
  passwordHash,
} from "../utils";
import ResponseError from "../utils/ResponseError";
import {
  idValidator,
  imageValidator,
  pdfValidator,
  userValidator,
} from "../utils/validators";
import ROUTEMAP from "../routes/ROUTEMAP";

// Get self
export const getSelf: RequestHandler<{}, Omit<User, "password">> = (
  req,
  res,
) => {
  res.send(req.user);
};

export const getAllUsers: RequestHandler<{}, UserWithOutPassword[]> = async (
  _,
  res,
) => {
  res.json(await UserModel.getUsers());
};

// User Logout
export const userLogout: RequestHandler<{}, { message: string }> = async (
  _,
  res,
) => {
  res.clearCookie(jwtToken);
  res.json({ message: "Logout successful" });
};

// User Login
export const userLogin: RequestHandler<
  {},
  { message: string },
  Partial<User>
> = async (req, res) => {
  const { email, password } = await userValidator.parseAsync(req.body);

  const user = await UserModel.getUserByEmail(email);
  if (!user) throw new ResponseError("User not found", status.NOT_FOUND);

  const match = await passwordChecker(password, user.password!);
  if (!match)
    throw new ResponseError("Invalid email or password", status.UNAUTHORIZED);

  const token = generateAccessToken(user.id);
  res.cookie(jwtToken, token, {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: "lax",
    secure: env.isProduction,
  });

  res.json({ message: "Login successful" });
};

// Register
export const userRegister: RequestHandler<
  {},
  { message: string },
  User & { json?: string }
> = async (req, res) => {
  // Read files from multer
  const { profilePicture, cvUrl } = req.files as {
    [key in keyof User]?: Express.Multer.File[];
  };

  const json: User = JSON.parse(req.body.json || "");

  // Handle profile picture
  if (profilePicture?.[0]?.size) {
    if (!(await imageValidator(profilePicture[0].path))) {
      await fs.unlink(profilePicture[0].path);
      throw new ResponseError(
        "Invalid profile picture format",
        status.UNSUPPORTED_MEDIA_TYPE,
      );
    }
    json.profilePicture = profilePicture[0].filename;
  } else {
    const picture = json.name + ".png";
    await fs.copyFile(
      path.join(
        __dirname,
        "../../../backend/src/controllers/_seed/media/avatar.png",
      ),
      path.join(config.imageDir, picture),
    );
    json.profilePicture = picture;
  }

  // Handle CV upload (for candidates only)
  if (json.role === "candidate" && cvUrl?.[0]?.size) {
    if (!(await pdfValidator(cvUrl[0].path))) {
      await fs.unlink(cvUrl[0].path);
      throw new ResponseError(
        "Invalid pdf format",
        status.UNSUPPORTED_MEDIA_TYPE,
      );
    }
    json.cvUrl = cvUrl[0].filename;
  }

  json.createdAt = new Date();
  const userData = await addUserSchema.parseAsync(json);

  const hashedPassword = await passwordHash(userData.password!);
  userData.password = hashedPassword;

  const user = await db.transaction(async (tx) => {
    const result = await UserModel.addUser(userData, tx);

    if (!result) {
      if (profilePicture?.[0] && (await fileExists(profilePicture[0].path)))
        await fs.unlink(profilePicture[0].path);
      if (cvUrl?.[0] && (await fileExists(cvUrl[0].path)))
        await fs.unlink(cvUrl[0].path);
      tx.rollback();
      throw new ResponseError("Failed to create user", status.BAD_REQUEST);
    }

    return result;
  });

  const token = generateAccessToken(user.id);
  res.cookie(jwtToken, token, {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: "lax",
    secure: env.isProduction,
  });

  res.status(201).json({
    message: "Registration successful",
  });
};

export const editUser: RequestHandler<
  Partial<typeof ROUTEMAP.users._params>,
  { message: string; data: User },
  Partial<User> & { oldPassword?: string } & { json?: string }
> = async (req, res) => {
  // Id validation
  const { id } = await idValidator.parseAsync(req.params);

  // Read files from multer
  const { profilePicture, cvUrl } = req.files as {
    [key in keyof User]?: Express.Multer.File[];
  };

  const json: User & { oldPassword?: string } = JSON.parse(req.body.json || "");
  const newFilePath = profilePicture?.[0]?.path;
  const newCvPath = cvUrl?.[0]?.path;

  //Set image path to file path if new file is provided
  if (profilePicture?.[0]?.size) {
    // Check if actual image
    if (!(await imageValidator(profilePicture[0].path))) {
      await fs.unlink(profilePicture[0].path);
      throw new ResponseError(
        "Invalid profile picture format",
        status.UNSUPPORTED_MEDIA_TYPE,
      );
    }
    // Continue
    json.profilePicture = profilePicture[0].filename;
  }

  if (cvUrl?.[0]?.size) {
    // Check if actual image
    if (!(await pdfValidator(cvUrl[0].path))) {
      await fs.unlink(cvUrl[0].path);
      throw new ResponseError(
        "Invalid pdf format",
        status.UNSUPPORTED_MEDIA_TYPE,
      );
    }
    // Continue
    json.cvUrl = cvUrl[0].filename;
  }

  json.createdAt = new Date();

  // Separating old password and new details
  const { oldPassword, ...userDetails } = json;

  // User lookup and throw on failed query
  const user = await db.transaction(async (tx) => {
    const dbUser = await UserModel.getUserById(id, tx);
    if (!dbUser) throw new ResponseError("User not found", status.NOT_FOUND);

    // If old and new password is provided
    if (oldPassword?.length && userDetails.password!.length) {
      const match = await passwordChecker(oldPassword, dbUser.password!);
      if (!match) throw new ResponseError("Password doesnt match");
      if (oldPassword === userDetails.password)
        throw new ResponseError(
          "Password cannot be same as the old password",
          status.CONFLICT,
        );
      const passwordValidator = updateUserSchema.pick({ password: true });
      const newPass = await passwordValidator.parseAsync(userDetails);
      userDetails.password = await passwordHash(newPass.password!);
    } else {
      userDetails.password = dbUser.password;
    }

    // User update
    const result = await UserModel.editUser(
      id,
      await updateUserSchema.parseAsync(userDetails),
    );

    // Rollback and throw on error
    if (!result) {
      if (newFilePath && (await fileExists(newFilePath))) {
        await fs.unlink(newFilePath);
      }

      if (newCvPath && (await fileExists(newCvPath))) {
        await fs.unlink(newCvPath);
      }

      tx.rollback();
      throw new ResponseError("Failed to update user", status.BAD_REQUEST);
    }

    const oldImagePath = path.join(config.imageDir, dbUser.profilePicture);
    // If new file is uploaded then delete prev one and update the file url
    if (newFilePath && oldImagePath && (await fileExists(oldImagePath))) {
      await fs.unlink(oldImagePath);
    }

    return result;
  });
  res.json({
    message: "User has been updated successfully",
    data: user,
  });
};

// Delete user
export const deleteUser: RequestHandler<
  Partial<typeof ROUTEMAP.users._params>,
  { message: string },
  Pick<User, "password">
> = async (req, res) => {
  // Id validation
  const { id } = await idValidator.parseAsync(req.params);

  const { password } = req.body;
  if (!password) {
    throw new ResponseError(
      "Password required to delete user",
      status.UNAUTHORIZED,
    );
  }

  // User lookup, password check and throw on failed query
  const dbUser = await UserModel.getUserById(id);
  if (dbUser) {
    const match = await passwordChecker(password, dbUser.password!);
    if (!match) throw new ResponseError("Password doesnt match");
  }

  const result = await UserModel.deleteUser(id);
  if (!result) {
    throw new ResponseError("Failed to delete user", status.BAD_REQUEST);
  }

  res.json({ message: result });
};
