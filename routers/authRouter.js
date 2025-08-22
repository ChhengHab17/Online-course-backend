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
  resetPassword,
} from "../controllers/authController.js";
export const router = express.Router();

router.post("/signup", signup);
router.post("/signin", signin);
router.post("/signout", identifier, signout);
router.patch("/verification-code", sendVerificationCode);
router.patch("/verify-code", verifyCode);
router.patch("/change-password", changePassword);
router.patch("/send-forgotPassword", sendForgotPasswordCode);
router.patch("/verify-forgotPassword", verifyForgotPasswordCode);
router.patch("/change-forgot-password", resetPassword);

router.post("/admin", identifier, isAdmin, (req, res) => {
  console.log("Hello from Admin Page");
  return res.json({message: "hello from admin page"})
})