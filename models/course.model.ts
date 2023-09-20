import mongoose, { Document, Model, Schema } from "mongoose";
import { IUser } from "./user.model";

interface IComment extends Document {
    user: IUser;
    question: string;
    questionReplies?: IComment[];
}

export interface IReview extends Document {
    user: IUser;
    rating: number;
    comment: string;
    commentReplies?: IComment[];
}

interface ILink extends Document {
    title: string;
    url: string;
}

export interface ICourseData extends Document {
    title: string;
    description: string;
    videoUrl: string;
    videoThumbnail: object;
    videoSection: string;
    videoLength: number;
    videoPlayer: string;
    links: ILink[];
    suggestion: string;
    questions: IComment[];
}

export interface ICourse extends Document {
    name: string;
    description: string;
    price: number;
    estimatedPrice?: number;
    thumbnail: object;
    tags: string;
    level: string;
    demoUrl: string;
    benifits: { title: string }[];
    preRequisites: { title: string }[];
    reviews: IReview[];
    courseData: ICourseData[];
    ratings?: number;
    purchased?: number;
}

// Video 4:26:00 ------------------->

const reviewSchema = new Schema<IReview>({
    user: Object,
    rating: {
        type: Number,
        default: 0,
    },
    comment: String,
    commentReplies: [Object],
});

const linkSchema = new Schema<ILink>({
    title: String,
    url: String,
});

const commentsSchema = new Schema<IComment>({
    user: Object,
    question: String,
    questionReplies: [Object],
});

const courseDataSchema = new Schema<ICourseData>({
    videoUrl: String,
    title: String,
    videoSection: String,
    description: String,
    videoLength: Number,
    videoPlayer: String,
    links: [linkSchema],
    suggestion: String,
    questions: [commentsSchema],
});

const courseSchema = new Schema<ICourse>(
    {
        //
        name: {
            type: String,
            required: true,
        },

        description: {
            type: String,
            required: true,
        },

        price: {
            type: Number,
            required: true,
        },

        estimatedPrice: {
            type: Number,
        },

        thumbnail: {
            public_id: {
                type: String,
            },
            url: {
                type: String,
            },
        },

        tags: {
            type: String,
            required: true,
        },

        level: {
            type: String,
            required: true,
        },

        demoUrl: {
            type: String,
            required: true,
        },

        benifits: [{ title: String }],

        preRequisites: [{ title: String }],
        reviews: [reviewSchema],
        courseData: [courseDataSchema],
        ratings: {
            type: Number,
            default: 0,
        },
        purchased: {
            type: Number,
            default: 0,
        },

        //
    },
    { timestamps: true }
);

const CourseModal: Model<ICourse> = mongoose.model("course", courseSchema);

export default CourseModal;
