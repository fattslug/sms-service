import { GroupedSMS } from './../../db';
import { Conversation, ChartCoords, MessageChartData } from "./messages.model";

export async function mergeConversations(sent: Conversation[], received: Conversation[]): Promise<Conversation[]>  {
  let contacts: string[] = [];
  let mergedConversations: Conversation[] = [];
  return new Promise((resolve, reject) => {
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

export async function parseChartCoords(smsGroup: GroupedSMS[]): Promise<ChartCoords[]> {
  return new Promise((resolve) => {
    let coords: ChartCoords[] = [];
    smsGroup.forEach((sms: GroupedSMS) => {
      const parsedDate = new Date(sms._id.year, (sms._id.month || 1)-1, (sms._id.day || 1));
      coords.push({
        x: parsedDate,
        y: sms.totalTexts
      });
    });

    resolve(coords);
  });
}

export async function mergeCountData(sent: ChartCoords[], received: ChartCoords[]): Promise<MessageChartData[]> {
  return new Promise((resolve) => {
    let mergedArray: MessageChartData[] = [];
    received.forEach((item) => {
      mergedArray.push({ date: item.x });
    })
    sent.forEach((item) => {
      let found: MessageChartData[];
      found = mergedArray.filter((mergedItem) => {
        return mergedItem.date.getTime() === item.x.getTime();
      });
      if (found.length === 0) {
        mergedArray.push({ date: item.x });
      }
    });
    mergedArray.sort((a, b) => a.date.getTime() - b.date.getTime());
    mergedArray.forEach((item) => {
      item.values = [];
      const sentFiltered = sent.filter((val) => val.x.getTime() === item.date.getTime())[0];
      item.values.push({
        label: 'Sent',
        value: sentFiltered ? sentFiltered.y : 0
      });
      const receivedFiltered = received.filter((val) => val.x.getTime() === item.date.getTime())[0];
      item.values.push({
        label: 'Received',
        value: receivedFiltered ? receivedFiltered.y : 0
      });
    });
    resolve(mergedArray);
  });
}

export function generateDate(year?: number, month?: number, day?: number): Date {
  let generatedDate = new Date();
  if (year) {
    generatedDate = new Date(generatedDate.setFullYear(year));
  }
  if (month) {
    generatedDate = new Date(generatedDate.setMonth(month));
  }
  if (day) {
    generatedDate = new Date(generatedDate.setDate(day))
  }
  return generatedDate;
}