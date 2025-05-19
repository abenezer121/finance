import express from "express"
import transaction from "./v1/transaction.routes"
import account from "./v1/accounts.routes"
import sales from "./v1/sales.router"
import user from "./v1/user.routes"
import otp from "./v1/otp.routes"

const router = express.Router() 

router.use("/api/v1/transaction" , transaction)
router.use("/api/v1/account" , account)
router.use("/api/v1/sales" , sales)
router.use("/api/v1/user" , user)
router.use("/api/v1/otp" , otp)

export default router