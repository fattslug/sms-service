export interface Message {
  sent?: boolean,
  timestamp: Date,
  phone_number: string,
  contact_name: string,
  sms_body: string
}

export interface Conversation {
  _id: {
    contact_name: string,
    month?: number,
    day?: number,
    year?: number
  },
  messages: Message[]
}

export interface MessageChartData {
  date: Date;
  values?: { label: string, value: number }[];
}

export interface ChartCoords {
  x: Date,
  y: number
}

export interface DateDeclaration {
  [key: string]: string | number | undefined,
  '_id.year'?: number,
  '_id.month'?: number,
  '_id.day'?: number
}

export interface DateGrouping {
  [key: string]: any,
  year?: { $year: "$timestamp" }
  month?: { $month: "$timestamp" },
  day?: { $dayOfMonth: "$timestamp" },
}

// // Example:
// // Query for number of messages sent in 2019
// const messages: MessageChartData[] = [{
//   date: new Date(2019, 1),
//   data: [{
//     label: 'Sent',
//     value: 200
//   }, {
//     label: 'Received',
//     value: 348
//   }] 
// }, {
//     date: new Date(2019, 2),
//     data: [{
//       label: 'Sent',
//       value: 443
//     }, {
//       label: 'Received',
//       value: 321
//     }]
// }];

// // Example:
// // Query for conversations on January 1 2019
// const conversations: Conversation[] = [{
//   _id: {
//     contact_name: 'Sean Powell',
//     month: 1,
//     day: 1,
//     year: 2019
//   },
//   messages: [
//     {
//       sent: false,
//       timestamp: new Date(2019, 1, 1),
//       phone_number: '16567871616',
//       contact_name: 'Jane Applebee',
//       sms_body: 'A test message to me'
//     }, {
//       sent: true,
//       timestamp: new Date(2019, 1, 1),
//       phone_number: '14569802312',
//       contact_name: 'Sean Powell',
//       sms_body: 'A test message from me'
//     }
//   ]
// }]