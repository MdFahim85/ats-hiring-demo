import express from "express";

import {
  authMiddleware,
  roleMiddleware,
  upload,
} from "../controllers/_middlewares";
import { User } from "../models/User";
import ROUTEMAP from "./ROUTEMAP";
import {
  deleteUser,
  editUser,
  getAllUsers,
  getSelf,
  getUserById,
  userLogin,
  userLogout,
  userRegister,
} from "../controllers/user";

const userRouter = express.Router();

userRouter.get(ROUTEMAP.users.self, authMiddleware, getSelf);
userRouter.get(ROUTEMAP.users.get, authMiddleware, getAllUsers);
userRouter.get(
  ROUTEMAP.users.getById,
  authMiddleware,
  roleMiddleware(["admin", "hr"]),
  getUserById,
);
userRouter.post(ROUTEMAP.users.userLogout, userLogout);
userRouter.post(ROUTEMAP.users.userLogin, userLogin);
userRouter.post(
  ROUTEMAP.users.userRegister,
  upload.fields([
    { name: "profilePicture" satisfies keyof User },
    { name: "cvUrl" satisfies keyof User },
  ]),
  userRegister,
);

userRouter.put(
  ROUTEMAP.users.put,
  authMiddleware,
  upload.fields([{ name: "profilePicture" satisfies keyof User }]),
  editUser,
);
userRouter.delete(ROUTEMAP.users.delete, authMiddleware, deleteUser);

export default userRouter;
