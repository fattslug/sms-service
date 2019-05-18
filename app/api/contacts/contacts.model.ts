import { DateGrouping } from "../shared/models/date.models";

export interface ChartValue {
  label: string,
  value: number
}

export interface ContactChartData {
  contact: string;
  phone: string;
  values: ChartValue[];
}

export interface ContactGrouping extends DateGrouping {
  phone_number?: string;
  contact_name?: string;
}

export interface DBResponse {
  _id: {
    month: number,
    day: number,
    year: number,
    contact_name: string,
    phone_number: string
  },
  totalTexts: number
};