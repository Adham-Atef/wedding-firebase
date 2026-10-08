const SHEET_NAME = 'RSVPs';
const SPREADSHEET_TITLE = 'Wedding RSVPs';
const HEADERS = [
  'Timestamp',
  'Guest Name',
  'Attendance',
  'Number of Guests',
  'Attending Events',
  'Dietary Notes',
  'Personal Message / Wishes',
];

function doGet() {
  return ContentService.createTextOutput('RSVP service is ready.');
}

function setup() {
  const properties = PropertiesService.getScriptProperties();
  let spreadsheetId = properties.getProperty('SPREADSHEET_ID');
  let spreadsheet;

  if (spreadsheetId) {
    spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  } else {
    spreadsheet = SpreadsheetApp.create(SPREADSHEET_TITLE);
    spreadsheetId = spreadsheet.getId();
    properties.setProperty('SPREADSHEET_ID', spreadsheetId);
  }

  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) {
    const sheets = spreadsheet.getSheets();
    if (sheets.length === 1 && sheets[0].getLastRow() === 0) {
      sheet = sheets[0];
      sheet.setName(SHEET_NAME);
    } else {
      sheet = spreadsheet.insertSheet(SHEET_NAME);
    }
  }

  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
  }
  Logger.log('RSVP spreadsheet: ' + spreadsheet.getUrl());
}

function doPost(e) {
  const params = (e && e.parameter) || {};
  const guestName = String(params.guestName || '').trim().slice(0, 100);
  const attendance = String(params.attendance || '');

  if (!guestName) {
    throw new Error('Guest name is required.');
  }
  if (attendance !== 'attending' && attendance !== 'declined') {
    throw new Error('Attendance must be attending or declined.');
  }

  const guestCount = Math.min(
    Math.max(parseInt(params.numberOfGuests, 10) || 1, 1),
    10
  );
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const spreadsheetId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
    if (!spreadsheetId) {
      throw new Error('Run setup once before accepting RSVP submissions.');
    }
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    let sheet = spreadsheet.getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = spreadsheet.insertSheet(SHEET_NAME);
    }

    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
      sheet.setFrozenRows(1);
    }

    const safeText = (value, maxLength) => {
      const text = String(value || '').slice(0, maxLength);
      return /^[=+\-@]/.test(text) ? "'" + text : text;
    };

    sheet.appendRow([
      new Date(),
      safeText(guestName, 100),
      attendance,
      guestCount,
      safeText(params.events, 500),
      safeText(params.dietaryNotes, 300),
      safeText(params.message, 500),
    ]);
  } finally {
    lock.releaseLock();
  }

  return ContentService.createTextOutput('RSVP saved.');
}
