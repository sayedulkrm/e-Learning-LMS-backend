import { Response } from "express";
import CourseModal from "../models/course.model";
import { catchAsyncError } from "../middlewares/catchAsyncError";

// create a new Course
export const createCourse = catchAsyncError(
    async (data: any, res: Response) => {
        const course = await CourseModal.create(data);
        res.status(201).json({
            success: true,
            message: "Course Created Successfully. You can add lectures now",
            course,
        });
    }
);
