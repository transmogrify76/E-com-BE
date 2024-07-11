// Import required modules
import mongoose from "mongoose";
import { DB_NAME } from "../contants.js";

// MongoDB URI and port
const MONGODB_URI = "mongodb+srv://eshaghosal21:Tgpl2024@cluster0.ca0hohn.mongodb.net";

const PORT = 3000;

const connectDB = async () => {
    try {
        // Connect to MongoDB
        const connectionInstance = await mongoose.connect(`${MONGODB_URI}/${DB_NAME}`);

        // Success message
        console.log(`MongoDB connected! DB Host: ${connectionInstance.connection.host}`);
    } catch (error) {
        // Error message
        console.error("MongoDB connection errorrrrrrrrrrrrrrrrrrr:", error);
        process.exit(1); // Exit process with failure
    }
};

export default connectDB;
