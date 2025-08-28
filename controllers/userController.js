import { Router } from "express";
import User from "../models/userModel.js";
import { doHash } from "../utils/hasing.js";
import { genSalt } from "bcryptjs";
// Get all users
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
    .populate("role_id", "role_name")
    .select("-password");

    const formattedUsers = users.map(user => ({
      id: user._id,
      name: user.email,
      email: user.email,
      role: user.role_id ?.role_name || "User",
      status: user.status,
      createdAt: user.createdAt,
    }))
    return res.status(200).json({ users: formattedUsers });
  }catch (error) {
    res.status(500).json({ message: "Error fetching users", error: error.message });
  }
}

// Change User Password
export const changeUserPassword = async (req, res) => {
  try {
    const { id } = req.params;       // get id from URL
    const { newPassword } = req.body; // get new password from body

    if (!newPassword) {
      return res.status(400).json({ message: "New password is required" });
    }

    console.log("Password change request:", { id, newPassword });

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    const salt = await genSalt(10);
    const hashedPassword = await doHash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Password change error:", error);
    return res.status(500).json({
      message: "Error changing user password",
      error: error.message,
    });
  }
};

// Change user status to blocked or unblocked
export const changeUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const userId = req.params.id || req.body.id;
    const user = await User.findByIdAndUpdate(
      userId,
      { status: status },
      { new: true }
    ).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }
    return res.status(200).json({ message: `User ${status ? 'blocked' : 'unblocked'} successfully`, user });
  } catch (error) {
    res.status(500).json({ message: "Error changing user status", error: error.message });
  }
};

// // Block user
// export const blockUser = async (req, res) => {
//   try {
//     const userId = req.params.id;

//     const user = await User.findByIdAndUpdate(
//       userId,
//       { status: true },
//       { new: true }
//     ).select("-password");

//     if (!user) {
//       return res.status(404).json({ message: "User not found!" });
//     }

//     return res.status(200).json({ message: "User blocked successfully", user });
//   } catch (error) {
//     res.status(500).json({ message: "Error blocking user", error: error.message });
//   }
// };

// // Unblock user
// export const unblockUser = async (req, res) => {
//   try {
//     const userId = req.params.id;

//     const user = await User.findByIdAndUpdate(
//       userId,
//       { status: false },
//       { new: true }
//     ).select("-password");

//     if (!user) {
//       return res.status(404).json({ message: "User not found!" });
//     }

//     return res.status(200).json({ message: "User unblocked successfully", user });
//   } catch (error) {
//     res.status(500).json({ message: "Error unblocking user", error: error.message });
//   }
// };

// Delete user
export const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    return res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting user", error: error.message });
  }
};
