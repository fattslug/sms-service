import { SentSMS, ReceivedSMS, SMS } from './db';

// getSMSOnDate();
groupByDate();

function groupByMonth() {
  SentSMS.aggregate([{
    $group: {
      _id : { month: { $month: "$timestamp" }, day: { $dayOfMonth: "$timestamp" }, year: { $year: "$timestamp" } },
      totalTexts: { $sum: 1 }
    },
  }, {
    $sort: {
      '_id.year': 1,
      '_id.month': 1,
      '_id.day': 1
    }
  }]).exec((err, result) => {
    console.log(result);
  })
}

function groupByYear() {
  SentSMS.aggregate([{
    $group: {
      _id : { month: { $month: "$timestamp" }, day: { $dayOfMonth: "$timestamp" }, year: { $year: "$timestamp" } },
      totalTexts: { $sum: 1 }
    },
  }, {
    $sort: {
      '_id.year': 1,
      '_id.month': 1,
      '_id.day': 1
    }
  }]).exec((err, result) => {
    console.log(result);
  })
}

function groupByDate() {
  ReceivedSMS.aggregate([{
    $group: {
      _id : { month: { $month: "$timestamp" }, day: { $dayOfMonth: "$timestamp" }, year: { $year: "$timestamp" } },
      totalTexts: { $sum: 1 }
    },
  }, {
    $sort: {
      '_id.year': 1,
      '_id.month': 1,
      '_id.day': 1
    }
  }]).exec((err, result) => {
    console.log(result);
  })
}

async function getSMSOnDate() {
  let sent: SMS[];
  let received: SMS[];

  // Get Sent SMS
  sent = await new Promise((resolve) => {
    SentSMS.aggregate([{
      $project: {
        'timestamp': 1,
        'contact_name': 1,
        'sms_body': 1,
        _id : { month: { $month: "$timestamp" }, day: { $dayOfMonth: "$timestamp" }, year: { $year: "$timestamp" } }
      }
    }, {
      $addFields: {
        'to': true
      }
    }, {
      $match: {
        '_id.month': 8,
        '_id.day': 2,
        '_id.year': 2014
      }
    }, {
      $sort: {
        timestamp: 1
      }
    }]).exec((err, result: SMS[]) => {
      resolve(result);
    });
  });

  // Get Received SMS
  received = await new Promise((resolve) => {
    ReceivedSMS.aggregate([{
      $project: {
        'timestamp': 1,
        'contact_name': 1,
        'sms_body': 1,
        _id : { month: { $month: "$timestamp" }, day: { $dayOfMonth: "$timestamp" }, year: { $year: "$timestamp" } }
      }
    }, {
      $addFields: {
        'from': true
      }
    }, {
      $match: {
        '_id.month': 8,
        '_id.day': 2,
        '_id.year': 2014
      }
    }, {
      $sort: {
        timestamp: 1
      }
    }]).exec((err, result: SMS[]) => {
      resolve(result);
    });
  });

  console.log('Received Count', received.length);
  console.log('Sent Count', sent.length);

  let allSMS = [ ...received, ...sent ];
  allSMS = allSMS.sort((a, b) => {
    const a_timestamp = new Date(a.timestamp).getTime();
    const b_timestamp = new Date(b.timestamp).getTime();
    return parseInt(a_timestamp.toString()) - parseInt(b_timestamp.toString());
  });

  console.log(allSMS);
}