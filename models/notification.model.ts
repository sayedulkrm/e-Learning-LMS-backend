import mongoose, { Document, Model, Schema } from "mongoose";
import { ICourse } from "./course.model";

export interface INotification extends Document {
    title: string;
    message: string;
    status: string;
    userId: string;
    courseId?: string;
    contentId?: string;
}

const notificationSchema = new Schema<INotification>(
    {
        title: {
            type: String,
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            required: true,
            default: "unread",
        },
        userId: {
            type: String,
            required: true,
        },
        courseId: {
            type: String,
        },
        contentId: {
            type: String,
        },
    },
    { timestamps: true }
);

// Create the Mongoose model for the INotification schema
const NotificationModel = mongoose.model<INotification>(
    "Notification",
    notificationSchema
);

export default NotificationModel;
