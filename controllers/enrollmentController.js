import Enrollment from "../models/enrollmentModel.js";
import Course from "../models/courseModel.js";

export const getAllEnrollments = async (req, res) => {
        try {
            const enrollments = await Enrollment.find();
            res.json(enrollments);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };

export const enrollUser = async (req, res) => {
  try {
    const { user_id, course_id } = req.body;
    console.log(user_id, course_id);

    const course = await Course.findById(course_id);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }
    let enrollment = await Enrollment.findOne({ user_id, course_id });
    // Set payment_status automatically
    if (!enrollment) {
      // Determine payment status
      const payment_status = course.course_price === 0 ? "paid" : "pending";

      // Create new enrollment
      enrollment = new Enrollment({
        user_id,
        course_id,
        progress_status: 0,
        payment_status,
      });

      enrollment = await enrollment.save();
    }
    res.status(200).json({data: {enrollment, course}, success: true});
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: "User is already enrolled in this course" });
    }
    res.status(500).json({ error: error.message });
  }
};

//get all of user course
export const getUserEnrollments = async (req, res) => {
    try {
    const enrollments = await Enrollment.find({ user_id: req.params.id })
      .populate("course_id"); // populate course details directly

    const formattedData = enrollments.map((enrollment) => ({
      enrollment_id: enrollment._id,
      payment_status: enrollment.payment_status,
      enrolled_at: enrollment.enrolled_at,
      course: enrollment.course_id, // course object
    }));

    res.json({ success: true, data: formattedData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateProgress = async (req, res) => {
    try {
        const { user_id, course_id, progress_status } = req.body;
        const enrollment = await Enrollment.findOne({ user_id, course_id });
        if (!enrollment) {
            return res.status(404).json({ error: "Enrollment not found" });
        }
        enrollment.progress_status = progress_status;
        const updatedEnrollment = await enrollment.save();
        res.json(updatedEnrollment);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
    
}

export const deleteEnrollment = async (req, res) => {
    try {
        const { user_id, course_id } = req.params;
        const enrollment = await Enrollment.findOneAndDelete({ user_id, course_id });
        if (!enrollment) {
            return res.status(404).json({ error: "Enrollment not found" });
        }
        res.json({ message: "Enrollment deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export const markEnrollPaid = async ( req, res) => {
    try {
    const { user_id, course_id } = req.body;

    const enrollment = await Enrollment.findOne({ user_id, course_id });
    if (!enrollment) return res.status(404).json({ error: "Enrollment not found" });

    enrollment.payment_status = "paid";
    await enrollment.save();

    res.status(200).json({ success: true, enrollment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}