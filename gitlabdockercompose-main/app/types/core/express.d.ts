declare module 'express-serve-static-core' {
  interface Request {
    user: IUser;
    fileError: { [key: string]: string };
  }
}

export {};
