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