// Get contacts by month
// Get contacts by day
// Get contacts by year

'use strict';

import { Response, Request } from 'express';
import { SentSMS, ReceivedSMS } from '../../db';
import * as helper from './contacts.helper';
import { generateCountQuery } from './contacts.queries';
import { DBResponse, ChartValue } from './contacts.model';
import { ErrorHandler } from '../shared/error/error-handler.controller';

const error = new ErrorHandler();

/**
 * Get number of messages sent to & received from contacts
 * Monthly, yearly, daily
 * @param req 
 * @param res 
 */
export let getContactsMessageCount = async (req: Request, res: Response) => {
  let sent: DBResponse[];
  let received: DBResponse[];

  const contactMessageCountQuery = generateCountQuery(req.query);

  sent = await new Promise((resolve) => {
    SentSMS.aggregate(contactMessageCountQuery).exec((err, result: DBResponse[]) => {
      if (err) { error.handle(res) }
      return resolve(result);
    });
  });

  received = await new Promise((resolve) => {
    ReceivedSMS.aggregate(contactMessageCountQuery).exec((err, result: DBResponse[]) => {
      if (err) { error.handle(res) }
      return resolve(result);
    });
  });

  let maxY = 0;
  const mergedResults = helper.mergeContacts(sent, received);
  mergedResults.forEach((val) => {
    console.log(val);
    val.values.forEach((v: ChartValue) => {
        maxY = v.value > maxY ? v.value : maxY;
    })
  });
  
  return res.status(200).json({
    sms: mergedResults,
    maxY: maxY,
    minY: 0,
    length: sent.length > received.length ? sent.length : received.length
  });
};