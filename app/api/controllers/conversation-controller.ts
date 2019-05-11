'use strict';

import { Response, Request } from 'express';
import { SentSMS, ReceivedSMS, DBMessage } from '../../db';

type Message = {
  sent?: boolean,
  timestamp: Date,
  phone_number: string,
  sms_body: string
}

type Conversation = {
  contact: string,
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
    $match: {
      timestamp: { $gte: startDate, $lte: endDate }
    }
  }];

  sent = await new Promise((resolve) => {
    SentSMS.aggregate(conversationQuery).exec((err, result) => {
      parseResult(result).then((parsedResult: Conversation[]) => {
        return resolve(parsedResult);
      });
    });
  });

  received = await new Promise((resolve) => {
    ReceivedSMS.aggregate(conversationQuery).exec((err, result) => {
      parseResult(result).then((parsedResult: Conversation[]) => {
        return resolve(parsedResult);
      });
    });
  });

  const mergedResults = await mergeResults(sent, received);

  res.status(200).json({
    sms: mergedResults
  });
};

async function parseResult(messages: DBMessage[]): Promise<Conversation[]> {
  return new Promise((resolve) => {
    let contacts: string[] = [];
    let conversations: Conversation[] = [];
    messages.forEach((message) => {
      const newMessage = {
        timestamp: message.timestamp,
        phone_number: message.phone_number,
        sms_body: message.sms_body
      }
      if (!contacts.includes(message.contact_name)) {
        contacts.push(message.contact_name);
        conversations.push({
          contact: message.contact_name,
          messages: [message]
        });
      } else {
        const foundConvo: Conversation = conversations.find((conv) => conv.contact === message.contact_name) as Conversation;
        foundConvo.messages.push(newMessage);
      }
    });

    resolve(conversations);
  });
}

async function mergeResults(sent: Conversation[], received: Conversation[]): Promise<Conversation[]>  {
  /**
   * contact: 'Jessica',
   * messages: [{
   *  sent: true
   *  timestamp: Date(),
   *  phone_number: '6475634524',
   *  sms_body: 'Test test'
   * }]
   */
  let contacts: string[] = [];
  let conversations: Conversation[] = [];
  return new Promise((resolve) => {
    sent.forEach((conv) => {
      conv.messages.map((m) => m.sent = true);
      if (!contacts.includes(conv.contact)) {
        contacts.push(conv.contact);
        conversations.push({
          contact: conv.contact,
          messages: conv.messages
        });
      }
    });
    received.forEach((conv) => {
      conv.messages.map((m) => m.sent = false);
      if (!contacts.includes(conv.contact)) {
        contacts.push(conv.contact);
        conversations.push({
          contact: conv.contact,
          messages: conv.messages
        });
      } else {
        const foundConvo: Conversation = conversations.find((c) => c.contact === conv.contact) as Conversation;
        foundConvo.messages.push(...conv.messages);
      }
    })
    
    conversations.forEach((c) => {
      c.messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    });

    resolve(conversations);
  });
}