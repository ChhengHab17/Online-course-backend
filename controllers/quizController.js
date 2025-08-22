import Quiz from "../models/quizModel.js";

// CREATE quiz with questions and options
export const createQuiz = async (req, res) => {
  try {
    const { course_id, title, description, questions } = req.body;

    const quiz = new Quiz({
      course_id,
      title,
      description,
      questions: questions.map(q => ({
        question_text: q.question_text,
        question_type: q.question_type,
        options: q.options?.map(opt => ({
          text: opt.text,
          isCorrect: opt.isCorrect
        }))
      }))
    });

    await quiz.save();
    res.status(201).json({ message: "Quiz created successfully", quiz });
  } catch (err) {
    res.status(500).json({ message: "Error creating quiz", error: err.message });
  }
};

// UPDATE quiz (title, description, questions, options)
export const updateQuiz = async (req, res) => {
  try {
    const { id } = req.params; // <-- changed from quizId to id
    const { title, description, questions } = req.body;

    const quiz = await Quiz.findById(id);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    if (title) quiz.title = title;
    if (description) quiz.description = description;

    if (questions) {
      quiz.questions = questions.map(q => ({
        question_text: q.question_text,
        question_type: q.question_type,
        options: q.options?.map(opt => ({
          text: opt.text,
          isCorrect: opt.isCorrect
        }))
      }));
    }

    await quiz.save();
    res.json({ message: "Quiz updated successfully", quiz });
  } catch (err) {
    res.status(500).json({ message: "Error updating quiz", error: err.message });
  }
};

// DELETE quiz by ID
export const deleteQuiz = async (req, res) => {
  try {
    const { id } = req.params; // <-- fix here
    const deletedQuiz = await Quiz.findByIdAndDelete(id);

    if (!deletedQuiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    res.json({ message: "Quiz deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting quiz", error: err.message });
  }
};

// Get quiz by ID
export const getQuizById = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id).populate("course_id");
    if (!quiz) return res.status(404).json({ error: "Quiz not found" });
    res.json(quiz);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Submit quiz (basic evaluation)
export const submitQuiz = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { answers } = req.body;

    const quiz = await Quiz.findOne({ course_id: courseId });
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    let score = 0;

    quiz.questions.forEach((q, qi) => {
      const userAnswer = answers.find(a => a.questionIndex === qi);
      if (!userAnswer) return;

      const correctIndexes = q.options
        .map((opt, idx) => (opt.isCorrect ? idx : null))
        .filter(idx => idx !== null);

      const isCorrect =
        correctIndexes.length === userAnswer.selectedOptions.length &&
        correctIndexes.every(idx => userAnswer.selectedOptions.includes(idx));

      if (isCorrect) score++;
    });

    res.json({ total: quiz.questions.length, score });
  } catch (err) {
    res.status(500).json({ message: "Error submitting quiz", error: err.message });
  }
};