import { NextFunction, Request, Response } from "express";
import { catchAsyncError } from "../middlewares/catchAsyncError";
import cloudinary from "cloudinary";
import ErrorHandler from "../utils/errorHandler";
import { createCourse } from "../services/course.service";
import CourseModal from "../models/course.model";
import { connectRedis } from "../config/redis";
import mongoose from "mongoose";
import ejs from "ejs";
import path from "path";
import sendMail from "../utils/sendMail";

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

// get sigle Course
export const getSingleCourse = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const courseId = req.params.id;

            const isCatchedExist = await connectRedis.get(courseId);

            if (isCatchedExist) {
                const course = JSON.parse(isCatchedExist);
                res.status(200).json({
                    success: true,
                    course,
                });
            } else {
                const course = await CourseModal.findById(courseId).select(
                    "-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links"
                );

                await connectRedis.set(courseId, JSON.stringify(course));

                if (!course) {
                    return next(new ErrorHandler("Course Not Found", 400));
                }

                res.status(200).json({
                    success: true,
                    course,
                });
            }
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 500));
        }
    }
);

// get all courses ---> Without purchase
export const getAllCourses = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const isCatchedExist = await connectRedis.get("allCourses");

            if (isCatchedExist) {
                const courses = JSON.parse(isCatchedExist);
                res.status(200).json({
                    success: true,
                    courses,
                });
            } else {
                const courses = await CourseModal.find().select(
                    "-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links"
                );

                await connectRedis.set("allCourses", JSON.stringify(courses));

                res.status(200).json({
                    success: true,
                    courses,
                });
            }
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 500));
        }
    }
);

// Get course content ---> Only for valid user

export const getCourseByValidUser = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userCourseList = req.user?.courses;

            const courseId = req.params.id;

            const isCourseExist = userCourseList?.find(
                (course: any) => course._id.toString() === courseId
            );

            if (!isCourseExist) {
                return next(
                    new ErrorHandler(
                        "You're not allowed for this course. Please Purchased to access this.",
                        400
                    )
                );
            }

            const course = await CourseModal.findById(courseId);

            const content = course?.courseData;

            res.status(200).json({
                success: true,
                content,
            });
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 500));
        }
    }
);

// Add questions in Courses section
interface IAddQuestionsData {
    question: string;
    courseId: string;
    contentId: string;
}

export const addQuestions = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { question, courseId, contentId } =
                req.body as IAddQuestionsData;
            const course = await CourseModal.findById(courseId);

            if (!mongoose.Types.ObjectId.isValid(contentId)) {
                return next(new ErrorHandler("Invalid Content Id", 400));
            }

            const courseContent = course?.courseData.find((item: any) =>
                item._id.equals(contentId)
            );

            if (!courseContent) {
                return next(new ErrorHandler("Invalid Content Id", 400));
            }

            const newQuestion: any = {
                user: req.user,
                question,
                questionReplies: [],
            };

            // add this question to the course content
            courseContent.questions.push(newQuestion);

            // save the updated question
            await course?.save();

            res.status(200).json({
                success: true,
                message: "Question Added Successfully",
                course,
            });
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 500));
        }
    }
);

// Add answer in the course questions
interface IAddAnswerData {
    answer: string;
    courseId: string;
    contentId: string;
    questionId: string;
}

export const addAnswer = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { answer, contentId, courseId, questionId } =
                req.body as IAddAnswerData;

            const course = await CourseModal.findById(courseId);

            if (!mongoose.Types.ObjectId.isValid(contentId)) {
                return next(new ErrorHandler("Invalid Content Id", 400));
            }

            const courseContent = course?.courseData.find((item: any) =>
                item._id.equals(contentId)
            );

            if (!courseContent) {
                return next(new ErrorHandler("Invalid Content Id", 400));
            }

            // seacrhing question content ----> 5:37:00 in video

            const question = courseContent?.questions?.find((item: any) =>
                item._id.equals(questionId)
            );

            if (!question) {
                return next(new ErrorHandler("Invalid Question Id", 400));
            }

            // creating answer object ---->

            const newAnswer: any = {
                user: req.user,
                answer,
            };

            // Add the answer to the course content

            question.questionReplies?.push(newAnswer);

            await course?.save();

            // 5:42:00 ---->
            // We will check the user if they asked the question and answer. If so we dont send email. We will only send mail to the user when someone answered the question

            if (req.user?._id === question.user?._id) {
                // create a notification
            } else {
                const data = {
                    name: question.user.name,
                    title: courseContent.title,
                };

                const html = await ejs.renderFile(
                    path.join(__dirname, "../mails/question-answer.ejs"),
                    data
                );

                try {
                    await sendMail({
                        email: question.user.email,
                        subject: "Question Replied",
                        templete: "question-answer.ejs",
                        data,
                    });
                } catch (error: any) {
                    return next(new ErrorHandler(error.message, 500));
                }
            }

            res.status(200).json({
                success: true,
                message: "Answer Added Successfully",
                course,
            });
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 500));
        }
    }
);
