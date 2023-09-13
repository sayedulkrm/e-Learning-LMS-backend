import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        const { connection } = await mongoose.connect(process.env.MONGO_URI!);
        console.log(`MongoDB connected on: ${connection.host}`);
    } catch (error) {
        console.log(
            error,
            "Ohh No! an error occured to connecting with database"
        );
        setTimeout(connectDB, 5000);
    }
};
