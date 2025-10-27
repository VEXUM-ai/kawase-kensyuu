/**
 * 出退勤打刻アプリ - Google Apps Script
 *
 * 必要な設定:
 * 1. スプレッドシートを作成
 * 2. シート名を「研修生マスタ」「打刻記録」「課題完了記録」に設定
 * 3. LINE Messaging APIの設定
 */

// 設定
const CONFIG = {
  // LINE Messaging API
  LINE_CHANNEL_ACCESS_TOKEN: 'YOZ7UftinQaO3OyBDaloYu4cXzhYtLzmqBzAGNvCIJRg7h+DoqsX0n6OXdfOFZ9vI7/+VIOKgdWLHJ6yBmeAi6kPqz4+FZ3vpHQTBEAQSHA81c9tQLH/8oP8UUyRpnHxvmJ0QlaAjZWiraJeO38tBgdB04t89/1O/w1cDnyilFU=',
  LINE_GROUP_ID: 'C5a5b36e27a78ed6cfbb74839a8a9d04e',

  // スプレッドシートID（このスクリプトがバインドされているスプレッドシート）
  SPREADSHEET_ID: SpreadsheetApp.getActiveSpreadsheet().getId(),

  // シート名
  SHEET_NAMES: {
    MASTER: '研修生マスタ',
    ATTENDANCE: '打刻記録',
    COMPLETE: '課題完了記録'
  }
};

/**
 * GETリクエスト処理
 */
function doGet(e) {
  try {
    const action = e.parameter.action;

    if (action === 'getUserInfo') {
      return getUserInfo(e.parameter.userId);
    } else if (action === 'getTodayRecord') {
      return getTodayRecord(e.parameter.userId);
    }

    return createJsonResponse(false, '不明なアクションです');
  } catch (error) {
    Logger.log('GETエラー: ' + error.toString());
    return createJsonResponse(false, 'エラーが発生しました: ' + error.toString());
  }
}

/**
 * POSTリクエスト処理
 */
function doPost(e) {
  try {
    const params = JSON.parse(e.postData.contents);
    const action = params.action;

    if (action === 'checkin') {
      return checkin(params.userId);
    } else if (action === 'checkout') {
      return checkout(params.userId);
    } else if (action === 'complete') {
      return reportComplete(params.userId, params.appUrl);
    }

    return createJsonResponse(false, '不明なアクションです');
  } catch (error) {
    Logger.log('POSTエラー: ' + error.toString());
    return createJsonResponse(false, 'エラーが発生しました: ' + error.toString());
  }
}

/**
 * ユーザー情報取得
 */
function getUserInfo(userId) {
  const sheet = getSheet(CONFIG.SHEET_NAMES.MASTER);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === userId) {
      return createJsonResponse(true, 'ユーザー情報を取得しました', {
        user: {
          id: data[i][0],
          name: data[i][1],
          status: data[i][2]
        }
      });
    }
  }

  return createJsonResponse(false, 'ユーザーが見つかりません');
}

/**
 * 本日の打刻記録取得
 */
function getTodayRecord(userId) {
  const sheet = getSheet(CONFIG.SHEET_NAMES.ATTENDANCE);
  const data = sheet.getDataRange().getValues();
  const today = Utilities.formatDate(new Date(), 'JST', 'yyyy/MM/dd');

  for (let i = data.length - 1; i >= 1; i--) {
    const rowDate = Utilities.formatDate(new Date(data[i][0]), 'JST', 'yyyy/MM/dd');
    if (rowDate === today && data[i][1] === userId) {
      return createJsonResponse(true, '本日の記録を取得しました', {
        record: {
          date: rowDate,
          userId: data[i][1],
          name: data[i][2],
          checkinTime: data[i][3] || null,
          checkoutTime: data[i][4] || null,
          workTime: data[i][5] || null
        }
      });
    }
  }

  return createJsonResponse(true, '本日の記録はありません', { record: null });
}

/**
 * 出勤打刻
 */
function checkin(userId) {
  const userInfo = getUserInfoById(userId);
  if (!userInfo) {
    return createJsonResponse(false, 'ユーザーが見つかりません');
  }

  const sheet = getSheet(CONFIG.SHEET_NAMES.ATTENDANCE);
  const now = new Date();
  const today = Utilities.formatDate(now, 'JST', 'yyyy/MM/dd');
  const time = Utilities.formatDate(now, 'JST', 'HH:mm');

  // 本日の記録が既にあるかチェック
  const existingRecord = findTodayRecord(sheet, userId, today);
  if (existingRecord && existingRecord.checkinTime) {
    return createJsonResponse(false, '既に出勤打刻済みです');
  }

  // 出勤記録を追加
  if (existingRecord) {
    // 既存行を更新
    sheet.getRange(existingRecord.row, 4).setValue(time);
  } else {
    // 新規行を追加
    sheet.appendRow([now, userId, userInfo.name, time, '', '']);
  }

  // LINE通知
  sendLineMessage(`【出勤】\n${userInfo.name}\n${today} ${time}`);

  return createJsonResponse(true, '出勤打刻が完了しました');
}

/**
 * 退勤打刻
 */
function checkout(userId) {
  const userInfo = getUserInfoById(userId);
  if (!userInfo) {
    return createJsonResponse(false, 'ユーザーが見つかりません');
  }

  const sheet = getSheet(CONFIG.SHEET_NAMES.ATTENDANCE);
  const now = new Date();
  const today = Utilities.formatDate(now, 'JST', 'yyyy/MM/dd');
  const time = Utilities.formatDate(now, 'JST', 'HH:mm');

  // 本日の出勤記録を取得
  const existingRecord = findTodayRecord(sheet, userId, today);
  if (!existingRecord || !existingRecord.checkinTime) {
    return createJsonResponse(false, '出勤打刻が見つかりません');
  }

  if (existingRecord.checkoutTime) {
    return createJsonResponse(false, '既に退勤打刻済みです');
  }

  // 勤務時間を計算
  const workTime = calculateWorkTime(existingRecord.checkinTime, time);

  // 退勤記録を更新
  sheet.getRange(existingRecord.row, 5).setValue(time);
  sheet.getRange(existingRecord.row, 6).setValue(workTime);

  // LINE通知
  const message = `【退勤】\n${userInfo.name}\n出勤：${existingRecord.checkinTime}\n退勤：${time}\n勤務：${workTime}`;
  sendLineMessage(message);

  return createJsonResponse(true, '退勤打刻が完了しました');
}

/**
 * 課題完了報告
 */
function reportComplete(userId, appUrl) {
  const userInfo = getUserInfoById(userId);
  if (!userInfo) {
    return createJsonResponse(false, 'ユーザーが見つかりません');
  }

  const sheet = getSheet(CONFIG.SHEET_NAMES.COMPLETE);
  const now = new Date();
  const dateTime = Utilities.formatDate(now, 'JST', 'yyyy/MM/dd HH:mm');

  // 課題完了記録を追加
  sheet.appendRow([now, userId, userInfo.name, appUrl, '未判定']);

  // LINE通知
  const message = `【🎉課題完了報告🎉】\n研修生：${userInfo.name}（${userId}）\n完了：${dateTime}\n\nアプリURL:\n${appUrl}\n\n確認をお願いします！`;
  sendLineMessage(message);

  return createJsonResponse(true, '課題完了報告を送信しました');
}

/**
 * ユーザー情報をIDで取得
 */
function getUserInfoById(userId) {
  const sheet = getSheet(CONFIG.SHEET_NAMES.MASTER);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === userId) {
      return {
        id: data[i][0],
        name: data[i][1],
        status: data[i][2]
      };
    }
  }

  return null;
}

/**
 * 本日の記録を検索
 */
function findTodayRecord(sheet, userId, today) {
  const data = sheet.getDataRange().getValues();

  for (let i = data.length - 1; i >= 1; i--) {
    const rowDate = Utilities.formatDate(new Date(data[i][0]), 'JST', 'yyyy/MM/dd');
    if (rowDate === today && data[i][1] === userId) {
      return {
        row: i + 1,
        date: rowDate,
        userId: data[i][1],
        name: data[i][2],
        checkinTime: data[i][3],
        checkoutTime: data[i][4],
        workTime: data[i][5]
      };
    }
  }

  return null;
}

/**
 * 勤務時間計算
 */
function calculateWorkTime(checkinTime, checkoutTime) {
  const checkin = new Date('2000/01/01 ' + checkinTime);
  const checkout = new Date('2000/01/01 ' + checkoutTime);

  const diff = checkout - checkin;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return `${hours}時間${minutes}分`;
}

/**
 * LINE通知送信
 */
function sendLineMessage(message) {
  const url = 'https://api.line.me/v2/bot/message/push';

  const payload = {
    to: CONFIG.LINE_GROUP_ID,
    messages: [
      {
        type: 'text',
        text: message
      }
    ]
  };

  const options = {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + CONFIG.LINE_CHANNEL_ACCESS_TOKEN
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();

    if (responseCode !== 200) {
      Logger.log('LINE通知エラー: ' + response.getContentText());
    }
  } catch (error) {
    Logger.log('LINE通知エラー: ' + error.toString());
  }
}

/**
 * シート取得
 */
function getSheet(sheetName) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(sheetName);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
    initializeSheet(sheet, sheetName);
  }

  return sheet;
}

/**
 * シート初期化
 */
function initializeSheet(sheet, sheetName) {
  if (sheetName === CONFIG.SHEET_NAMES.MASTER) {
    sheet.appendRow(['研修生ID', '氏名', 'ステータス']);
    sheet.appendRow(['user01', 'あなたの名前', '進行中']);
  } else if (sheetName === CONFIG.SHEET_NAMES.ATTENDANCE) {
    sheet.appendRow(['日付', '研修生ID', '氏名', '出勤時刻', '退勤時刻', '勤務時間']);
  } else if (sheetName === CONFIG.SHEET_NAMES.COMPLETE) {
    sheet.appendRow(['完了日時', '研修生ID', '氏名', 'アプリURL', '判定']);
  }

  // ヘッダー行のスタイル設定
  const headerRange = sheet.getRange(1, 1, 1, sheet.getLastColumn());
  headerRange.setBackground('#667eea');
  headerRange.setFontColor('#ffffff');
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');
}

/**
 * JSON レスポンス作成
 */
function createJsonResponse(success, message, data = {}) {
  const response = {
    success: success,
    message: message,
    ...data
  };

  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * 初期セットアップ用関数
 * スクリプトエディタから実行してスプレッドシートを初期化
 */
function setupSpreadsheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

  // 既存のシートを削除
  const sheets = spreadsheet.getSheets();
  sheets.forEach(sheet => {
    if (sheet.getName() !== CONFIG.SHEET_NAMES.MASTER) {
      spreadsheet.deleteSheet(sheet);
    }
  });

  // 各シートを初期化
  getSheet(CONFIG.SHEET_NAMES.MASTER);
  getSheet(CONFIG.SHEET_NAMES.ATTENDANCE);
  getSheet(CONFIG.SHEET_NAMES.COMPLETE);

  Logger.log('スプレッドシートのセットアップが完了しました');
}
