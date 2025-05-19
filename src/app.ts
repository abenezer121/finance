import express from "express"
import dotenv from "dotenv"
import userRoutes from "./config/config.ts"
import router from "../src/routes/index.ts"

dotenv.config()  
const app = express() 

app.use(express.json())
app.use(router)

export default app 