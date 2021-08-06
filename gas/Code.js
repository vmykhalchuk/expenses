// README!!!
// Deploy via: Publish > Deploy as web app...
//    set "Who has access to the app:" to "Anyone, even anonymous"

var _codeConst = {
  registerWebAppAlertMsg: "⛔️ Deploy Script as Web App!\nGo to \"Tools > Script editor\", and in Script editor select \"Publish > Deploy as web app...\""
};

function onOpen() {
  // Create Navigation menu
  SpreadsheetApp.getUi().createMenu("🟈Nav")
  .addItem("⤓Bottom", "onMenuNavBottom")
  .addItem("Reporting...", "onMenuNavToReportingSpreadsheet")
  .addItem("Reporting House...", "onMenuNavToReportingHouseSpreadsheet")
  .addToUi();
  
  // Create developer menu
  var devMenu = SpreadsheetApp.getUi().createMenu("🛠️Dev")
  .addItem("🛠️Run Unit Tests", "runUnitTestsInSpreadsheetApp")
  .addItem("🚧Test", "onMenuDevTest")
  .addItem("✂Clean cache entry", "onMenuDevCleanCacheEntry");
  
  SpreadsheetApp.getUi().createMenu("⚙️Z")
  .addItem("▶⏸Execute Command", "onMenuExecuteCommand")
  .addItem("⚙️Register Viber Hook", "onMenuRegisterViberHook")
  .addItem("⚙️Register MonoBank Hook", "onMenuRegisterMonoBankHook")
  .addItem("💡Help", "onMenuHelp")
  .addSubMenu(devMenu)
  .addToUi();
  // TODO validate if Viber/Mono Hook has failed, if yes - show popup stating this error!
  //SpreadsheetApp.getActiveSpreadsheet().toast('Viber Hook failed!', 'Status', -1);
  //SpreadsheetApp.getUi().alert("Viber Hook failed!");
}

function onEdit(e) {
  //examples of "e"
  //  - delete one row: e.range: {"columnEnd":25,"columnStart":24,"rowEnd":1,"rowStart":1}
  //  - insert row: e.range: {"columnEnd":9,"columnStart":1,"rowEnd":142,"rowStart":142}
  
  if (e.range.rowStart == 1) return;
  
  var sh = e.source.getActiveSheet();
  
  if (sh.getName() == _c.sheets.inTx.name) {
    if (e.range.columnStart == e.range.columnEnd) {
      // FIXME problem when we insert two, three or more values
      _sheets.fillRowWithDataFromSourceRow(sh, {sourceRowNo: 2, 
                                                targetRowNo: e.range.rowStart, 
                                                fillDateColNo: 2, 
                                                skipRowIfColNo: 2, 
                                                preserveValueOfColNo: e.range.columnStart});
    }
  }
}

//this is a function that fires when the webapp receives a GET request
function doGet(e) {
  Logger.log('Test log entry %s', new Date());
  
  _viber.sendReplyToViberBotUser("PdgwHKTsLhIbckLsAvXHyQ==", "Кохаю мою \uD83E\uDD8C !!! \uD83D\uDE1A \uD83C\uDF6D \uD83C\uDF6C \uD83C\uDF6B \uD83D\uDE1A \uD83C\uDF6D \uD83C\uDF6C \uD83C\uDF6B \uD83D\uDE1A \uD83C\uDF6D \uD83C\uDF6C \uD83C\uDF6B \uD83D\uDE1A \uD83C\uDF6D \uD83C\uDF6C \uD83C\uDF6B \uD83D\uDE1A \uD83C\uDF6D \uD83C\uDF6C \uD83C\uDF6B \uD83D\uDE1A \uD83C\uDF6D \uD83C\uDF6C \uD83C\uDF6B \uD83D\uDE1A \uD83C\uDF6D \uD83C\uDF6C \uD83C\uDF6B \uD83D\uDE1A \uD83C\uDF6D \uD83C\uDF6C \uD83C\uDF6B \uD83D\uDE1A \uD83C\uDF6D \uD83C\uDF6C \uD83C\uDF6B \uD83D\uDE1A \uD83C\uDF6D \uD83C\uDF6C \uD83C\uDF6B", "Твій ботище");
  
  return HtmlService.createHtmlOutput("request received");
}

//this is a function that fires when the webapp receives a POST request
function doPost(e) {
  if (e.parameter.source === "mono") {
    return doPostMono(e);
  } else if (e.parameter.source === "viber") {
    return doPostViber(e);
  } else if (e.parameter.source === "ifttt") {
    return doPostIfttt(e);
  } else {
    var status = "G-ERR"; // General Error
    _sheets.recordInTxRow({status: status}, e.postData.contents);
    return HtmlService.createHtmlOutput("shit happens, set source attribute to make me happy");
  }
}

function doPostMono(e) {
  var jsonObjStr = e.postData.contents;
  processMonoMessage(jsonObjStr);
  return HtmlService.createHtmlOutput("mono post request received");
}

function doPostViber(e) {
  var jsonObjStr = e.postData.contents;
  doProcessViberMessage(jsonObjStr);
  
  var statusMessage = "viber post request received: " + e.parameter.source;
  return HtmlService.createHtmlOutput(statusMessage);
}

function doPostIfttt(e) {
  var jsonObjStr = e.postData.contents;
  var jsonObj = JSON.parse(jsonObjStr);
  if (jsonObj) {
    var status = "I-TST"; // Ifttt Testing
    _sheets.recordInTxRow({status: status}, e.postData.contents);
    _ifttt.handleSmsReceived(jsonObj.message);
  } else {
    var status = "I-ERR"; // Ifttt Error
    _sheets.recordInTxRow({status: status}, e.postData.contents);
  }
  return HtmlService.createHtmlOutput("this is message from ifttt (sms received)");
}
