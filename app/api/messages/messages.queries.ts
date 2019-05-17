import { DateDeclaration, DateGrouping } from './messages.model';

export const generateDetailedMessagesQuery = (
  year: string | number,
  month: string | number,
  day: string | number
) => {
  year = typeof year === 'string' ? parseInt(year) : year;
  month = typeof month === 'string' ? parseInt(month) : month;
  day = typeof day === 'string' ? parseInt(day) : day;
    
  return ([
    {
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
        "_id.month": month,
        "_id.day": day,
        "_id.year": year
      }
    }
  ]);
};

export const generateCountQuery = (
  queryParams: {
    [key: string]: string | number | undefined,
    year?: string | number,
    month?: string | number,
    day?: string | number
  }
) => {
  const match: DateDeclaration = {};
  const group: DateGrouping = {};
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

  if (!group.year) {
    group.year = { $year: '$timestamp' };
    sort['_id.year'] = 1;
  } else if (group.year && !group.month) {
    group.month = { $month: '$timestamp' };
  } else if (group.year && group.month && !group.day) {
    group.day = { $dayOfMonth: '$timestamp' };
  }

  return ([
    {
      $group: {
        _id: group,
        totalTexts: { $sum: 1 }
      }, 
    }, {
      $sort: sort
    }, {
      $match: match
    }
  ]);
}