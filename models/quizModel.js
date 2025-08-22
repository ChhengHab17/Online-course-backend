import mongoose from "mongoose";

const quizSchema = new mongoose.Schema(
  {
    course_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    questions: [
      {
        question_text: { type: String, required: true },

        // type of question
        question_type: {
          type: String,
          enum: ["single", "multiple", "truefalse"],
          required: true,
        },

        // possible answers
        options: [
          {
            text: { type: String, required: true },
            isCorrect: { type: Boolean, default: false },
          },
        ],
      },
    ],
  },
  { timestamps: true }
);

const Quiz = mongoose.model("Quiz", quizSchema);
export default Quiz;