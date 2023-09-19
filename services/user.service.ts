import { Response } from "express";

import { connectRedis } from "../config/redis";
import UserModel from "../models/user.model";

export const getUserById = async (id: string, res: Response) => {
    const userJSON = await connectRedis.get(id);

    if (userJSON) {
        const user = JSON.parse(userJSON);
        res.status(200).json({
            success: true,
            user,
        });
    }
};

// Get All Users
export const getAllUsersService = async (res: Response) => {
    const users = await UserModel.find().sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        users,
    });
};

// Update User Roles
export const updateUserRolesService = async (
    userId: string,
    role: string,
    res: Response
) => {
    const user = await UserModel.findByIdAndUpdate(
        userId,
        { role },
        { new: true }
    );

    if (!user) {
        return res.status(404).json({
            success: false,
            message: "User not found",
        });
    }

    res.status(200).json({
        success: true,
        message: `User ${user.name} Role updated successfully`,
        user,
    });
};
