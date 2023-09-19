import { NextFunction, Request, Response } from "express";
import { catchAsyncError } from "../middlewares/catchAsyncError";
import cloudinary from "cloudinary";
import ErrorHandler from "../utils/errorHandler";
import { createCourse, getAllCoursesService } from "../services/course.service";
import CourseModal from "../models/course.model";
import { connectRedis } from "../config/redis";
import mongoose from "mongoose";
import ejs from "ejs";
import path from "path";
import sendMail from "../utils/sendMail";
import NotificationModel from "../models/notification.model";

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

            // Creating notification

            await NotificationModel.create({
                user: req.user?._id,
                title: `New Question Received. Course name: # ${course?.name}. Content: ${courseContent?.title}`,
                message: `New Question from ${req.user?.name}`,
                userId: req.user?._id,
                courseId: course?._id,
                contentId: courseContent?._id,
            });

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
                await NotificationModel.create({
                    user: req.user?._id,
                    title: `New Question Reply Received. Course name: # ${course?.name}. Content: ${courseContent?.title}`,
                    message: `New Question Reply from ${req.user?.name}`,
                    userId: req.user?._id,
                    courseId,
                    contentId,
                });
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

// Add Review in the Course
interface IAddReviewData {
    review: string;
    rating: number;
    userId: string;
}

// Here this one you make post request. Dont forget 6:03:00---->

export const addReview = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userCourseList = req.user?.courses;
            const courseId = req.params.id;

            //    Check the course Id
            const courseExist = userCourseList?.some(
                (course: any) => course._id.toString() === courseId.toString()
            );

            if (!courseExist) {
                return next(
                    new ErrorHandler(
                        "You're not allowed for this course. Please Purchased to access this.",
                        400
                    )
                );
            }

            const course = await CourseModal.findById(courseId);

            if (!course) {
                return next(new ErrorHandler("Course not found", 400));
            }

            const { review, rating } = req.body as IAddReviewData;

            const reviewData: any = {
                user: req.user,
                comment: review,
                rating,
            };

            course?.reviews.push(reviewData);

            let avg = 0;

            // souppose there are 2 users given review. 1 is 5* another user give 4*. So total number is 9*
            course?.reviews.forEach((review) => (avg += review.rating));
            // Total = 9*

            course.ratings = avg / course?.reviews.length;
            // 2 users. So Length is 2. Now here,  total revies 9 ( / "devided by") 2 ===> 4.5*
            // Avg rating is 4.5*

            await course?.save();

            const notification = {
                title: "New Review Recieved",
                message: `${req.user?.name} has given a review on your ${course?.name} course.`,
                user: req.user?._id,
                courseId,
            };

            // create notification

            res.status(200).json({
                success: true,
                message: "Review Added Successfully",
                course,
            });
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 500));
        }
    }
);

// Add replied in Review

interface IAddReplyToReviewData {
    comment: string;
    courseId: string;
    reviewId: string;
}

export const addReplyToReview = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { comment, courseId, reviewId } =
                req.body as IAddReplyToReviewData;

            const course = await CourseModal.findById(courseId);

            if (!course) {
                return next(new ErrorHandler("Course not found", 400));
            }

            const review = course?.reviews?.find(
                (rev: any) => rev._id.toString() === reviewId
            );

            if (!review) {
                return next(new ErrorHandler("Review not found", 400));
            }

            const replyData: any = {
                user: req.user,
                comment,
            };

            // Automatically Generating New Comment Array

            if (!review.commentReplies) {
                review.commentReplies = [];
            }

            review.commentReplies?.push(replyData);

            await course?.save();

            res.status(200).json({
                success: true,
                message: "Reply Added Successfully",
                course,
            });
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 500));
        }
    }
);

// Admin Only =========>

export const getAllCoursesAdmin = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            getAllCoursesService(res);
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 500));
        }
    }
);

// Delete Course --- only Admin

export const deleteCourseAdmin = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;

            const course = await CourseModal.findById(id);

            if (!course) {
                return next(new ErrorHandler("Course not found", 404));
            }

            await course.deleteOne({ id });

            await connectRedis.del(id);

            res.status(200).json({
                success: true,
                message: "Course deleted successfully",
            });
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 500));
        }
    }
);
