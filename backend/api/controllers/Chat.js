import * as chatService from '../services/Chat.js';
import { InvalidInputException } from '../exceptions/InvalidInputException.js';
import { NotLoggedInException } from '../exceptions/NotLoggedInException.js';
import { NotAllowedException } from '../exceptions/NotAllowedException.js';
import acl from '../../acl.js';

export const joinRoom = async (req, res, next) => {
  try {
    // if (!acl('myProfile', req)) {
    //   throw new NotAllowedException('You are not allowed!', 403);
    // }

    const result = await chatService.joinRoom(req, res);

    return res.send(result);
  } catch (error) {
    next(error);
  }
};
