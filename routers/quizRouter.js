import express from "express";
import {
  createQuiz,
  updateQuiz,
  deleteQuiz,
  getQuizById,
  getQuizByCourseId,
  deleteQuizQuestion, 
  deleteQuizOption
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

quizRouter.get("/course/:courseId", getQuizByCourseId);

quizRouter.delete("/:id/question/:questionId", deleteQuizQuestion);
quizRouter.delete("/:id/question/:questionId/option/:optionId", deleteQuizOption);

export default quizRouter;
