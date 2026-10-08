const SHEET_NAME = 'RSVPs';
const SPREADSHEET_ID = '1gv7-RVclOKKGhJbIOKKT1O_m8d_J1VqZJFMS4mngiB8';
const HEADERS = [
  'Timestamp',
  'Guest Name',
  'Attendance',
  'Number of Guests',
  'Attending Events',
  'Dietary Notes',
  'Personal Message / Wishes',
];
const WISHES_SHEET_NAME = 'Wishes';
const WISHES_HEADERS = [
  'Timestamp',
  'Sender Name',
  'Relationship',
  'Attendance',
  'Message',
  'Likes',
];

function doGet(e) {
  const params = (e && e.parameter) || {};
  if (params.action === 'listWishes') {
    return listWishes();
  }
  return ContentService.createTextOutput('RSVP service is ready.');
}

function listWishes() {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ensureSheet(spreadsheet, WISHES_SHEET_NAME, WISHES_HEADERS);
    const lastRow = sheet.getLastRow();
    const wishes = lastRow < 2
      ? []
      : sheet.getRange(2, 1, lastRow - 1, WISHES_HEADERS.length).getDisplayValues()
        .map((row, index) => ({
          id: 'sheet-wish-' + (index + 2),
          timestamp: row[0] || 'Recently',
          senderName: row[1] || 'Guest',
          relationship: row[2] || 'Friend',
          attendance: row[3] === 'declined' ? 'declined' : 'attending',
          message: row[4] || '',
          likesCount: Math.max(0, parseInt(row[5], 10) || 0),
        }))
        .reverse();
    return ContentService
      .createTextOutput(JSON.stringify({ wishes: wishes }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: String(error) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function setup() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);

  ensureSheet(spreadsheet, SHEET_NAME, HEADERS);
  ensureSheet(spreadsheet, WISHES_SHEET_NAME, WISHES_HEADERS);
  Logger.log('RSVP spreadsheet: ' + spreadsheet.getUrl());
}

function ensureSheet(spreadsheet, sheetName, headers) {
  let sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
  }
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function doPost(e) {
  const params = (e && e.parameter) || {};
  if (params.action === 'wish') {
    return appendWish(params);
  }
  if (params.action === 'likeWish') {
    return likeWish(params);
  }

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
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ensureSheet(spreadsheet, SHEET_NAME, HEADERS);
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

function appendWish(params) {
  const senderName = String(params.senderName || '').trim().slice(0, 80);
  const message = String(params.message || '').trim().slice(0, 600);
  if (!senderName || !message) {
    throw new Error('Sender name and blessing message are required.');
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ensureSheet(spreadsheet, WISHES_SHEET_NAME, WISHES_HEADERS);
    const safeText = (value, maxLength) => {
      const text = String(value || '').slice(0, maxLength);
      return /^[=+\-@]/.test(text) ? "'" + text : text;
    };
    sheet.appendRow([
      new Date(),
      safeText(senderName, 80),
      safeText(params.relationship || 'Guest', 50),
      'attending',
      safeText(message, 600),
      0,
    ]);
  } finally {
    lock.releaseLock();
  }
  return ContentService.createTextOutput('Blessing saved.');
}

function likeWish(params) {
  const rowNumber = parseInt(params.rowNumber, 10);
  if (!Number.isInteger(rowNumber) || rowNumber < 2) {
    throw new Error('Invalid blessing row.');
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ensureSheet(spreadsheet, WISHES_SHEET_NAME, WISHES_HEADERS);
    if (rowNumber > sheet.getLastRow()) {
      throw new Error('Blessing no longer exists.');
    }
    const likesCell = sheet.getRange(rowNumber, 6);
    likesCell.setValue(Math.max(0, parseInt(likesCell.getValue(), 10) || 0) + 1);
  } finally {
    lock.releaseLock();
  }
  return ContentService.createTextOutput('Blessing liked.');
}
