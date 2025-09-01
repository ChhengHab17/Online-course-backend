import { enrollUser, getAllEnrollments, getUserEnrollments, deleteEnrollment, updateProgress, markEnrollPaid} from "../controllers/enrollmentController.js";
import { Router } from "express";

export const enrollmentRouter = Router();

enrollmentRouter.post("/", enrollUser);
enrollmentRouter.get("/", getAllEnrollments);
enrollmentRouter.get("/user/:id", getUserEnrollments);
enrollmentRouter.delete("/:user_id/:course_id", deleteEnrollment);
enrollmentRouter.patch("/", updateProgress);
enrollmentRouter.patch("/mark-paid", markEnrollPaid);
