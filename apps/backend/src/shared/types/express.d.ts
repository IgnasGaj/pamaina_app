import { AuthenticatedUser } from "@/shared/types/auth.types";

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export {};
