import { tranport } from "../middlewares/sendMail.js";
import {
  signupSchema,
  signinSchema,
  acceptCodeSchema,
  changePasswordSchema,
  acceptforgotPasswordCodeSchema,
} from "../middlewares/validator.js";
import User from "../models/userModel.js"; // Assuming you have a User model defined
import Role from "../models/roleModels.js";
import { doHash, doHashValidation, hmacProcess } from "../utils/hasing.js"; // Assuming you have a hashing utility function
import jwt from "jsonwebtoken"; // Assuming you are using JWT for authentication

export const signup = async (req, res) => {
  const {username, email, password } = req.body;
  console.log("data",req.body);
  try {
    const { error, value } = signupSchema.validate({ username, email, password });
    if (error) {
      return res
        .status(401)
        .json({ success: false, message: error.details[0].message });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(401)
        .json({ success: false, message: "Email is already resgistered" });
    }

    const hashedPassword = await doHash(password, 12);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
    });
    const role = await Role.findOne({ role_name: "user" });
    newUser.role_id = [role._id];

    const result = await newUser.save();
    result.password = undefined;
    res.status(201).json({
      success: true,
      message: "Account created successfully",
      result,
    });
  } catch (error) {
    console.log(error);
  }
};

export const signin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const { error, value } = signinSchema.validate({ email, password });
    if (error) {
      return res
        .status(401)
        .json({ success: false, message: error.details[0].message });
    }

    const existingUser = await User.findOne({ email }).select("+password").populate( "role_id", "-__v");
    if (!existingUser) {
      return res
        .status(401)
        .json({ success: false, message: "Email is not registered yet!" });
    }
    const result = doHashValidation(password, existingUser.password);
    if (!result) {
      return res
        .status(401)
        .json({ success: false, message: "Password is incorrect!" });
    }
    const token = jwt.sign(
      {
        userId: existingUser._id,
        email: existingUser.email,
        verified: existingUser.verified,
        role_id: existingUser.role_id
      },
      process.env.TOKEN_SECRET,
      {
        expiresIn: "8h",
      }
    );
    console.log(existingUser);
    // Extract user roles
    const authorities = [`ROLE_${existingUser.role_id.role_name.toUpperCase()}`];

    res
      .cookie("Authorization", "Bearer" + token, {
        expires: new Date(Date.now() + 8 * 3600000),
        httpOnly: process.env.NODE_ENV === "production",
        secure: process.env.NODE_ENV === "production",
      })
      .json({
        success: true,
        token,
        message: "Login successfully",
        role: authorities
      });
  } catch (error) {
    console.log(error);
  }
};
export const signout = async (req, res) => {
  res.clearCookie("Authorization").status(200).json({
    success: true,
    message: "Signout successfully",
  });
};

export const sendVerificationCode = async (req, res) => {
  const { email } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      return res.status(401).json({
        success: false,
        message: "Email is not registered yet!",
      });
    }
    if (existingUser.verified) {
      return res.status(400).json({
        success: false,
        message: "You are already verified!",
      });
    }
    const codeValue = Math.floor(Math.random() * 1000000).toString();

    let info = await tranport.sendMail({
      from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
      to: existingUser.email,
      subject: "Verification Code",
      html: "<h1>" + codeValue + "</h1>",
    });

    if (info.accepted[0] === existingUser.email) {
      const hashedCodeValue = hmacProcess(
        codeValue,
        process.env.HMAC_VERIFICATION_CODE_SECRET
      );
      existingUser.verificationCode = hashedCodeValue;
      existingUser.verificationCodeValidation = Date.now();
      await existingUser.save();
      return res.status(200).json({
        success: true,
        message: "Code Sent",
      });
    }
    res.status(400).json({
      success: true,
      message: "Code Sent failed",
    });
  } catch (error) {
    console.log(error);
  }
};

export const verifyCode = async (req, res) => {
  const { email, providedCode } = req.body;
  try {
    const { error, value } = acceptCodeSchema.validate({ email, providedCode });
    if (error) {
      return res
        .status(401)
        .json({ success: false, message: error.details[0].message });
    }

    const codeValue = providedCode.toString();
    const existingUser = await User.findOne({ email }).select(
      "+verificationCode +verificationCodeValidation"
    );
    if (!existingUser) {
      return res
        .status(401)
        .json({ success: false, message: "Email is not registered yet!" });
    }
    if (existingUser.verified) {
      return res.status(400).json({
        success: false,
        message: "You are already verified!",
      });
    }
    if (
      !existingUser.verificationCode ||
      !existingUser.verificationCodeValidation
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Something is wrong with the code" });
    }
    if (Date.now() - existingUser.verificationCodeValidation > 5 * 60 * 1000) {
      return res.status(400).json({
        success: false,
        message: "Code is expired, please request a new code",
      });
    }
    const hashedCodeValue = hmacProcess(
      codeValue,
      process.env.HMAC_VERIFICATION_CODE_SECRET
    );
    if (hashedCodeValue === existingUser.verificationCode) {
      existingUser.verified = true;
      existingUser.verificationCode = undefined;
      existingUser.verificationCodeValidation = undefined;
      await existingUser.save();
      return res.status(200).json({
        success: true,
        message: "Email is verified successfully",
      });
    }
    return res.status(400).json({
      success: false,
      message: "Code is incorrect",
    });
  } catch (error) {
    console.log(error);
  }
};

export const changePassword = async (req, res) => {
  const { userId, verified } = req.user;
  const { oldPassword, newPassword } = req.body;

  try {
    const { error, value } = changePasswordSchema.validate({
      oldPassword,
      newPassword,
    });
    if (error) {
      return res
        .status(401)
        .json({ success: false, message: error.details[0].message });
    }
    if (!verified) {
      return res.status(401).json({
        success: false,
        message: "You are not verified yet!",
      });
    }
    const existingUser = await User.findOne({ _id: userId }).select(
      "+password"
    );
    if (!existingUser) {
      return res.status(401).json({
        success: false,
        message: "User is not exist",
      });
    }
    const result = await doHashValidation(oldPassword, existingUser.password);
    if (!result) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credential" });
    }
    const hashedPassword = await doHash(newPassword, 12);
    existingUser.password = hashedPassword;
    await existingUser.save();
    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.log(error);
  }
};

export const sendForgotPasswordCode = async (req, res) => {
  const { email } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      return res.status(401).json({
        success: false,
        message: "Email is not registered yet!",
      });
    }

    const codeValue = Math.floor(Math.random() * 1000000).toString();

    let info = await tranport.sendMail({
      from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
      to: existingUser.email,
      subject: "Forgot Password Code",
      html: "<h1>" + codeValue + "</h1>",
    });

    if (info.accepted[0] === existingUser.email) {
      const hashedCodeValue = hmacProcess(
        codeValue,
        process.env.HMAC_VERIFICATION_CODE_SECRET
      );
      existingUser.forgotPasswordCode = hashedCodeValue;
      existingUser.forgotPasswordCodeValidation = Date.now();
      await existingUser.save();
      return res.status(200).json({
        success: true,
        message: "Code Sent",
      });
    }
    res.status(400).json({
      success: true,
      message: "Code Sent failed",
    });
  } catch (error) {
    console.log(error);
  }
};

export const verifyForgotPasswordCode = async (req, res) => {
  const { email, providedCode, newPassword } = req.body;
  try {
    const { error, value } = acceptforgotPasswordCodeSchema.validate({
      email,
      providedCode,
      newPassword,
    });
    if (error) {
      return res
        .status(401)
        .json({ success: false, message: error.details[0].message });
    }

    const codeValue = providedCode.toString();
    const existingUser = await User.findOne({ email }).select(
      "+forgotPasswordCode +forgotPasswordCodeValidation"
    );
    if (!existingUser) {
      return res
        .status(401)
        .json({ success: false, message: "Email is not registered yet!" });
    }
    if (
      !existingUser.forgotPasswordCode ||
      !existingUser.forgotPasswordCodeValidation
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Something is wrong with the code" });
    }
    if (
      Date.now() - existingUser.forgotPasswordCodeValidation >
      5 * 60 * 1000
    ) {
      return res.status(400).json({
        success: false,
        message: "Code is expired, please request a new code",
      });
    }
    const hashedCodeValue = hmacProcess(
      codeValue,
      process.env.HMAC_VERIFICATION_CODE_SECRET
    );
    if (hashedCodeValue === existingUser.forgotPasswordCode) {
      const hashedPassword = await doHash(newPassword, 12);
      existingUser.password = hashedPassword;
      existingUser.forgotPasswordCode = undefined;
      existingUser.forgotPasswordCodeValidation = undefined;
      await existingUser.save();
      return res.status(200).json({
        success: true,
        message: "Code Changed successfully",
      });
    }
    return res.status(400).json({
      success: false,
      message: "Code is incorrect",
    });
  } catch (error) {
    console.log(error);
  }
};
