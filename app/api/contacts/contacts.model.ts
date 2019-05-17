export interface ContactChartData {
  _id: {
    phone_number: string,
    contact_name: string,
    month?: number,
    day?: number,
    year?: number
  };
  data: { label: string, value: number }[];
}

// Example:
// Query for contacts on January 1 2019
const example: ContactChartData[] = [{
  _id: {
    phone_number: '14569802312',
    contact_name: 'Sean Powell',
    month: 1,
    day: 1,
    year: 2019
  },
  data: [{
    label: 'Sent',
    value: 20
  }, {
    label: 'Received',
    value: 45
  }]
}, {
  _id: {
    phone_number: '16578970987',
    contact_name: 'Jessica',
    month: 1,
    day: 1,
    year: 2019
  },
  data: [{
    label: 'Sent',
    value: 64
  }, {
    label: 'Received',
    value: 43
  }]
}];