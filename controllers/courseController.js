import Course from "../models/courseModel.js";
import Lesson from "../models/lessonModel.js";

export const createCourse = async (req, res) => {
    try {
        const course = new Course(req.body);
        const savedCourse = await course.save();
        res.status(201).json(savedCourse);
    }catch (error) {
        res.status(400).json({ message: error.massage});
    }
}

export const getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find().populate("category_id");

    const coursesWithLessons = await Promise.all(
      courses.map(async (course) => {
        const lessons = await Lesson.find({ course_id: course._id });
        return { ...course.toObject(), lessons };
      })
    );

    res.status(200).json(coursesWithLessons);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getCoursebyId = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate("category_id");

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const lessons = await Lesson.find({ course_id: course._id });

    res.status(200).json({
      ...course.toObject(),
      lessons
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
export const updateCourse = async (req, res) => {
    try{
        const updateCourse = await Course.findByIdAndUpdate(
            req.params.id, 
            req.body, 
            { new: true, runValidators: true }
        );
        if (!updateCourse){
            return res.status(404).json({ message: "Course not found" });
        }
        res.status(200).json(updateCourse);
    }catch (error) {
        res.status(400).json({ message: error.message });
    }
}
export const deleteCourse = async (req, res) => {
    try {
        const deleteCourse = await Course.findByIdAndDelete(req.params.id);
        if (!deleteCourse) {
            return res.status(404).json({ message: "Course not found" });
        }
        res.status(200).json({ message: "Course deleted successfully" });
    }catch (error) {
        res.status(400).json({ message: error.message });
    }
}

export const getCoursesByCategoryId = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const courses = await Course.find({ category_id: categoryId }).populate("category_id");

    const coursesWithLessons = await Promise.all(
      courses.map(async (course) => {
        const lessons = await Lesson.find({ course_id: course._id });
        return { ...course.toObject(), lessons };
      })
    );

    res.status(200).json(coursesWithLessons);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


export const getCoursesByCategoryName = async (req, res) => {
  try {
    const { categoryName } = req.params;

    // Find all courses, populate category, and match by category_name
    const courses = await Course.find()
      .populate({
        path: "category_id",
        match: { category_name: categoryName } // match by name, not ID
      });

    // Remove courses where category didn't match
    const filteredCourses = courses.filter(course => course.category_id);

    // Get lessons for each course
    const coursesWithLessons = await Promise.all(
      filteredCourses.map(async (course) => {
        const lessons = await Lesson.find({ course_id: course._id });
        return { ...course.toObject(), lessons };
      })
    );

    res.status(200).json(coursesWithLessons);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
