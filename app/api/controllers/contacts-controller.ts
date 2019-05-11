'use strict';

import { Response, Request } from 'express';
import { SentSMS, ReceivedSMS, GroupedSMS } from '../../db';

type ChartCoords = {
  x: string,
  y: number
}

 type Value = {
   label: string,
   value: number
 }

type ChartItem = {
  contact: string,
  values?: Value[]
}


/**
 * Get people and sms count for specific day
 * @param req 
 * @param res 
 */
export let getDayContacts = async (req: Request, res: Response) => {
  /**
 * GET /sms/contacts?month={monthID}&day={day}&year{year}
 */
  const month = parseInt(req.query.month);
  const day = parseInt(req.query.day);
  const year = parseInt(req.query.year);

  let sent: ChartCoords[];
  let received: ChartCoords[];

  const contactQuery = [{
    $group: {
      _id: { month: { $month: "$timestamp" }, day: { $dayOfMonth: "$timestamp" }, year: { $year: "$timestamp" }, contact_name: "$contact_name" },
      totalTexts: { $sum: 1 }
    }, 
  }, {
    $sort: {
      '_id.year': 1,
      '_id.month': 1,
      '_id.day': 1
    }
  }, {
    $match: {
      '_id.month': month,
      '_id.year': year,
      '_id.day': day
    }
  }];

  let sentMaxY = 0;
  let receivedMaxY = 0;

  sent = await new Promise((resolve) => {
    SentSMS.aggregate(contactQuery).exec((err, result) => {
      parseResult(result).then((parsedResult) => {
        if (parsedResult.length <= 0) {
          return resolve([]);
        }
        sentMaxY = 0;
        parsedResult.forEach((dataPoint: ChartCoords) => {
          sentMaxY = dataPoint.y > sentMaxY ? dataPoint.y : sentMaxY;
        });
        return resolve(parsedResult);
      });
    });
  });

  received = await new Promise((resolve) => {
    ReceivedSMS.aggregate(contactQuery).exec((err, result) => {
      parseResult(result).then((parsedResult: ChartCoords[]) => {
        if (parsedResult.length <= 0) {
          return resolve([]);
        }
        receivedMaxY = 0;
        parsedResult.forEach((dataPoint: ChartCoords) => {
          receivedMaxY = dataPoint.y > receivedMaxY ? dataPoint.y : receivedMaxY;
        });
        return resolve(parsedResult);
      });
    });
  });

  const maxY = sentMaxY > receivedMaxY ? sentMaxY : receivedMaxY;

  const mergedResults = await mergeResults(sent, received);

  res.status(200).json({
    sms: mergedResults,
    maxY: maxY,
    minY: 0,
    length: sent.length > received.length ? sent.length : received.length
  });
};


async function parseResult(smsGroup: GroupedSMS[]): Promise<ChartCoords[]> {
  return new Promise((resolve) => {
    let coords: ChartCoords[] = [];
    smsGroup.forEach((sms: GroupedSMS, index: number) => {
      coords.push({
        x: sms._id.contact_name as string,
        y: sms.totalTexts
      });
    });

    resolve(coords);
  });
}

async function mergeResults(sent: ChartCoords[], received: ChartCoords[]): Promise<ChartItem[]>  {
  return new Promise((resolve) => {
    let mergedArray: ChartItem[] = [];
    received.forEach((item) => {
      mergedArray.push({ contact: item.x });
    })
    sent.forEach((item) => {
      let found: ChartItem[];
      found = mergedArray.filter((mergedItem) => {
        return mergedItem.contact === item.x;
      });
      if (found.length === 0) {
        mergedArray.push({ contact: item.x });
      }
    });
    mergedArray.sort();
    mergedArray.forEach((item) => {
      item.values = [];
      const sentFiltered = sent.filter((val) => val.x === item.contact)[0];
      item.values.push({
        label: 'Sent',
        value: sentFiltered ? sentFiltered.y : 0
      });
      const receivedFiltered = received.filter((val) => val.x === item.contact)[0];
      item.values.push({
        label: 'Received',
        value: receivedFiltered ? receivedFiltered.y : 0
      });
    });

    resolve(mergedArray);
  });
}