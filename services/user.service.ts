import { Response } from "express";

import { connectRedis } from "../config/redis";

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
