import { Router } from "express";
import {
  login,
  refresh,
  logout,
  me,
} from "../controllers/auth.controller.ts";

const router = Router();

router.post("/auth/login", login);
router.post("/auth/refresh", refresh);
router.post("/auth/logout", logout);
router.get("/auth/me", me);

export default router;
