import { eq, inArray, InferSelectModel } from "drizzle-orm";
import {
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import z from "zod";

import { db } from "../config/database";

export const userRoleEnum = pgEnum("userRole", ["candidate", "hr", "admin"]);
export const userStatusEnum = pgEnum("userStatus", ["active", "closed"]);

// User Schema
export const user = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  role: userRoleEnum("role").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  department: varchar("department", { length: 100 }),
  profilePicture: text("profile_picture").notNull(),
  cvUrl: text("cv_url"),
  status: userStatusEnum("status").notNull().default("active"),
  createdAt: timestamp("created_at", {
    mode: "date",
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
});

// User Schema Validators
export const addUserSchema = createInsertSchema(user, {
  id: (schema) => schema.transform(() => undefined),
  email: () => z.string().email().max(255),
  password: () => z.string().min(6).max(255),
  role: () => z.enum(["candidate", "hr", "admin"]),
  name: (schema) => schema.min(1).max(255),
  phone: (schema) => schema.max(20).nullable(),
  department: (schema) => schema.max(100).nullable(),
  cvUrl: (schema) => schema.nullable(),
  status: () => z.enum(["active", "closed"]),
  createdAt: (schema) => schema.transform(() => undefined),
});

export const updateUserSchema = createUpdateSchema(user, {
  id: (schema) => schema.transform(() => undefined),
  email: () => z.string().email().max(255),
  password: () => z.string().min(6).max(255),
  role: () => z.enum(["candidate", "hr", "admin"]),
  name: (schema) => schema.min(1).max(255),
  phone: (schema) => schema.max(20).nullable(),
  department: (schema) => schema.max(100).nullable(),
  cvUrl: (schema) => schema.nullable(),
  status: () => z.enum(["active", "closed"]),
  createdAt: (schema) => schema.transform(() => undefined),
});

// User type
export type User = InferSelectModel<typeof user>;

export type UserWithOutPassword = Omit<User, "password">;

export default class UserModel {
  // Get all users
  static getUsers = async (dbOrTx: DbOrTx = db) => {
    const users = (await dbOrTx.select().from(user)).map(
      ({ password, ...rest }) => rest,
    );
    return users;
  };

  static getAllUsers = async (dbOrTx: DbOrTx = db) => {
    return await dbOrTx.select().from(user);
  };
  // Get user by email
  static getUserByEmail = async (email: string, dbOrTx: DbOrTx = db) => {
    const users = await dbOrTx
      .select()
      .from(user)
      .where(eq(user.email, email))
      .limit(1);
    return users[0];
  };

  // Get user by id
  static getUserById = async (id: number, dbOrTx: DbOrTx = db) => {
    const users = await dbOrTx
      .select()
      .from(user)
      .where(eq(user.id, id))
      .limit(1);
    return users[0];
  };

  // Add a new user
  static addUser = async (userData: InsertModel<User>, dbOrTx: DbOrTx = db) => {
    const [newUser] = await dbOrTx.insert(user).values(userData).returning();
    if (!newUser) return undefined;
    return newUser satisfies User;
  };

  // Edit user
  static editUser = async (
    id: number,
    userData: Partial<User>,
    dbOrTx: DbOrTx = db,
  ) => {
    const [updatedUser] = await dbOrTx
      .update(user)
      .set(userData)
      .where(eq(user.id, id))
      .returning();
    return updatedUser;
  };

  // Delete user
  static deleteUser = async (id: number, dbOrTx: DbOrTx = db) => {
    const result = await dbOrTx.delete(user).where(eq(user.id, id));
    if (!result.rowCount) return undefined;
    return "User has been deleted successfully";
  };

  // Bulk get users by ids

  static getUsersByIds = async (ids: number[], dbOrTx: DbOrTx = db) => {
    return dbOrTx.select().from(user).where(inArray(user.id, ids));
  };

  // // Bulk user edit
  // static bulkEditUsers = async (
  //   ids: number[],
  //   data: Partial<Pick<User, "role" | "status">>,
  //   dbOrTx: DbOrTx = db,
  // ) => {
  //   if (!ids.length) return 0;

  //   const result = await dbOrTx
  //     .update(user)
  //     .set(data)
  //     .where(inArray(user.id, ids));

  //   return result.rowCount ?? 0;
  // };

  // // Bulk user delete
  // static bulkDeleteUsers = async (ids: number[], dbOrTx: DbOrTx = db) => {
  //   if (!ids.length) return 0;
  //   const result = await dbOrTx.delete(user).where(inArray(user.id, ids));
  //   return result.rowCount ?? 0;
  // };
}
