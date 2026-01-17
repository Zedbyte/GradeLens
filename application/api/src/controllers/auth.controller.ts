import { Request, Response } from "express";
import {
  loginService,
  refreshService,
  logoutService,
  meService,
} from "../services/auth.service.ts";

/**
 * POST /auth/login
 */
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    console.log("Login attempt:", { email, hasPassword: !!password });

    const { user, accessToken, refreshToken } =
      await loginService({ email, password });

    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/auth/refresh",
      maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
    });

    return res.status(200).json({
      user,
      accessToken,
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(401).json({
      message: "Invalid credentials",
    });
  }
};

/**
 * POST /auth/refresh
 */
export const refresh = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies?.refresh_token;

    if (!refreshToken) {
      return res.status(401).json({ message: "Unauthorized. Token Not Found." });
    }

    const { user, accessToken, newRefreshToken } =
      await refreshService(refreshToken);

    res.cookie("refresh_token", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/auth/refresh",
      maxAge: 1000 * 60 * 60 * 24 * 30,
    });

    return res.status(200).json({
      user,
      accessToken,
    });
  } catch {
    return res.status(401).json({ message: "Unauthorized. Refresh Failed" });
  }
};

/**
 * POST /auth/logout
 */
export const logout = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies?.refresh_token;

    if (refreshToken) {
      await logoutService(refreshToken);
    }

    res.clearCookie("refresh_token", {
      path: "/api/auth/refresh",
    });

    return res.status(204).send();
  } catch {
    return res.status(204).send();
  }
};

/**
 * GET /auth/me
 */
export const me = async (req: Request, res: Response) => {
  try {
    // req.user will be populated later by auth middleware
    const user = await meService(req);

    return res.status(200).json({ user });
  } catch {
    return res.status(401).json({ message: "Unauthorized. User Not Found." });
  }
};
