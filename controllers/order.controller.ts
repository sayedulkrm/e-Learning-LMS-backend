import ejs from "ejs";
import sendMail from "../utils/sendMail";
import NotificationModel from "../models/notification.model";
import { catchAsyncError } from "../middlewares/catchAsyncError";
import { NextFunction, Request, Response } from "express";
import ErrorHandler from "../utils/errorHandler";
import { IOrder } from "../models/order.model";
import UserModel from "../models/user.model";
import CourseModal from "../models/course.model";
import { newOrder } from "../services/order.service";
import path from "path";

//
//
//

// create order

export const createOrder = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { courseId, payment_info } = req.body as IOrder;

            const user = await UserModel.findById(req.user?._id);

            if (!user) {
                return next(new ErrorHandler("User not found", 400));
            }

            const isCourseExist = user.courses.some(
                (course: any) => course._id.toString() === courseId
            );

            if (isCourseExist) {
                return next(new ErrorHandler("Course already exists", 400));
            }

            const course = await CourseModal.findById(courseId);

            if (!course) {
                return next(new ErrorHandler("Course not found", 400));
            }

            const data: any = {
                courseId: course._id,
                userId: user?._id,
                payment_info,
            };

            const mailData = {
                order: {
                    _id: course._id.toString().slice(0, 6),
                    name: course.name,
                    price: course.price,
                    date: new Date().toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                    }),
                },
                user: {
                    name: user.name,
                },
            };

            // 6:33:00 --->

            const html = await ejs.renderFile(
                path.join(__dirname, "../mails/order-confirmation.ejs"),
                mailData
            );

            try {
                if (user) {
                    await sendMail({
                        email: user.email,
                        subject: "Order Confirmation",
                        templete: "order-confirmation.ejs",
                        data: mailData,
                    });
                }
            } catch (error: any) {
                return next(new ErrorHandler(error.message, 500));
            }

            user?.courses.push(course?._id);

            await user?.save();

            await NotificationModel.create({
                user: user?._id,
                title: "New Order",
                message: `New Order has been placed for ${course?.name}`,
                userId: user?._id,
                courseId: course?._id,
            });

            course.purchased ? (course.purchased += 1) : course.purchased;

            await course.save();

            newOrder(data, res, next);
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 500));
        }
    }
);

//
