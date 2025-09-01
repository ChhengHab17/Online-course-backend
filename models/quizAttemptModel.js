import mongoose from "mongoose";

const quizAttemptSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    quiz_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
    },
    course_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    score: {
      type: Number,
      required: true,
      min: 0,
    },
    total_questions: {
      type: Number,
      required: true,
      min: 1,
    },
    percentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    passed: {
      type: Boolean,
      required: true,
    },
    answers: [{
      question_index: { type: Number, required: true },
      selected_options: [{ type: Number, required: true }],
      correct_options: [{ type: Number, required: true }],
      is_correct: { type: Boolean, required: true },
    }],
    attempt_number: {
      type: Number,
      required: true,
      default: 1,
    },
  },
  { 
    timestamps: true,
    // Create compound index to enforce unique constraint per user per quiz for latest attempt
    index: { user_id: 1, quiz_id: 1, attempt_number: 1 }
  }
);

// Index for faster queries
quizAttemptSchema.index({ user_id: 1, course_id: 1 });
quizAttemptSchema.index({ quiz_id: 1 });

const QuizAttempt = mongoose.model("QuizAttempt", quizAttemptSchema);
export default QuizAttempt;
