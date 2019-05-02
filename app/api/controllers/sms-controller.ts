'use strict';

import { Response, Request } from 'express';
import { SentSMS, ReceivedSMS, GroupedSMS } from '../../db';

type ChartCoords = {
  x: Date,
  y: number
}

type ChartItem = {
  date: Date,
  sent?: number,
  received?: number
}

/**
 * GET /sms/month/{monthID}?year{year}
 */
export let getMonthOverview = async (req: Request, res: Response) => {
  const month = parseInt(req.params.month);
  const year = parseInt(req.query.year);

  let sent: ChartCoords[];
  let received: ChartCoords[];

  const monthQuery = [{
    $group: {
      _id : { month: { $month: "$timestamp" }, day: { $dayOfMonth: "$timestamp" }, year: { $year: "$timestamp" } },
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
      '_id.year': year
    }
  }];

  let sentMaxY = 0;
  let sentMaxX = new Date(year, month);
  let receivedMaxY = 0;
  let receivedMaxX = new Date(year, month);

  sent = await new Promise((resolve) => {
    SentSMS.aggregate(monthQuery).exec((err, result) => {
      parseResult(result).then((parsedResult) => {
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
    ReceivedSMS.aggregate(monthQuery).exec((err, result) => {
      parseResult(result).then((parsedResult: ChartCoords[]) => {
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

  const mergedResults = await mergeResults(sent, received);

  res.status(200).json({
    sms: mergedResults,
    maxX: maxX,
    maxY: maxY,
    minX: new Date(year, month-1, 1),
    minY: 0,
    length: sent.length > received.length ? sent.length : received.length
  });

};

/**
 * GET /sms/year/{year}
 */
export let getYearOverview = async (req: Request, res: Response) => {
  const year = parseInt(req.params.year);

  let sent: ChartCoords[];
  let received: ChartCoords[];

  const yearQuery = [{
    $group: {
      _id : { month: { $month: "$timestamp" }, year: { $year: "$timestamp" } },
      totalTexts: { $sum: 1 }
    }, 
  }, {
    $sort: {
      '_id.year': 1,
      '_id.month': 1,
    }
  }, {
    $match: {
      '_id.year': year
    }
  }];

  let sentMaxY = 0;
  let sentMaxX = new Date(year);
  let receivedMaxY = 0;
  let receivedMaxX = new Date(year);

  sent = await new Promise((resolve) => {
    SentSMS.aggregate(yearQuery).exec((err, result) => {
      parseResult(result).then((parsedResult) => {
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
    ReceivedSMS.aggregate(yearQuery).exec((err, result) => {
      parseResult(result).then((parsedResult: ChartCoords[]) => {
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

  const mergedResults = await mergeResults(sent, received);

  res.status(200).json({
    sms: mergedResults,
    maxX: maxX,
    maxY: maxY,
    minX: new Date(year, 0, 1),
    minY: 0,
    length: sent.length > received.length ? sent.length : received.length
  });

};

/**
 * GET /sms/year/{year}
 */
export let getDecadeOverview = async (req: Request, res: Response) => {
  const year = parseInt(req.params.year);

  let sent: ChartCoords[];
  let received: ChartCoords[];

  const yearQuery = [{
    $group: {
      _id : { year: { $year: "$timestamp" } },
      totalTexts: { $sum: 1 }
    }, 
  }, {
    $sort: {
      '_id.year': 1,
    }
  }];

  let sentMaxY = 0;
  let sentMaxX = new Date();
  let receivedMaxY = 0;
  let receivedMaxX = new Date();

  sent = await new Promise((resolve) => {
    SentSMS.aggregate(yearQuery).exec((err, result) => {
      parseResult(result).then((parsedResult) => {
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
    ReceivedSMS.aggregate(yearQuery).exec((err, result) => {
      parseResult(result).then((parsedResult: ChartCoords[]) => {
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

  const mergedResults = await mergeResults(sent, received);

  res.status(200).json({
    sms: mergedResults,
    maxX: maxX,
    maxY: maxY,
    minX: new Date(year, 0, 1),
    minY: 0,
    length: sent.length > received.length ? sent.length : received.length
  });

};

async function parseResult(smsGroup: GroupedSMS[]): Promise<ChartCoords[]> {
  return new Promise((resolve) => {
    let coords: ChartCoords[] = [];
    smsGroup.forEach((sms: GroupedSMS, index: number) => {
      const parsedDate = new Date(sms._id.year, (sms._id.month || 1)-1, (sms._id.day || 1));
      coords.push({
        x: parsedDate,
        y: sms.totalTexts
      });
    });

    resolve(coords);
  });
}

async function mergeResults(sent: ChartCoords[], received: ChartCoords[]): Promise<ChartItem[]> {
  return new Promise((resolve) => {
    let mergedArray: ChartItem[] = [];
    received.forEach((item) => {
      mergedArray.push({ date: item.x });
    })
    sent.forEach((item) => {
      let found: ChartItem[];
      found = mergedArray.filter((mergedItem) => {
        return mergedItem.date.getTime() === item.x.getTime();
      });
      if (found.length === 0) {
        mergedArray.push({ date: item.x });
      }
    });
    mergedArray.sort((a, b) => a.date.getTime() - b.date.getTime());
    mergedArray.forEach((item) => {
      const sentFiltered = sent.filter((val) => val.x.getTime() === item.date.getTime())[0];
      item.sent = sentFiltered ? sentFiltered.y : 0;
      const receivedFiltered = received.filter((val) => val.x.getTime() === item.date.getTime())[0];
      item.received = receivedFiltered ? receivedFiltered.y : 0;
    });
    resolve(mergedArray);
  });
}