function processMonoMessage(jsonObjStr) {
  var jsonObj = JSON.parse(jsonObjStr);
  var statementId = jsonObj && jsonObj.data && jsonObj.data.statementItem ? jsonObj.data.statementItem.id : null;
  
  // check if cache contains this message already
  if (util.gas.checkIfTokenRepeats(statementId, "Mono-tx-statementId-")) {
    console.warn("Duplicate mono tx received: " + statementId);
    return;
  }
  
  var monoTxRowNo = _sheets.recordMonoTx(jsonObjStr, statementId);
  
  processMonoMessageAsyncHandler(monoTxRowNo, jsonObj, jsonObjStr);
  
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
      if (statementItem.amount > 0
          && statementItem.mcc === _c.mono.topUpFromKredo.mcc
          && statementItem.description === _c.mono.topUpFromKredo.description) {
        registerKredoBlackKredit = true;
        rowObj.expType = _c.expTypes.none; // цей пеймент це поповнення з кредо картки - не враховуємо в витрати це
        //rowObj.registered = "y";
        rowObj.myComment = "поповнення з Кредобанківської картки";
      }
      if (statementItem.amount < 0
          && statementItem.mcc === _c.mono.autoRounding.mcc
          && statementItem.description === _c.mono.autoRounding.description) {
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
  if (!skipRecord) { rowNo = _sheets.recordInTxRow(rowObj, jsonObjStr); }
  
  _sheets.setMonoTxStatus(monoTxRowNo,"STEP1");
  
  if (c_AccMonoWhite === data.account && rowObj.monoBalance) {
    _sheets.recordBalance(rowObj.monoBalance, _c.sheets.nr.balance.monoWhite);
  }
  if (c_AccMonoBlack === data.account && rowObj.monoBalance) {
    _sheets.recordBalance(rowObj.monoBalance, _c.sheets.nr.balance.monoBlack);
  }
  
  _sheets.setMonoTxStatus(monoTxRowNo,"STEP2");
  
  if (registerKredoBlackKredit) {
    var amountF = rowNo > 2 ? ("-" + _c.sheets.inTx.name + "!" + _c.sheets.inTx.amountCol + rowNo) : -rowObj.amount;
    _sheets.modifyBalanceV2(amountF, _c.sheets.nr.balance.kredoBlack);
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
