'use strict';

import { Response, Request } from 'express';
import { SentSMS, ReceivedSMS } from '../../db';
import { months } from 'moment';

type Message = {
  sent?: boolean,
  timestamp: Date,
  phone_number: string,
  sms_body: string
}

type Conversation = {
  _id: {
    contact_name: string,
    month?: number,
    day?: number,
    year?: number
  },
  messages: Message[]
}


/**
 * Get people and sms count for specific day
 * @param req 
 * @param res 
 */
export let getDayConversation = async (req: Request, res: Response) => {
  /**
 * GET /sms/conversation?month={monthID}&day={day}&year{year}
 */
  const month = parseInt(req.query.month);
  const day = parseInt(req.query.day);
  const year = parseInt(req.query.year);

  const startDate = new Date(year, month-1, day);
  const endDate = new Date(year, month-1, day)
  endDate.setDate(endDate.getDate() + 1);

  let sent: Conversation[];
  let received: Conversation[];

  const conversationQuery = [{
    $sort: {
      timestamp: 1
    }
  }, {
    $group: {
      _id: {
        contact_name: "$contact_name",
        month: { $month: "$timestamp" }, day: { $dayOfMonth: "$timestamp" }, year: { $year: "$timestamp" }
      },
      messages: { $push: "$$ROOT" }
    }
  }, {
    $match: {
      '_id.month': month,
      '_id.day': day,
      '_id.year': year
    }
  }];

  sent = await new Promise((resolve) => {
    SentSMS.aggregate(conversationQuery).exec((err, result) => {
      // console.log(result);
      return resolve(result);
    });
  });

  received = await new Promise((resolve) => {
    ReceivedSMS.aggregate(conversationQuery).exec((err, result) => {
      return resolve(result);
    });
  });

  const mergedResults = await mergeResults(sent, received);

  res.status(200).json({
    sms: mergedResults
  });
};

async function mergeResults(sent: Conversation[], received: Conversation[]): Promise<Conversation[]>  {
  let contacts: string[] = [];
  let mergedConversations: Conversation[] = [];
  return new Promise((resolve) => {
    sent.forEach((contact) => {
        contact.messages.map((m) => m.sent = true);
        contacts.push(contact._id.contact_name);
        mergedConversations.push({
          _id: { contact_name: contact._id.contact_name },
          messages: contact.messages
        });
    });
    received.forEach((contact) => {
      contact.messages.map((m) => m.sent = false);
      if (!contacts.includes(contact._id.contact_name)) {
        contacts.push(contact._id.contact_name);
        mergedConversations.push({
          _id: { contact_name: contact._id.contact_name },
          messages: contact.messages
        });
      } else {
        const foundConvo: Conversation = mergedConversations.find((c) => c._id.contact_name === contact._id.contact_name) as Conversation;
        foundConvo.messages.push(...contact.messages);
      }
    });
    
    mergedConversations.forEach((c) => {
      c.messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    });

    resolve(mergedConversations);
  });
}