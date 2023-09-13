import mongoose, { Document, Model, Schema } from "mongoose";

import bcrypt from "bcryptjs";

const emailRegexPattern =
    /^[a-zA-Z0-9]+(?:\.[a-zA-Z0-9]+)*@[a-zA-Z0-9]+(?:\.[a-zA-Z0-9]+)*$/;

// interface for user schema

export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    avatar: {
        public_id: string;
        url: string;
    };
    role: string;

    isVerified: boolean;
    courses: Array<{ courseId: string }>;
    comparePassword: (password: string) => Promise<boolean>;
}

const userSchema: Schema<IUser> = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Please enter your name"],
            maxLength: [30, "Name cannot exceed 30 characters"],
        },
        email: {
            type: String,
            required: [true, "Please enter your email"],
            validate: {
                validator: function (value: string) {
                    return emailRegexPattern.test(value);
                },
                message: "Please enter a valid email",
            },
            unique: true,
        },

        password: {
            type: String,
            required: [true, "Please enter your password"],
            minLength: [6, "Password must be at least 6 characters"],
            select: false,
        },
        avatar: {
            public_id: String,
            url: String,
        },

        role: {
            type: String,
            default: "user",
        },

        isVerified: {
            type: Boolean,
            default: false,
        },
        courses: [
            {
                courseId: String,
            },
        ],
    },
    { timestamps: true }
);

// Hashing Passwords

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// compare passwords

userSchema.methods.comparePassword = async function (
    password: string
): Promise<boolean> {
    return await bcrypt.compare(password, this.password);
};

const UserModel: Model<IUser> = mongoose.model("user", userSchema);

export default UserModel;
