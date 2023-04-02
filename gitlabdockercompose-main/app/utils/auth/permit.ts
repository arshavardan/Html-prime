/* eslint-disable no-param-reassign */
import { Request, Response } from 'express';
import HttpStatus from 'http-status';
import { Status } from '../../types/enums/Status';
import { ErrorCodes } from '../../types/errors/codes';
import { ErrorMessages } from '../../types/errors/messages';

const permit = {
  allow: (role: string) => {
    const handler = (_: Request, res: Response, next: any) => {
      if (role === 'all') {
        // if role has "all", then the route is accessible by all
        return next();
      }
      // [Todo]: add RBAC based role check using keycloak here

      return res.status(HttpStatus.UNAUTHORIZED).json({
        status: Status.ACCESS_DENIED,
        code: ErrorCodes.E401,
        message: ErrorMessages.E401,
      });
    };

    // authorize based on user role
    return handler;
  },
  block: (res: Response) =>
    res.status(HttpStatus.UNAUTHORIZED).json({
      status: Status.ACCESS_DENIED,
      code: ErrorCodes.E401,
      message: ErrorMessages.E401,
    }),
};

export default permit;
