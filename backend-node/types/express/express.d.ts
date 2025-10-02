import { IUser } from "../../model/User";

declare module "express-serve-static-core" {
  interface Request {
    user?: IUser; // optional if it may not exist
  }
}