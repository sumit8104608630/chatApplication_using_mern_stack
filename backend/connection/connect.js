import mongoose from 'mongoose';
import { dataBaseName } from "../src/constants.js"

const connectio_to_data_base = async () => {
    try {
        if (!dataBaseName) {
            console.error("Database name is not defined");
            return;
        }

        const connection = await mongoose.connect(`${process.env.MONGODB_URL}/${dataBaseName}`, {
            // Removed deprecated options
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000
        });

        console.log(`Successfully connected to database: ${dataBaseName}`);
        return connection;

    } catch (error) {
        console.error("Failed to connect to database:", error);
        process.exit(1); // Exit process with failure
    }
}

export { connectio_to_data_base }