import { NextFunction, Request, Response } from "express";
import { catchAsyncError } from "../middlewares/catchAsyncError";
import ErrorHandler from "../utils/errorHandler";
import { generateLast12MonthData } from "../utils/analytics.generator";
import UserModel from "../models/user.model";
import CourseModal from "../models/course.model";
import OrderModel from "../models/order.model";

// User Data Analytics  ===> Only Admin
export const usersDataAnalyticsAdmin = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const users = await generateLast12MonthData(UserModel);

            res.status(200).json({
                success: true,
                users,
            });
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 500));
        }
    }
);

// Course Data Analytics  ===> Only Admin
export const coursesDataAnalyticsAdmin = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const courses = await generateLast12MonthData(CourseModal);

            res.status(200).json({
                success: true,
                courses,
            });
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 500));
        }
    }
);

// Course Orders Analytics  ===> Only Admin
export const ordersDataAnalyticsAdmin = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const orders = await generateLast12MonthData(OrderModel);

            res.status(200).json({
                success: true,
                orders,
            });
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 500));
        }
    }
);
