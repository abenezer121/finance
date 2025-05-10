import dotenv from "dotenv"

dotenv.config() 

const config = {
    port : process.env.PORT || 3000,
    dbUrl : process.env.MONGODB_URL || "mongodb://localhost:27017/mydatabase",
    service: process.env.EMAIL_SERVICE || "gmail",
    user: process.env.EMAIL_USER || "",
    password: process.env.EMAIL_PASSWORD || "",

}

export default config 