// 
// THIS IS A TEST VERSION!!!
//
// This is ment to be modified wildly!!!

// README!!!
// Deploy via: Publish > Deploy as web app...
//    set "Who has access to the app:" to "Anyone, even anonymous"

var _codeConst = {
  registerWebAppAlertMsg: "⛔️ Deploy Script as Web App!\nGo to \"Tools > Script editor\", and in Script editor select \"Publish > Deploy as web app...\""
};

function onOpen() {
  SpreadsheetApp.getUi().createMenu("⚙️Z")
  .addItem("Register MonoBank Hook", "onMenuRegisterMonoBankHook")
  .addItem("Register Viber Hook", "onMenuRegisterViberHook")
  .addItem("Mono reg tx", "onMenuMonoRegisterManually")
  .addItem("Run Unit Tests 🛠️", "runUnitTestsInSpreadsheetApp")
  .addItem("Help", "onMenuHelp")
  .addItem("Test", "onMenuTest")
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
  
  /*// see https://cdnjs.com/libraries/moment.js  for more recent versions
  eval(UrlFetchApp.fetch('https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.29.1/moment.min.js').getContentText());
  var date = moment().format("MMM Do YY");
  Logger.log("success!!!");
  */
  
  //_viber.sendReplyToViberBotUser("PdgwHKTsLhIbckLsAvXHyQ==", "Кохаю мою \uD83E\uDD8C !!! \uD83D\uDE1A \uD83C\uDF6D \uD83C\uDF6C \uD83C\uDF6B \uD83D\uDE1A \uD83C\uDF6D \uD83C\uDF6C \uD83C\uDF6B \uD83D\uDE1A \uD83C\uDF6D \uD83C\uDF6C \uD83C\uDF6B \uD83D\uDE1A \uD83C\uDF6D \uD83C\uDF6C \uD83C\uDF6B \uD83D\uDE1A \uD83C\uDF6D \uD83C\uDF6C \uD83C\uDF6B \uD83D\uDE1A \uD83C\uDF6D \uD83C\uDF6C \uD83C\uDF6B \uD83D\uDE1A \uD83C\uDF6D \uD83C\uDF6C \uD83C\uDF6B \uD83D\uDE1A \uD83C\uDF6D \uD83C\uDF6C \uD83C\uDF6B \uD83D\uDE1A \uD83C\uDF6D \uD83C\uDF6C \uD83C\uDF6B \uD83D\uDE1A \uD83C\uDF6D \uD83C\uDF6C \uD83C\uDF6B", "Твій ботище");
  
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
    recordInTxRow({status: status}, e.postData.contents);
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
    recordInTxRow({status: status}, e.postData.contents);
    _ifttt.handleSmsReceived(jsonObj.message);
  } else {
    var status = "I-ERR"; // Ifttt Error
    recordInTxRow({status: status}, e.postData.contents);
  }
  return HtmlService.createHtmlOutput("this is message from ifttt (sms received)");
}

function onMenuMonoRegisterManually() {
  // manually register Mono Tx that missed by some reason
  var ui = SpreadsheetApp.getUi();
  var expenseAmount = ui.prompt("Enter amount");
  var expenseType = ui.prompt("Enter expense type");
  ui.alert("Amount: " + expenseAmount + "\nType: " + expenseType);
}

function onMenuRegisterMonoBankHook() {
  
  if (!util.gas.checkWebAppState()) {
    SpreadsheetApp.getUi().alert(_codeConst.registerWebAppAlertMsg);
    return;
  }
  
  var ui = SpreadsheetApp.getUi();
  var response = ui.prompt("Enter MonoBank API Token here.\nRead \"Z > Help\" for instructions where to get Token from.");
  var monobankToken;
  if (response.getSelectedButton() == ui.Button.OK) {
    monobankToken = response.getResponseText();
  }
  
  if (monobankToken) {
    PropertiesService.getScriptProperties().setProperty("MonoBank-Auth-Token", monobankToken);
    
    // delete trigger if exists
    var projectTriggers = ScriptApp.getProjectTriggers();
    for (var i in projectTriggers) {
      var trigger = projectTriggers[i];
      if (trigger.getHandlerFunction() == "onTrigger4MonoBankWebHookRefresh") {
        ScriptApp.deleteTrigger(trigger);
      }
    }
    
    ScriptApp.newTrigger("onTrigger4MonoBankWebHookRefresh").timeBased().everyMinutes(30).create();
    
    onTrigger4MonoBankWebHookRefresh(); // register now - to avoid waiting for 30min
  } else {
    ui.alert("⚠️Provide MonoBank API Token to set web hook!");
  }
}

function onMenuRegisterViberHook() {
  if (!util.gas.checkWebAppState()) {
    SpreadsheetApp.getUi().alert(_codeConst.registerWebAppAlertMsg);
    return;
  }
  
  var ui = SpreadsheetApp.getUi();
  var response = ui.prompt("Enter Viber ChatBot Token here.\nRead \"Z > Help\" for instructions where to get Token from.");
  var viberToken;
  if (response.getSelectedButton() == ui.Button.OK) {
    viberToken = response.getResponseText();
  }
  
  if (viberToken) {
    PropertiesService.getScriptProperties().setProperty("Viber-Auth-Token", viberToken);
    
    // delete trigger if exists
    var projectTriggers = ScriptApp.getProjectTriggers();
    for (var i in projectTriggers) {
      var trigger = projectTriggers[i];
      if (trigger.getHandlerFunction() == "onTrigger4ViberWebHookRefresh") {
        ScriptApp.deleteTrigger(trigger);
      }
    }
    
    ScriptApp.newTrigger("onTrigger4ViberWebHookRefresh").timeBased().everyMinutes(30).create();
    
    onTrigger4ViberWebHookRefresh(); // register now - to avoid waiting for 30min
  } else {
    ui.alert("⚠️Provide Viber Token to set web hook!");
  }
  
}

function onTrigger4MonoBankWebHookRefresh() {
  _mono.registerWebHook(util.gas.getWebAppDevUrlWithAccessToken());
}

function onTrigger4ViberWebHookRefresh() {
  _viber.registerWebHook(util.gas.getWebAppDevUrlWithAccessToken());
}

function onMenuHelp() {
  var htmlOutput = HtmlService
  .createHtmlOutput('<h3>Viber ChatBot Token</h3>' +
                    'Can be found by visiting your Bot\'s page, or creating new one here: ' +
                    '<a href="https://partners.viber.com/account/create-bot-account" target="_blank">Create Viber Bot</a>' +
                    '<h3>MonoBank API Token</h3>' +
                    'Can be found on the MonoBank API personal page here: ' +
                    '<a href="https://api.monobank.ua/" target="_blank">MonoBank API</a>')
  //.setWidth(800) //optional
  //.setHeight(500); //optional
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Z Help');
}

function onMenuTest() {
  //SpreadsheetApp.getActiveSpreadsheet().toast('Task started', 'Status', -1);
  var ui = SpreadsheetApp.getUi();
  ui.alert("Test!!!\n" + SpreadsheetApp.getActive().getRange("Data!A55").getValue());

  //ui.alert("isRange: " + (SpreadsheetApp.getActive().getRange("InTx!A1") == "Range"));
}