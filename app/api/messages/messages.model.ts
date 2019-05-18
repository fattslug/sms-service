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

export interface MessageChartCoords {
  x: Date,
  y: number
}

export interface ChartValue {
  label: string,
  value: number
}

export interface MessageChartData {
  date: Date;
  values?: ChartValue[];
}