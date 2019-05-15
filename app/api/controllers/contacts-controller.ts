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
      _id: {
        month: { $month: "$timestamp" }, day: { $dayOfMonth: "$timestamp" }, year: { $year: "$timestamp" },
        contact_name: "$contact_name",
        phone_number: "$phone_number",
      },
      sms_group: { $push: "$sms_body" },
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
      console.log('Sent:', result[4]._id.contact_name, result[4].totalTexts, result[4].sms_group.length);
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
      console.log('Received:', result[5]._id.contact_name, result[5].totalTexts, result[5].sms_group);
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
    smsGroup.forEach((sms: GroupedSMS) => {
      const contact = sms._id.contact_name === '' ? sms._id.phone_number : sms._id.contact_name;
      coords.push({
        x: contact as string,
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
      const sentFiltered = sent.filter((val) => val.x === item.contact);
      let totalSent = 0;
      sentFiltered.forEach((val) => totalSent += val.y);
      item.values.push({
        label: 'Sent',
        value: totalSent
      });
      const receivedFiltered = received.filter((val) => val.x === item.contact);
      let totalReceived = 0;
      receivedFiltered.forEach((val) => totalReceived += val.y);
      item.values.push({
        label: 'Received',
        value: totalReceived
      });
    });

    resolve(mergedArray);
  });
}