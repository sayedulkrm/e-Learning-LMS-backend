import { NextFunction, Request, Response } from "express";
import { catchAsyncError } from "../middlewares/catchAsyncError";
import cloudinary from "cloudinary";
import ErrorHandler from "../utils/errorHandler";
import { createCourse } from "../services/course.service";
import CourseModal from "../models/course.model";

// Upload course
export const uploadCourse = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = req.body;

            const thumbnail = data.thumbnail;

            if (!thumbnail) {
                return next(new ErrorHandler("Please upload a thumbnail", 400));
            }

            if (thumbnail) {
                const mycloud = await cloudinary.v2.uploader.upload(thumbnail, {
                    folder: "courses",
                });

                data.thumbnail = {
                    public_id: mycloud.public_id,
                    url: mycloud.secure_url,
                };
            }

            createCourse(data, res, next);
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 500));
        }
    }
);

// Edit Course
export const editCourse = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const courseId = req.params.id;

            const data = req.body;

            const thumbnail = data.thumbnail;

            if (thumbnail) {
                await cloudinary.v2.uploader.destroy(thumbnail.public_id);

                const mycloud = await cloudinary.v2.uploader.upload(thumbnail, {
                    folder: "courses",
                });

                data.thumbnail = {
                    public_id: mycloud.public_id,
                    url: mycloud.secure_url,
                };
            }

            const course = await CourseModal.findById(courseId);

            if (!course) {
                return next(new ErrorHandler("Course Not Found", 400));
            }

            const updatedCourse = await CourseModal.findByIdAndUpdate(
                courseId,
                { $set: data },
                { new: true }
            );

            res.status(200).json({
                sucess: true,
                message: "Course Updated Successfully",
                updatedCourse,
            });
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 500));
        }
    }
);
