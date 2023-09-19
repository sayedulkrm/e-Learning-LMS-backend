import { NextFunction, Request, Response } from "express";
import { catchAsyncError } from "../middlewares/catchAsyncError";
import ErrorHandler from "../utils/errorHandler";
import NotificationModel from "../models/notification.model";

// get all notifications -----> Admin Notification

export const getNotifications = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const notification = await NotificationModel.find().sort({
                createdAt: -1,
            });

            res.status(200).json({
                success: true,
                notification,
            });
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 500));
        }
    }
);

// update notification status -----> Admin Notification

export const updateNotification = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const notification = await NotificationModel.findById(
                req.params.id
            );

            if (!notification) {
                return next(new ErrorHandler("Notification not found", 404));
            }

            notification.status
                ? (notification.status = "read")
                : notification.status;

            await notification.save();

            const updatedNotification = await NotificationModel.find().sort({
                createdAt: -1,
            });

            res.status(200).json({
                success: true,
                updatedNotification,
            });
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 500));
        }
    }
);
