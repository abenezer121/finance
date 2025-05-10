import { Request, Response , NextFunction } from "express";
import { User, UserType } from "../models/user.model";

// POST /users
// Content-Type: application/json

// {
//     "userType": "individual",
//     "id": "123",
//     "email": "john.doe@example.com",
//     "firstName": "John",
//     "lastName": "Doe",
//     "dateOfBirth": "1990-01-01"
// }
export const createUser = async (req: Request, res: Response , next: NextFunction) => {
    try {
        const { userType, ...userData } = req.body;

        if (!userType || !Object.values(UserType).includes(userType)) {
            return res.status(400).json({ message: "Invalid or missing userType" });
        }

        const user = new User({
            ...userData,
            userType,
        });

        await user.save();
        return res.status(201).json({ message: "User created successfully", user });
    } catch (error) {
        console.error("Error creating user:", error);
        return res.status(500).json({ message: "Internal server error", error });
    }
};




export const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const users = await User.find();
        return res.status(200).json({ message: "Users retrieved successfully", users });
    } catch (error) {
        console.error("Error fetching users:", error);
        return res.status(500).json({ message: "Internal server error", error });
    }
};

export const getUserById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json({ message: "User retrieved successfully", user });
    } catch (error) {
        console.error("Error fetching user by ID:", error);
        return res.status(500).json({ message: "Internal server error", error });
    }
};

export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const user = await User.findByIdAndUpdate(id, updateData, { new: true });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json({ message: "User updated successfully", user });
    } catch (error) {
        console.error("Error updating user:", error);
        return res.status(500).json({ message: "Internal server error", error });
    }
};

export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        const user = await User.findByIdAndDelete(id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json({ message: "User deleted successfully", user });
    } catch (error) {
        console.error("Error deleting user:", error);
        return res.status(500).json({ message: "Internal server error", error });
    }
};

export const searchUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { query } = req.query; 

        if (!query) {
            return res.status(400).json({ message: "Missing search query" });
        }

        const users = await User.find({
            $or: [
                { email: { $regex: query, $options: "i" } },
                { phone: { $regex: query, $options: "i" } },
                { firstName: { $regex: query, $options: "i" } }, 
                { lastName: { $regex: query, $options: "i" } },
                { organizationName: { $regex: query, $options: "i" } }, 
                { "contactPerson.name": { $regex: query, $options: "i" } }, 
                { "contactPerson.email": { $regex: query, $options: "i" } },
            ],
        });

        return res.status(200).json({ message: "Search results retrieved successfully", users });
    } catch (error) {
        console.error("Error searching users:", error);
        return res.status(500).json({ message: "Internal server error", error });
    }
};