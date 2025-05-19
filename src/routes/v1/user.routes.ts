import express, { NextFunction } from "express";
import {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  searchUsers,
} from "../../controllers/user.controller";

const router = express.Router();


router.post("/", (req, res, next) => {
    createUser(req, res, next).catch(next);
});

router.get("/" , (req , res , next)=> {
    getAllUsers(req, res, next).catch(next);
})


router.get("/:id" , (req , res , next)=> {
    getUserById(req, res, next).catch(next);
})


router.put("/:id" , (req , res , next)=> {
    updateUser(req, res, next).catch(next);
})



router.delete("/:id" , (req , res , next)=> {
    deleteUser(req, res, next).catch(next);
})



router.get("/search" , (req , res , next)=> {
    searchUsers(req, res, next).catch(next);
})

export default router;