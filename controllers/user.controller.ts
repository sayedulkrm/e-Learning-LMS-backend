import { NextFunction, Request, Response } from "express";
import { catchAsyncError } from "../middlewares/catchAsyncError";
import UserModel, { IUser } from "../models/user.model";
import ErrorHandler from "../utils/errorHandler";
import jwt, { JwtPayload, Secret } from "jsonwebtoken";
import ejs from "ejs";
import path from "path";
import sendMail from "../utils/sendMail";
import {
    accessTokenOptions,
    refreshTokenOptions,
    sendToken,
} from "../utils/jwt";
import { connectRedis } from "../config/redis";
import {
    getAllUsersService,
    getUserById,
    updateUserRolesService,
} from "../services/user.service";
import cloudinary from "cloudinary";
import mongoose from "mongoose";

//
//
// register user
interface IRegistrationBody {
    name: string;
    email: string;
    password: string;
    avatar?: string;
}

export const registerUser = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { name, email, password } = req.body;

            const isEmailExist = await UserModel.findOne({ email });

            if (isEmailExist) {
                return next(new ErrorHandler("Email already exist", 400));
            }

            const user: IRegistrationBody = {
                name,
                email,
                password,
            };

            const activationToken = createActivationToken(user);

            const activationCode = activationToken.activationCode;

            const data = {
                user: {
                    name: user.name,
                },
                activationCode,
            };

            const html = await ejs.renderFile(
                path.join(__dirname, "../mails/activation-mail.ejs"),
                data
            );

            try {
                await sendMail({
                    email: user.email,
                    subject: "Account Activation",
                    templete: "activation-mail.ejs",
                    data,
                });

                res.status(200).json({
                    success: true,
                    message: `Email sent ${user.email} successfully. Please activate your account`,
                    activationToken: activationToken.token,
                });
            } catch (error: any) {
                return next(new ErrorHandler(error.message, 500));
            }
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 500));
        }
    }
);

// interface IActivation
interface IActivationToken {
    token: string;
    activationCode: string;
}

export const createActivationToken = (user: any): IActivationToken => {
    const activationCode = Math.floor(1000 + Math.random() * 9000).toString();

    const token = jwt.sign(
        { user, activationCode },
        process.env.JWT_SECRET as Secret,
        {
            expiresIn: "5m",
        }
    );

    return { token, activationCode };
};

// Activate User
interface IActivationRequest {
    activation_token: string;
    activation_code: string;
}

export const activateUser = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { activation_token, activation_code } =
                req.body as IActivationRequest;

            const newUser: { user: IUser; activationCode: string } = jwt.verify(
                activation_token,
                process.env.JWT_SECRET as string
            ) as { user: IUser; activationCode: string };

            if (newUser.activationCode !== activation_code) {
                return next(new ErrorHandler("Invalid Activation Code", 400));
            }

            const { name, email, password } = newUser.user;

            const isEmailExist = await UserModel.findOne({ email });

            if (isEmailExist) {
                return next(new ErrorHandler("Email already exist", 400));
            }

            const user = await UserModel.create({
                name,
                email,
                password,
            });

            res.status(200).json({
                success: true,
            });
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 500));
        }
    }
);

// Login User

interface ILoginRequest {
    email: string;
    password: string;
}

export const loginUser = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { email, password } = req.body as ILoginRequest;

            if (!email || !password) {
                return next(
                    new ErrorHandler("Please enter email and password", 400)
                );
            }

            const user = await UserModel.findOne({ email }).select("+password");

            if (!user) {
                return next(new ErrorHandler("Invalid Email or Password", 401));
            }

            const isPasswordMatched = await user.comparePassword(password);

            if (!isPasswordMatched) {
                return next(new ErrorHandler("Invalid Email or Password", 401));
            }

            sendToken(res, user, `Welcome Back ${user.name}`, 200);
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 500));
        }
    }
);

// Logout user

export const logoutUser = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            res.cookie("access_token", "", { maxAge: 1 });
            res.cookie("refresh_token", "", { maxAge: 1 });

            const userID = req.user?._id || "";

            connectRedis.del(userID);

            res.status(200).json({
                success: true,
                message: "Logged out successfully",
            });
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 500));
        }
    }
);

// update access token

export const updateAccessToken = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { refresh_token } = req.cookies;

            const decoded = jwt.verify(
                refresh_token,
                process.env.REFRESH_TOKEN as string
            ) as JwtPayload;

            if (!decoded) {
                return next(new ErrorHandler("Access Token is not valid", 401));
            }

            const session = await connectRedis.get(decoded._id);

            if (!session) {
                return next(new ErrorHandler("Session Expired", 401));
            }

            const user = JSON.parse(session);

            const accessToken = jwt.sign(
                { _id: user._id },
                process.env.ACCESS_TOKEN as string,
                { expiresIn: "5m" }
            );

            const refreshToken = jwt.sign(
                { _id: user._id },
                process.env.REFRESH_TOKEN as string,
                { expiresIn: "3d" }
            );

            req.user = user;

            res.cookie("access_token", accessToken, accessTokenOptions);
            res.cookie("refresh_token", refreshToken, refreshTokenOptions);

            res.status(200).json({
                success: true,
                accessToken,
            });
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 500));
        }
    }
);

// Get user information

export const getUserInformation = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user?._id;

            getUserById(userId, res);
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 500));
        }
    }
);

interface ISocialAuthBody {
    email: string;
    name: string;
    avatar: string;
}

// Social auth
export const socialAuth = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { email, name, avatar } = req.body as ISocialAuthBody;

            const user = await UserModel.findOne({ email });

            if (!user) {
                const newUser = await UserModel.create({ email, name, avatar });
                sendToken(res, newUser, `Welcome ${newUser.name}`, 200);
            } else {
                sendToken(res, user, `Welcome Back ${user.name}`, 200);
            }
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 500));
        }
    }
);

// update user information

interface IUpdateUserInfo {
    name?: string;
    email?: string;
}

export const updateUserInfo = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { name, email } = req.body as IUpdateUserInfo;

            const userId = req.user?._id;

            const user = await UserModel.findById(userId);

            if (!user) {
                return next(new ErrorHandler("User not found", 404));
            }

            // 3:51:00 on video
            if (email && user) {
                const isEmailExist = await UserModel.findOne({ email });

                if (isEmailExist) {
                    return next(new ErrorHandler("Email already exist", 400));
                }

                user.email = email;
            }

            if (name && user) {
                user.name = name;
            }

            await user?.save();

            await connectRedis.set(userId, JSON.stringify(user));

            res.status(200).json({
                sucess: true,
                message: "User information updated successfully",
                user,
            });
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 500));
        }
    }
);

// Update User Password
interface IUpdatePassword {
    oldPassword: string;
    newPassword: string;
}

export const updateUserPassword = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { oldPassword, newPassword } = req.body as IUpdatePassword;

            const user = await UserModel.findById(req.user?._id).select(
                "+password"
            );

            if (user?.password === undefined) {
                return next(new ErrorHandler("User not found", 404));
            }

            if (!oldPassword || !newPassword) {
                return next(
                    new ErrorHandler("Please fill all the fields", 400)
                );
            }

            const isPasswordMatched = await user?.comparePassword(oldPassword);

            if (!isPasswordMatched) {
                return next(new ErrorHandler("Invalid Old Password", 401));
            }

            user.password = newPassword;

            await user.save();

            await connectRedis.set(req.user?._id, JSON.stringify(user));

            res.status(201).json({
                success: true,
                message: "Password updated successfully",
                user,
            });
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 500));
        }
    }
);

// Update Profile Picture

interface IUpdateProfilePicture {
    avatar: string;
}

export const updateUserProfilePicture = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { avatar } = req.body;

            const user = await UserModel.findById(req.user?._id);

            if (avatar && user) {
                // If user have one Avatar

                if (user?.avatar.public_id) {
                    // First delete the old profile picture

                    await cloudinary.v2.uploader.destroy(
                        user?.avatar.public_id
                    );

                    const mycloud = await cloudinary.v2.uploader.upload(
                        avatar,
                        {
                            folder: "courses/users",
                        }
                    );

                    user.avatar = {
                        public_id: mycloud.public_id,
                        url: mycloud.secure_url,
                    };
                } else {
                    const mycloud = await cloudinary.v2.uploader.upload(
                        avatar,
                        {
                            folder: "courses/users",
                        }
                    );

                    user.avatar = {
                        public_id: mycloud.public_id,
                        url: mycloud.secure_url,
                    };
                }
            }

            await user?.save();

            await connectRedis.set(req.user?._id, JSON.stringify(user));

            res.status(200).json({
                success: true,
                message: "Profile picture updated successfully",
                user,
            });
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 500));
        }
    }
);

// Admin Only =========>

export const getAllUsersAdmin = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            getAllUsersService(res);
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 500));
        }
    }
);

// Update Users Role =========> Admin Only =========>

export const updateUserRole = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { userId, role } = req.body;
            if (!userId || !role) {
                return next(
                    new ErrorHandler("Please provide userId and role", 400)
                );
            }

            // Check if userId is a valid ObjectId
            if (!mongoose.Types.ObjectId.isValid(userId)) {
                return next(new ErrorHandler("Invalid User Id ", 400));
            }

            updateUserRolesService(userId, role, res);
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 500));
        }
    }
);

// Delete user --- only Admin

export const deleteUserAdmin = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;

            const user = await UserModel.findById(id);

            if (!user) {
                return next(new ErrorHandler("User not found", 404));
            }

            await user.deleteOne({ id });

            await connectRedis.del(id);

            res.status(200).json({
                success: true,
                message: "User deleted successfully",
            });
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 500));
        }
    }
);
