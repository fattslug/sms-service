import { Request, Response } from 'express';

import { generateDetailedMessagesQuery, generateCountQuery } from './messages.queries';
import * as helper from './messages.helper';
import { ReceivedSMS, SentSMS } from './../../db';
import { ErrorHandler } from './../error/error-handler.controller';
import { Conversation, ChartCoords } from './messages.model';

const error = new ErrorHandler();

/**
 * Get conversation data for a specific day
 * @param req 
 * @param res 
 */
export const getDetailedMessages = async (req: Request, res: Response) => {
  const { year, month, day } = req.params;

  let sent: Conversation[];
  let received: Conversation[];

  // Generate MongoDB aggregate pipeline
  const detailedMessagesQuery = generateDetailedMessagesQuery(year, month, day);

  sent = await new Promise((resolve) => {
    SentSMS.aggregate(detailedMessagesQuery).exec((err, result) => {
      if (err) { return error.handle(res); }
      return resolve(result);
    });
  });

  received = await new Promise((resolve) => {
    ReceivedSMS.aggregate(detailedMessagesQuery).exec((err, result) => {
      if (err) { return error.handle(res); }
      return resolve(result);
    });
  });

  // Merge results from sent & received collections
  // Creates conversation thread
  try {
    const mergedResults = await helper.mergeConversations(sent, received);
    res.status(200).json({
      sms: mergedResults
    });
  } catch (e) {
    return error.handle(res);
  }
}

/**
 * Get number of messages sent monthly/year/daily
 * @param req 
 * @param res 
 */
export const getMessageCount = async (req: Request, res: Response) => {
  const countQuery = generateCountQuery(req.query);
  const { year, month, day } = req.query;

  let date = helper.generateDate(year || null, month || null, day || null);

  let sent: ChartCoords[];
  let received: ChartCoords[];

  let sentMaxY = 0;
  let sentMaxX = date;
  let receivedMaxY = 0;
  let receivedMaxX = date;

  sent = await new Promise((resolve) => {
    SentSMS.aggregate(countQuery).exec((err, result) => {
      if (err) { return error.handle(res) }
      helper.parseChartCoords(result).then((parsedResult) => {
        if (parsedResult.length <= 0) {
          return resolve([]);
        }
        sentMaxX = parsedResult[parsedResult.length-1].x;
        sentMaxY = 0;
        parsedResult.forEach((dataPoint: ChartCoords) => {
          sentMaxY = dataPoint.y > sentMaxY ? dataPoint.y : sentMaxY;
        });
        return resolve(parsedResult);
      });
    });
  });

  received = await new Promise((resolve) => {
    ReceivedSMS.aggregate(countQuery).exec((err, result) => {
      if (err) { return error.handle(res) }
      helper.parseChartCoords(result).then((parsedResult: ChartCoords[]) => {
        if (parsedResult.length <= 0) {
          return resolve([]);
        }
        receivedMaxX = parsedResult[parsedResult.length-1].x;
        receivedMaxY = 0;
        parsedResult.forEach((dataPoint: ChartCoords) => {
          receivedMaxY = dataPoint.y > receivedMaxY ? dataPoint.y : receivedMaxY;
        });
        return resolve(parsedResult);
      });
    });
  });

  const maxX = sentMaxX > receivedMaxX ? sentMaxX : receivedMaxX;
  const maxY = sentMaxY > receivedMaxY ? sentMaxY : receivedMaxY;

  const mergedResults = await helper.mergeCountData(sent, received);

  return res.status(200).json({
    sms: mergedResults,
    maxX: maxX,
    maxY: maxY,
    minX: date,
    minY: 0,
    length: sent.length > received.length ? sent.length : received.length
  });
}