import { Router } from "express";
import { QuizController } from "../controllers/quiz.controller.ts";
import { authenticate } from "../middlewares/auth.middleware.ts";
import { API_ROUTES } from "../constants/routes.ts";

const router = Router();

// All routes require authentication
router.use(authenticate);

// Quiz CRUD
router.post(API_ROUTES.QUIZZES.BASE, QuizController.createQuiz);
router.get(API_ROUTES.QUIZZES.BASE, QuizController.listQuizzes);
router.get(`${API_ROUTES.QUIZZES.BASE}/:id`, QuizController.getQuiz);
router.put(`${API_ROUTES.QUIZZES.BASE}/:id`, QuizController.updateQuiz);
router.delete(`${API_ROUTES.QUIZZES.BASE}/:id`, QuizController.deleteQuiz);

// Quiz status management
router.patch(`${API_ROUTES.QUIZZES.BASE}/:id/status`, QuizController.updateQuizStatus);

// Quiz statistics and scans
router.get(`${API_ROUTES.QUIZZES.BASE}/:id/statistics`, QuizController.getQuizStatistics);
router.get(`${API_ROUTES.QUIZZES.BASE}/:id/scans`, QuizController.getQuizScans);

export default router;
