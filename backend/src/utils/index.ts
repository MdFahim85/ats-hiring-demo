import bcrypt from "bcrypt";
import fs, { constants } from "fs/promises";
import jwt from "jsonwebtoken";

import env from "../config/env";

export async function fileExists(filePath: string) {
  try {
    await fs.access(filePath, constants.F_OK);
    return true;
  } catch (error) {
    return false;
  }
}

export const passwordHash = async (password: string) =>
  await bcrypt.hash(password, 10);

export const passwordChecker = async (
  userPassword: string,
  dbPassword: string,
) => await bcrypt.compare(userPassword, dbPassword);

export const generateAccessToken = (id: number) =>
  jwt.sign({ id } satisfies JwtToken, env.jwtSecret, { expiresIn: "5d" });
