import { Document, Schema, Model, model, connect } from 'mongoose';
import dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config({ path: '.env' });

connect(process.env.MONGO_URL as string, (err) => {
  if (err) {
    console.log(chalk.black.bgRed('Error connecting to database: '), err);
    return process.exit();
  } else {
    console.log(chalk.green('Successfully connected to MongoDB'));
  }
});

export interface SMS extends Document {
  timestamp: Date,
  phone_number: string,
  contact_name: string,
  sms_body: string,
  from?: boolean,
  to?: boolean,
}

export interface GroupedSMS extends Document {
  _id: {
    month: number,
    day: number,
    year: number,
    contact_name?: string,
    phone_number?: string,
    sms_group?: any
  },
  phone_number?: string,
  totalTexts: number,
  from?: boolean,
  to?: boolean,
}

export interface DBMessage extends Document {
  _id: any,
  timestamp: Date,
  phone_number: string,
  contact_name: string,
  sms_body: string
}

let receivedSchema = new Schema({
  timestamp: Date,
  phone_number: String,
  contact_name: String,
  sms_body: String,
}, {
  collection: 'received'
});

let sentSchema = new Schema({
  timestamp: Date,
  phone_number: String,
  contact_name: String,
  sms_body: String,
}, {
  collection: 'sent'
});

export const SentSMS: Model<SMS> = model('SentSMS', sentSchema);
export const ReceivedSMS: Model<SMS> = model('ReceivedSMS', receivedSchema);

export async function dropCollection(collection: Model<SMS>) {
  return new Promise((resolve, reject) => {
    collection.deleteMany({}, (err) => {
      if (err) { return reject(err) }
      return resolve(true);
    });
  });
}