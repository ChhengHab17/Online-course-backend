import express from "express";
import {
    // blockUser,
    // unblockUser,
    deleteUser,
    getAllUsers,
    changeUserStatus,
    changeUserPassword
} from "../controllers/userController.js";
export const userRouter = express.Router();

userRouter.get("/", getAllUsers);
// userRouter.patch("/block/:id", blockUser);  
// userRouter.patch("/unblock/:id", unblockUser);
userRouter.delete("/:id", deleteUser);
userRouter.patch("/:id", changeUserStatus);
userRouter.patch("/change-password/:id", changeUserPassword);


export default userRouter;
