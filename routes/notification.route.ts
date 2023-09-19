import express from "express";
import { authorizeRoles, isAuthenticated } from "../middlewares/auth";
import {
    getNotifications,
    updateNotification,
} from "../controllers/notification.controller";
const notificationRoute = express.Router();

// Admin routes only ====>
notificationRoute
    .route("/get-all-notifications")
    .get(isAuthenticated, authorizeRoles("admin"), getNotifications);

notificationRoute
    .route("/update-notification/:id")
    .put(isAuthenticated, authorizeRoles("admin"), updateNotification);

export default notificationRoute;
