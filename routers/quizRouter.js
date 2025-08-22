import express from "express";
import {
  createQuiz,
  updateQuiz,
  deleteQuiz,
  getQuizById
} from "../controllers/quizController.js";

export const quizRouter = express.Router();

// Create quiz
quizRouter.post("/", createQuiz);

// Update quiz by ID
quizRouter.patch("/:id", updateQuiz);

// Delete quiz by ID
quizRouter.delete("/:id", deleteQuiz);

// Get quiz by ID
quizRouter.get("/:id", getQuizById);

export default quizRouter;
