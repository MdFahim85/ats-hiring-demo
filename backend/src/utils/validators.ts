import fs from "fs/promises";
import z from "zod";
import zodCoerce from "./zodCoerce";
import ResponseError from "./ResponseError";

export const idValidator = z.object({
  id: zodCoerce.number().int().positive(),
});

export const bulkIdValidator = z.object({
  ids: z.array(zodCoerce.number().int().positive()).min(1),
});

export const userValidator = z.object({
  email: z
    .email({ message: "validation.email" })
    .max(255, { message: "validation.max_length" }),

  password: z
    .string()
    .min(6, { message: "validation.password_min" })
    .max(255, { message: "validation.max_length" }),
});

export const resetPasswordValidator = z.object({
  email: z.email(),
  token: z.string().min(1),
  newPassword: z.string().min(6).max(255),
});

export const dateValidator = z.object({
  date: z.string().regex(/^\d{2}-\d{2}-\d{4}/),
});

export const pdfValidator = async (filePath: string): Promise<boolean> => {
  const file = await fs.open(filePath, "r");

  try {
    const header = Buffer.alloc(5);
    await file.read(header, 0, 5, 0);

    return header.toString("utf8") === "%PDF-";
  } catch (error: any) {
    throw new ResponseError(error);
  } finally {
    await file.close();
  }
};

export const imageValidator = async (filePath: string): Promise<boolean> => {
  const file = await fs.open(filePath, "r");
  try {
    const buffer = Buffer.alloc(8);
    await file.read(buffer, 0, 8, 0);

    const hex = buffer.toString("hex").toUpperCase();

    const signatures = ["89504E47", "FFD8FF", "47494638", "52494646"];

    return signatures.some((sig) => hex.startsWith(sig));
  } catch (error: any) {
    throw new Error(error.message);
  } finally {
    await file.close();
  }
};
