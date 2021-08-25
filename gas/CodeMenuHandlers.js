function onMenuNavBottom() {
  var activeSheet = SpreadsheetApp.getActiveSheet();
  var lastRowNo = activeSheet.getLastRow();
  var maxRows = activeSheet.getMaxRows();
  var navToRowNo = lastRowNo == maxRows ? lastRowNo : lastRowNo + 1;
  var activeColNo = activeSheet.getActiveCell().getColumn();
  var range = activeSheet.getRange(navToRowNo, activeColNo);
  activeSheet.setActiveSelection(range);
}

function onMenuNavToReportingSpreadsheet() {
  var reportingSpreadsheetUrl = "https://docs.google.com/spreadsheets/d/1sbE2aPq8cySn7WxuU_ESgwx4qKsj_VSBQr-hfu6p06s/edit";
  util.misc.openUrl(reportingSpreadsheetUrl);
}

function onMenuNavToReportingHouseSpreadsheet() {
  var reportingHouseSpreadsheetUrl = "https://docs.google.com/spreadsheets/d/1LLrYroVBsMYfL0UobvxYvtUAQR4UqioqV0CmuX-jG1U/edit";
  util.misc.openUrl(reportingHouseSpreadsheetUrl);
}

function onMenuNavToReportingDevTestSpreadsheet() {
  var reportingSsUrl = _reporting.getReportingSpreadsheetUrl();
  util.misc.openUrl(reportingSsUrl);
}

function onMenuNavToReportingPinkCloudSpreadsheet() {
  var reportingSsUrl = _reporting.getReportingPinkCloudSpreadsheetUrl();
  util.misc.openUrl(reportingSsUrl);
}

function onMenuExecuteCommand() {
  var ui = SpreadsheetApp.getUi();
  var promptRes = ui.prompt("Enter command to execute:");
  var cmdToRun;
  if (promptRes.getSelectedButton() == ui.Button.OK) {
    cmdToRun = promptRes.getResponseText();
  }
  
  if (cmdToRun) {
    _commandEngine.executeCommand(cmdToRun, null, (text, senderName, messageTrackingData) => ui.alert(senderName, text, ui.ButtonSet.OK));
  }
}

function onMenuRegisterMonoBankHook() {
  
  var ui = SpreadsheetApp.getUi();
  
  if (!util.gas.checkWebAppState()) {
    ui.alert(_codeConst.registerWebAppAlertMsg);
    return;
  }
  
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
    
    if (false) {//FIXME this now doesn't work
      ScriptApp.newTrigger("onTrigger4MonoBankWebHookRefresh").timeBased().everyMinutes(30).create();
      
      onTrigger4MonoBankWebHookRefresh(); // register now - to avoid waiting for 30min
    } else {
      // FIXME define URL if changes (when new deplyment):
      // Move this URL to config or better to cache - and set it via Menu
      var gasUrl = "https://script.google.com/macros/s/AKfycbwrckqk8BqS5ah_PUqzn9nttYTAZcwu7RJknesXyRxp5K-ELkk/exec";
      _mono.registerWebHook(gasUrl);
    }
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
    
    if (false) {//FIXME this now doesn't work
      ScriptApp.newTrigger("onTrigger4ViberWebHookRefresh").timeBased().everyMinutes(30).create();
      
      onTrigger4ViberWebHookRefresh(); // register now - to avoid waiting for 30min
    } else {
      // FIXME define URL if changes (when new deplyment):
      // Move this URL to config or better to cache - and set it via Menu
      var gasUrl = "https://script.google.com/macros/s/AKfycbwrckqk8BqS5ah_PUqzn9nttYTAZcwu7RJknesXyRxp5K-ELkk/exec";
      _viber.registerWebHook(gasUrl);
    }
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

function onMenuInitializeReportingSpreadsheet() {
  var ui = SpreadsheetApp.getUi();
  if (_reporting.getReportingSpreadsheetUrl()) {
    var res = ui.alert("⚠️Reporting Spreadsheet already exists!\n⚠️Remove it and continue?", ui.ButtonSet.YES_NO);
    
    if (res/*.getSelectedButton()*/ === ui.Button.YES) {
      _reporting.deleteReportingSpreadsheet();
    } else {
      return;
    }
  }
  _reporting.initializeReportingSpreadsheet();
  ui.alert("Done!");
}

function onMenuInitializeReportingPinkCloudSpreadsheet() {
  var ui = SpreadsheetApp.getUi();
  if (_reporting.getReportingPinkCloudSpreadsheetUrl()) {
    var res = ui.alert("⚠️Reporting Pink⛅ Spreadsheet already exists!\n⚠️Remove it and continue?", ui.ButtonSet.YES_NO);
    
    if (res === ui.Button.YES) {
      _reporting.deleteReportingPinkCloudSpreadsheet();
    } else {
      return;
    }
  }
  _reporting.initializeReportingPinkCloudSpreadsheet();
  ui.alert("Done!");
}

function onMenuHelp() {
  var htmlOutput = HtmlService
  .createHtmlOutput('<h3>Viber ChatBot Token</h3>' +
                    'Can be found by visiting your Bot\'s page, or creating new one here: ' +
                    '<a href="https://partners.viber.com/account/create-bot-account" target="_blank">Create Viber Bot</a>' +
                    '<h3>MonoBank API Token</h3>' +
                    'Can be found on the MonoBank API personal page here: ' +
                    '<a href="https://api.monobank.ua/" target="_blank">MonoBank API</a>');
  //.setWidth(800) //optional
  //.setHeight(500); //optional
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Z Help 💡');
}

function onMenuDevTest() {
  //SpreadsheetApp.getActiveSpreadsheet().toast('Task started', 'Status', -1);
  var ui = SpreadsheetApp.getUi();
  ui.alert("" + Object.keys(util.viber.getUserFriendlyMapOfExpenseTypes()).join(", "));
}

function onMenuDevCleanCacheEntry() {
  var ui = SpreadsheetApp.getUi();
  var response = ui.prompt("Enter Cache Entry Key, or all:\n   e.g. " + _c.caches);
  if (response.getSelectedButton() == ui.Button.OK) {
    var key = response.getResponseText();
    if (key === "all") {
      for (var k in _c.caches) {
        util.comm.removeCacheEntry(_c.caches[k]);
      }
    } else {
      util.comm.removeCacheEntry(key);
    }
  }
}
