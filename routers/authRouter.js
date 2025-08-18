import express from "express";
import { identifier, isAdmin, isUser } from "../middlewares/authMiddleware.js";
import {
  signup,
  signin,
  signout,
  sendVerificationCode,
  verifyCode,
  changePassword,
  sendForgotPasswordCode,
  verifyForgotPasswordCode,
} from "../controllers/authController.js";
export const router = express.Router();

router.post("/signup", signup);
router.post("/signin", signin);
router.post("/signout", identifier, signout);
router.patch("/verification-code", identifier, sendVerificationCode);
router.patch("/verify-code", identifier, verifyCode);
router.patch("/change-password", identifier, changePassword);
router.patch("/send-forgotPassword", sendForgotPasswordCode);
router.patch("/verify-forgotPassword", verifyForgotPasswordCode);

router.post("/admin", identifier, isAdmin, (req, res) => {
  console.log("Hello from Admin Page");
  return res.json({message: "hello from admin page"})
})