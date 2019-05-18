import { Response } from 'express';

export class ErrorHandler {
  public handle(res: Response) {
    res.status(500).send({
      message: 'Invalid status'
    })
  }
}