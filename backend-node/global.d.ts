import { IUser } from './src/model/User';

declare module 'express-serve-static-core' {
	interface Request {
		user?: IUser;
	}
}
/// <reference types="./src/types/express/express" />