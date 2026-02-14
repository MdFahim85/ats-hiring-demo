import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import z from "zod";

import { user } from "./User";
import { eq, and, inArray, InferSelectModel } from "drizzle-orm";
import { db } from "../config/database";

// Notification Schema
export const notification = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 50 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  relatedEntityType: varchar("related_entity_type", { length: 50 }),
  relatedEntityId: integer("related_entity_id"),
  isRead: boolean("is_read").notNull().default(false),
  emailSent: boolean("email_sent").notNull().default(false),
  createdAt: timestamp("created_at", {
    mode: "date",
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
});

// Notification Schema Validators
export const addNotificationSchema = createInsertSchema(notification, {
  id: (schema) => schema.transform(() => undefined),
  userId: () => z.coerce.number().int().gt(0),
  type: (schema) => schema.min(1).max(50),
  title: (schema) => schema.min(1).max(255),
  message: (schema) => schema.min(1),
  relatedEntityType: (schema) => schema.max(50).nullable(),
  relatedEntityId: () => z.coerce.number().int().gt(0).nullable(),
  isRead: () => z.boolean(),
  emailSent: () => z.boolean(),
  createdAt: (schema) => schema.transform(() => undefined),
});

export const updateNotificationSchema = createUpdateSchema(notification, {
  id: (schema) => schema.transform(() => undefined),
  userId: () => z.coerce.number().int().gt(0),
  type: (schema) => schema.min(1).max(50),
  title: (schema) => schema.min(1).max(255),
  message: (schema) => schema.min(1),
  relatedEntityType: (schema) => schema.max(50).nullable(),
  relatedEntityId: () => z.coerce.number().int().gt(0).nullable(),
  isRead: () => z.boolean(),
  emailSent: () => z.boolean(),
  createdAt: (schema) => schema.transform(() => undefined),
});

export type Notification = InferSelectModel<typeof notification>;

export default class NotificationModel {
  // Get all notifications
  static getNotifications = async (dbOrTx: DbOrTx = db) => {
    return await dbOrTx.select().from(notification);
  };

  // Get notification by id
  static getNotificationById = async (id: number, dbOrTx: DbOrTx = db) => {
    const notifications = await dbOrTx
      .select()
      .from(notification)
      .where(eq(notification.id, id))
      .limit(1);
    return notifications[0];
  };

  // Get all notifications for a specific user
  static getNotificationsByUserId = async (
    userId: number,
    dbOrTx: DbOrTx = db,
  ) => {
    return await dbOrTx
      .select()
      .from(notification)
      .where(eq(notification.userId, userId));
  };

  // Get unread notifications for a user
  static getUnreadNotificationsByUserId = async (
    userId: number,
    dbOrTx: DbOrTx = db,
  ) => {
    return await dbOrTx
      .select()
      .from(notification)
      .where(
        and(eq(notification.userId, userId), eq(notification.isRead, false)),
      );
  };

  // Get unread notification count for a user
  static getUnreadNotificationCount = async (
    userId: number,
    dbOrTx: DbOrTx = db,
  ) => {
    const notifications = await dbOrTx
      .select()
      .from(notification)
      .where(
        and(eq(notification.userId, userId), eq(notification.isRead, false)),
      );
    return notifications.length;
  };

  // Add a new notification
  static addNotification = async (
    notificationData: InsertModel<Notification>,
    dbOrTx: DbOrTx = db,
  ) => {
    const [newNotification] = await dbOrTx
      .insert(notification)
      .values(notificationData)
      .returning();
    if (!newNotification) return undefined;
    return newNotification satisfies Notification;
  };

  // Mark notification as read
  static markAsRead = async (id: number, dbOrTx: DbOrTx = db) => {
    const [updatedNotification] = await dbOrTx
      .update(notification)
      .set({ isRead: true })
      .where(eq(notification.id, id))
      .returning();
    return updatedNotification;
  };

  // Mark all notifications as read for a user
  static markAllAsReadByUserId = async (
    userId: number,
    dbOrTx: DbOrTx = db,
  ) => {
    const result = await dbOrTx
      .update(notification)
      .set({ isRead: true })
      .where(
        and(eq(notification.userId, userId), eq(notification.isRead, false)),
      );
    return result.rowCount ?? 0;
  };

  // Delete notification
  static deleteNotification = async (id: number, dbOrTx: DbOrTx = db) => {
    const result = await dbOrTx
      .delete(notification)
      .where(eq(notification.id, id));
    if (!result.rowCount) return undefined;
    return "Notification has been deleted successfully";
  };

  // Delete all notifications for a user
  static deleteNotificationsByUserId = async (
    userId: number,
    dbOrTx: DbOrTx = db,
  ) => {
    const result = await dbOrTx
      .delete(notification)
      .where(eq(notification.userId, userId));
    return result.rowCount ?? 0;
  };

  // Bulk get notifications by ids
  static getNotificationsByIds = async (ids: number[], dbOrTx: DbOrTx = db) => {
    return dbOrTx
      .select()
      .from(notification)
      .where(inArray(notification.id, ids));
  };
}
