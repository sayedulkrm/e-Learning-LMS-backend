import app from "./app";
import { connectDB } from "./config/database";
connectDB();

app.listen(process.env.PORT, () =>
    console.log(`Server is running on port ${process.env.PORT}`)
);
