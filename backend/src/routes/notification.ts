import express from "express";

import ROUTEMAP from "./ROUTEMAP";
import {
  getAllNotifications,
  getNotificationById,
  getUnreadNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "../controllers/notification";

const notificationRouter = express.Router();

// All notification routes require authentication
notificationRouter.get(ROUTEMAP.notifications.get, getAllNotifications);
notificationRouter.get(ROUTEMAP.notifications.getById, getNotificationById);
notificationRouter.get(
  ROUTEMAP.notifications.getUnread,

  getUnreadNotifications,
);
notificationRouter.patch(
  ROUTEMAP.notifications.markAsRead,

  markAsRead,
);
notificationRouter.patch(
  ROUTEMAP.notifications.markAllAsRead,

  markAllAsRead,
);
notificationRouter.delete(
  ROUTEMAP.notifications.delete,

  deleteNotification,
);

export default notificationRouter;
