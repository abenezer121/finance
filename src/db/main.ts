import mongoose from "mongoose";
import config from "../config/config";


export const connectToDatabase = async (): Promise<void> =>  {
    try { 
        await mongoose.connect(config.dbUrl)

    }catch(error) {
        console.error("Failed to connect to db")
        process.exit(1)
    }
}