import { google, drive_v3 } from 'googleapis';
import fs from 'fs-extra';
import { createInterface } from 'readline';
import { doWhilst } from 'async';
import csv from 'csvtojson';
import moment from 'moment-timezone';
import * as log from './logger';

import { dropCollection, SentSMS, ReceivedSMS, SMS } from './db';
import { resolve } from 'bluebird';

log.open();

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/drive'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

async function resetEnv(): Promise<any> {
  // Initial reset
  // Remove & create folders...
  // CSV Directory
  const csvDir = __dirname + '/sms/csv';
  if (fs.existsSync(csvDir)) {
    fs.remove(csvDir).then(() => {
      log.write('Removed CSV directory...');
      fs.mkdir(csvDir).then(() => {
        log.write('Created CSV directory...');
      }).catch(err => {
        console.log('Error creating CSV directory: ' + err);
        log.write('Error creating CSV directory: ' + err);
      })
    }).catch(err => {
      console.log('Error removing CSV directory!', err);
      log.write('Error removing CSV directory: ' + err);
    });
  }

  // JSON Directory
  const jsonDir = __dirname + '/sms/json';
  if (fs.existsSync(jsonDir)) {
    fs.remove(jsonDir).then(() => {
      log.write('Removed JSON directory...');
      fs.mkdir(jsonDir).then(() => {
        log.write('Created JSON directory...');
      }).catch(err => {
        console.log('Error creating JSON directory: ' + err);
        log.write('Error creating JSON directory: ' + err);
      })
    }).catch(err => {
      console.log('Error removing JSON directory!', err);
      log.write('Error removing JSON directory: ' + err);
    });
  }

  // Wipe database
  await dropCollection(SentSMS).then(() => {
    log.write('Successfully dropped "sent" collection...');
  }).catch((err) => {
    console.log('Error dropping "sent" collection', err);
    log.write('Error dropping "sent" collection: ' + err);
  });
  await dropCollection(ReceivedSMS).then(() => {
    log.write('Successfully dropped "received" collection...');
  }).catch((err) => {
    console.log('Error dropping "received" collection', err);
    log.write('Error dropping "received" collection: ' + err);
  });

  return;
}



// Load client secrets from a local file.
fs.readFile(__dirname + '/credentials.json', 'utf-8', (err, content) => {
  log.write('Reading Credentials...\n');
  if (err) return console.log('Error loading client secret file:', err);
  // Authorize a client with credentials, then call the Google Drive API.
  authorize(JSON.parse(content), importFiles);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials: any, callback: any) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token: Buffer | string) => {
    if (err) return getAccessToken(oAuth2Client, callback);
    token = token.toString();
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getAccessToken(oAuth2Client: any, callback: any) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err: any, token: any) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err: any) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

/**
 * Lists the names and IDs of up to 10 files.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
async function importFiles(auth: any) {
  log.write('Successfully authenticated...');
  await resetEnv();
  log.write('Listing files from Google Drive...');
  const drive = google.drive({version: 'v3', auth});
  var pageToken: any = null;
  // Using the NPM module 'async'
  doWhilst(function (callback) {
    drive.files.list({
      q: `'0B3EHeYiASbyVRTNaV0FzTHYyVTA' in parents`,
      fields: 'nextPageToken, files(id, name, mimeType)',
      spaces: 'drive',
      pageToken: pageToken
    }, function (err: any, res: any) {
      if (err) {
        // Handle error
        console.error(err);
        callback(err)
      } else {
        res.data.files = res.data.files.filter((f: drive_v3.Schema$File) => f.mimeType === 'application/vnd.google-apps.spreadsheet');
        log.write('Files to download: ' + res.data.files.length);
        let finished = 0;
        res.data.files.forEach(function (file: drive_v3.Schema$File, index: number) {
          // log.write(file.name + ': ' + file.id + ' --- ' + file.mimeType);
          setTimeout(async () => {
            log.write('Downloading file number: ' + index);
            downloadFile(file, auth, index).then(() => {
              finished++;
              console.log(`Status: ${finished} of ${res.data.files.length}`);
              log.write(`Status: ${finished} of ${res.data.files.length}`);
              if (finished === res.data.files.length) {
                console.log('DONE!');
                process.exit();
              }
            });
          }, 1000*index);
        });
        pageToken = res.nextPageToken;
        callback();
      }
    });
  }, function () {
    return !!pageToken;
  }, function (err) {
    if (err) {
      // Handle error
      console.error(err);
    } else {
      // All pages fetched
    }
  });
}

// Download file from Google Drive
// No column titles attached
async function downloadFile(file: drive_v3.Schema$File, auth: any, fileIndex: number): Promise<any> {
  log.write(`Downloading file: ${file.name} -- ${fileIndex}`);
  return new Promise((resolve, reject) => {
    const drive = google.drive({version: 'v3', auth});
    drive.files.export({
      fileId: file.id,
      mimeType: 'text/csv'
    }).then(async (content) => {
      const filename = __dirname + `/sms/csv/${file.name}-${file.id}.csv`;
      fs.writeFileSync(filename, content.data);
      if (content.status !== 200) {
        // console.log(content.status, file.name);
        process.abort();
      } else {
        await convertToJson(filename, fileIndex);
        resolve();
      }
    }).catch(e => {
      console.error('ERROR -- From Drive:', file.name, e);
      log.write(`ERROR -- From Drive: ${file.name} -- ${file.mimeType}`);
    });
  });
}

// Convert to JSON with appropriate named properties
async function convertToJson(filename: string, fileIndex: number): Promise<any> {
  const jsonfilename = filename.split('csv').join('json');
  let jsonStream = fs.createWriteStream(jsonfilename);

  const jsonArray = await csv({
    noheader: true,
    headers: ['timestamp', 'phone_number', 'contact_name', 'sms_body']
  }).fromFile(filename).subscribe(json => {
    // Import chunks, not whole file at once
    importToDB(jsonfilename, json);
  });

  jsonStream.write(JSON.stringify(jsonArray));
  jsonStream.end();
}

// Runs for each JSON document
// As opposed to full file at once
async function importToDB(filename: string, smsData: SMS): Promise<any> {
  let smsDocument: SMS;
  let parsedDate = moment(moment(smsData.timestamp, 'MMMM DD, YYYY LT').toDate()).tz("America/New_York").toDate();
  smsData.timestamp = parsedDate;

  if (filename.indexOf('SMS sent') > -1) {
    smsDocument = new SentSMS(smsData);
  } else {
    smsDocument = new ReceivedSMS(smsData);
  }

  return new Promise((resolve) => {
    smsDocument.save().then(() => {
      return resolve();
    }).catch(e => {
      console.log('Error inserting:', smsData, filename, e);
      log.write('Error inserting: ' + filename);
      return process.exit();
    });
  })

}