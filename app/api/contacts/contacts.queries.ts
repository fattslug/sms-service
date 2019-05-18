import { DateDeclaration } from "../shared/models/date.models";
import { ContactGrouping } from "./contacts.model";

export const generateCountQuery = (
  queryParams: {
    [key: string]: string | number | undefined,
    year?: string | number,
    month?: string | number,
    day?: string | number
  }
) => {
  const match: DateDeclaration = {};
  const group: ContactGrouping = {};
  const sort: DateDeclaration = {};

  // Build aggregation pipeline values
  Object.keys(queryParams).forEach((val) => {
    queryParams[val] = typeof queryParams[val] === 'string'
      ? parseInt(queryParams[val] as string)
      : queryParams[val];
    match[`_id.${val}`] = queryParams[val];
    sort[`_id.${val}`] = 1;
    group[val] = {};
    group[val][`$${val}`] = '$timestamp';
  });
  // Corect day to dayOfMonth grouping
  if (group.day) {
    group.day = { $dayOfMonth: '$timestamp' };
  }

  group['contact_name'] = '$contact_name';
  group['phone_number'] = '$phone_number';

  return ([
    {
      $group: {
        _id: group,
        // sms_group: { $push: "$sms_body" },
        totalTexts: { $sum: 1 }
      }, 
    }, {
      $match: match
    }
  ]);
}
