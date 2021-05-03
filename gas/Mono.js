// 
// THIS IS A TEST VERSION!!!
//

function processMonoMessage(jsonObjStr) {
  var jsonObj = JSON.parse(jsonObjStr);
  var statementId = jsonObj && jsonObj.data && jsonObj.data.statementItem ? jsonObj.data.statementItem.id : null;
  
  var monoTxRowNo = _sheets.recordMonoTx(jsonObjStr, statementId);
  
  var isDuplicate = true;
  var acquired = multiPropertiesLock.waitLock("MonoLock", 30*1000, 15*60*1000); // wait for 30sec, max lock age is 15min - longer then this will be bad
  try {
    if (!acquired) {
      console.error("Couldn't acquire MonoLock!");
    }
    isDuplicate = _sheets.searchForDuplicateMonoTx(statementId, monoTxRowNo);
  } finally {
    if (acquired) {
      multiPropertiesLock.releaseLock("MonoLock");
    }
  }
  if (!isDuplicate) {
    processMonoMessageAsyncHandler(monoTxRowNo, jsonObj, jsonObjStr);
  }
  
  //Async.call("processMonoMessageAsyncHandler", monoTxRowNo, jsonObj, jsonObjStr);
  //_sheets.setMonoTxStatus(monoTxRowNo,"SCHEDULED");
}

function processMonoMessageAsyncHandler(monoTxRowNo, jsonObj, jsonObjStr) {
  var c_AccMonoWhite = _c.mono.whiteCardAccId;
  var c_AccMonoBlack = _c.mono.blackCardAccId;
  
  var status = "N";
  var data = jsonObj.data;
  var statementItem;
  if (jsonObj.type === "StatementItem" && data && (data.account === c_AccMonoWhite || data.account === c_AccMonoBlack)) {
    status = "M-OK";
    statementItem = data.statementItem;
  } else {
    status = "M-ERR";
  }
  
  var registerKredoBlackKredit = false;
  var rowObj = {
    status: status
  }
  var skipRecord = false;
  if (statementItem) {
    if (c_AccMonoWhite === data.account) {
      rowObj.txType = _c.txTypes.monoWhite;
      if (statementItem.mcc === 4829 && statementItem.amount > 0 && statementItem.description === "Від: Кредо #2") {
        registerKredoBlackKredit = true;
        rowObj.expType = _c.expTypes.none; // цей пеймент це поповнення з кредо картки - не враховуємо в витрати це
        //rowObj.registered = "y";
        rowObj.myComment = "поповнення з Кредобанківської картки";
      }
      if (statementItem.mcc === 4829 && statementItem.amount < 0 && statementItem.description === "На ремонт хонди") {
        // не реєструємо ці відрахування взагалі
        skipRecord = true;
        //rowObj.expType = _c.expTypes.none; // цей пеймент це відрахування в банку - не враховуємо в витрати це
        //rowObj.registered = "y";
        //rowObj.myComment = "відрахування в Баночку";
      }
    } else if (c_AccMonoBlack === data.account) {
      rowObj.txType = _c.txTypes.monoBlack;
      rowObj.expType = _c.expTypes.none; // транзакції на чорній картці помічаємо як none
      //rowObj.registered = "y";
      rowObj.myComment = "Чорна моно картка - поки ігноримо";
    }
    rowObj.txDate = new Date(statementItem.time * 1000);
    rowObj.amount = statementItem.amount / 100;
    rowObj.monoMcc = statementItem.mcc;
    rowObj.monoBalance = statementItem.balance / 100;
    rowObj.description = statementItem.description;
    rowObj.comment = statementItem.comment;
  }
  
  var rowNo = -1;
  if (!skipRecord) { rowNo = recordInTxRow(rowObj, jsonObjStr); }
  
  _sheets.setMonoTxStatus(monoTxRowNo,"STEP1");
  
  if (c_AccMonoWhite === data.account && rowObj.monoBalance) {
    recordBalance(rowObj.monoBalance, "Mono_white_balance");
  }
  if (c_AccMonoBlack === data.account && rowObj.monoBalance) {
    recordBalance(rowObj.monoBalance, "Mono_black_balance");
  }
  
  _sheets.setMonoTxStatus(monoTxRowNo,"STEP2");
  
  if (registerKredoBlackKredit) {
    var amountF = rowNo > 2 ? ("-" + _c.sheets.inTx.name + "!" + _c.sheets.inTx.amountCol + rowNo) : -rowObj.amount;
    modifyBalanceV2(amountF, _c.sheets.nr.balance.kredoBlack);
  }
  
  _sheets.setMonoTxStatus(monoTxRowNo,"DONE");
}

var _mono = {
  
  authToken: null,
  getAuthToken: function() {
    if (!this.authToken) {
      this.authToken = PropertiesService.getScriptProperties().getProperty("MonoBank-Auth-Token");
      if (!this.authToken || this.authToken == "") throw "⛔️ No MonoBank Auth Token defined! Go to \"Z > Register MonoBank Hook\" section to register it!";
    }
    
    return this.authToken;
  },
  
  registerWebHook: function(gasWebAppUrl) {
    authToken = this.getAuthToken();
    gasWebAppUrl = gasWebAppUrl ? ("" + gasWebAppUrl) : "";
    if (gasWebAppUrl.indexOf("?") == -1) {
      gasWebAppUrl += "?";
    } else {
      gasWebAppUrl += "&";
    }
    gasWebAppUrl += "source=mono";
    
    var data = {
      "webHookUrl": gasWebAppUrl
    };
    var options = {
      "method": "post",
      "headers": {
        "X-Token": authToken
      },
      "contentType": "application/json",
      "payload": JSON.stringify(data)
    };
    var response = UrlFetchApp.fetch("https://api.monobank.ua/personal/webhook", options);
    // TODO add validation of response code, to know if succeeded
    return response;
  }
  
}
