import { RequestHandler } from "express";
import status from "http-status";

import NotificationModel, { Notification } from "../models/Notification";
import ROUTEMAP from "../routes/ROUTEMAP";
import ResponseError from "../utils/ResponseError";
import { idValidator } from "../utils/validators";

// Get all notifications for current user
export const getAllNotifications: RequestHandler<{}, Notification[]> = async (
  req,
  res,
) => {
  const user = req.user;

  if (!user)
    throw new ResponseError("You are not logged in", status.BAD_REQUEST);

  const notifications = await NotificationModel.getNotificationsByUserId(
    user.id,
  );
  res.json(notifications);
};

// Get notification by id
export const getNotificationById: RequestHandler<
  Partial<typeof ROUTEMAP.notifications._params>,
  Notification
> = async (req, res) => {
  const { id } = await idValidator.parseAsync({ id: req.params.id });

  const notification = await NotificationModel.getNotificationById(id);
  if (!notification)
    throw new ResponseError("Notification not found", status.NOT_FOUND);

  res.json(notification);
};

// Get unread notifications
export const getUnreadNotifications: RequestHandler<
  {},
  { count: number; notifications: Notification[] }
> = async (req, res) => {
  const user = req.user;

  if (!user)
    throw new ResponseError("You are not logged in", status.BAD_REQUEST);

  const notifications = await NotificationModel.getUnreadNotificationsByUserId(
    user.id,
  );
  const count = await NotificationModel.getUnreadNotificationCount(user.id);

  res.json({
    count,
    notifications,
  });
};

// Mark notification as read
export const markAsRead: RequestHandler<
  Partial<typeof ROUTEMAP.notifications._params>,
  { message: string; data: Notification }
> = async (req, res) => {
  const { id } = await idValidator.parseAsync({ id: req.params.id });
  const user = req.user;

  if (!user)
    throw new ResponseError("You are not logged in", status.BAD_REQUEST);

  const dbNotification = await NotificationModel.getNotificationById(id);
  if (!dbNotification)
    throw new ResponseError("Notification not found", status.NOT_FOUND);

  // Check if notification belongs to user
  if (dbNotification.userId !== user.id) {
    throw new ResponseError(
      "You can only mark your own notifications as read",
      status.FORBIDDEN,
    );
  }

  const result = await NotificationModel.markAsRead(id);

  if (!result) {
    throw new ResponseError(
      "Failed to mark notification as read",
      status.BAD_REQUEST,
    );
  }

  res.json({
    message: "Notification marked as read",
    data: result,
  });
};

// Mark all notifications as read
export const markAllAsRead: RequestHandler<
  {},
  { message: string; count: number }
> = async (req, res) => {
  const user = req.user;

  if (!user)
    throw new ResponseError("You are not logged in", status.BAD_REQUEST);

  const count = await NotificationModel.markAllAsReadByUserId(user.id);

  res.json({
    message: "All notifications marked as read",
    count,
  });
};

// Delete notification
export const deleteNotification: RequestHandler<
  Partial<typeof ROUTEMAP.notifications._params>,
  { message: string }
> = async (req, res) => {
  const { id } = await idValidator.parseAsync({ id: req.params.id });
  const user = req.user;

  if (!user)
    throw new ResponseError("You are not logged in", status.BAD_REQUEST);

  const dbNotification = await NotificationModel.getNotificationById(id);
  if (!dbNotification)
    throw new ResponseError("Notification not found", status.NOT_FOUND);

  // Check if notification belongs to user
  if (dbNotification.userId !== user.id) {
    throw new ResponseError(
      "You can only delete your own notifications",
      status.FORBIDDEN,
    );
  }

  const result = await NotificationModel.deleteNotification(id);
  if (!result) {
    throw new ResponseError(
      "Failed to delete notification",
      status.BAD_REQUEST,
    );
  }

  res.json({ message: result });
};
