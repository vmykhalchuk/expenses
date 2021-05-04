// 
// THIS IS A TEST VERSION!!!
//

function sheetsStartNextWeek() {
  var weekStartTime = new Date();
  var ss = SpreadsheetApp.getActive();
  var sheet = ss.getSheetByName(_c.sheets.data.name);
  var v = sheet.getRange("B10").getValue();
  var f = sheet.getRange("B10").getFormula();
  var dv = sheet.getRange("B10").getDisplayValue();
  sheet.getRange("TestRange").setValue(Math.round(v*10000) / 10000);
}

function recordInTxRow(rowObj /*status, txDate, amount, monoMcc, description, comment, txType, expType, registered, myComment*/, 
                       jsonObjStr, skipFlush) {
  if (!rowObj) return -1;
  
  var ss = SpreadsheetApp.getActive();
  var sheet = ss.getSheetByName(_c.sheets.inTx.name);
  
  var rowNo = duplicateSecondRowToBottom();
  
  var _c_inTx = _c.sheets.inTx;
  
  if (rowObj.status) sheet.getRange(_c_inTx.statusCol + rowNo).setValue(rowObj.status);
  sheet.getRange(_c_inTx.dateCol + rowNo).setValue(new Date());
  
  if (rowObj.txDate) sheet.getRange(_c_inTx.txDateCol + rowNo).setValue(rowObj.txDate);
  if (rowObj.amount || rowObj.amountFormula) {
    if (rowObj.amountFormula) {
      sheet.getRange(_c_inTx.amountCol + "" + rowNo).setFormula(rowObj.amountFormula);
    } else {
      sheet.getRange(_c_inTx.amountCol + "" + rowNo).setValue(rowObj.amount);
    }
  }
  if (rowObj.monoMcc) sheet.getRange(_c_inTx.monoMccCol + rowNo).setValue(rowObj.monoMcc);
  if (rowObj.description) sheet.getRange(_c_inTx.monoDescriptionCol + rowNo).setValue(rowObj.description);
  if (rowObj.comment) sheet.getRange(_c_inTx.monoCommentCol + rowNo).setValue(rowObj.comment);
  if (rowObj.txType) sheet.getRange(_c_inTx.txTypeCol + rowNo).setValue(rowObj.txType);
  if (rowObj.expType) sheet.getRange(_c_inTx.expenseTypeCol + rowNo).setValue(rowObj.expType);
  if (rowObj.registered) sheet.getRange(_c_inTx.registeredFlagCol + rowNo).setValue(rowObj.registered);
  if (rowObj.myComment) sheet.getRange(_c_inTx.myCommentCol + rowNo).setValue(rowObj.myComment);
  
  if (jsonObjStr) {
    var obfuscatedStr = ("" + jsonObjStr).replace(/\r?\n|\r/g,"").replace(/\"/g,"'");
    var jsonObjStrFormula = '=IF("' + obfuscatedStr + '"="","","")';
    sheet.getRange(_c_inTx.incomingPostDataCol + rowNo).setFormula(jsonObjStrFormula);
  }
  if (!skipFlush) SpreadsheetApp.flush();
  return rowNo;
}

function duplicateSecondRowToBottom() {
  var ss = SpreadsheetApp.getActive();
  var sheet = ss.getSheetByName(_c.sheets.inTx.name);
  
  var lastColumnIndx = sheet.getLastColumn();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return -1;
  }
  
  var sourceRange = sheet.getRange(2, 1, 1, lastColumnIndx);
  sheet.insertRowAfter(lastRow);
  
  sourceRange.copyTo(sheet.getRange(lastRow + 1, 1, 1, lastColumnIndx), {contentsOnly:false});
  
  return lastRow + 1;
}


function recordBalance(balance, namedRangeName, skipFlush) {
  var ss = SpreadsheetApp.getActive();
  var range = ss.getRangeByName(namedRangeName);
  range.setValue(balance);
  if (!skipFlush) SpreadsheetApp.flush();
}

function modifyBalanceV2(balanceDelta, namedRangeName, skipFlush) {
  var ss = SpreadsheetApp.getActive();
  var range = ss.getRangeByName(namedRangeName);
  
  var prevFormula = range.getFormula();
  if (prevFormula == "") {
    prevFormula = "=(" + range.getValue() + ")";
  }
  range.setFormula(prevFormula + "+(" + balanceDelta + ")");
  if (!skipFlush) SpreadsheetApp.flush();
}

function getDataStatus() {
  var ss = SpreadsheetApp.getActive();
  var sheet = ss.getSheetByName(_c.sheets.data.name);
  
  var dataStatus = {
    kycja: sheet.getRange(_c.sheets.nr.status.kycjaAccountAvailable).getDisplayValue(),
    wallet: sheet.getRange(_c.sheets.nr.balance.wallet).getDisplayValue(),
    weekly: sheet.getRange(_c.sheets.nr.status.weeklyBalance).getDisplayValue(),
    weekly2: sheet.getRange(_c.sheets.nr.status.weeklyBalance2).getDisplayValue(),
    noExpTypeDefinedCount: sheet.getRange(_c.sheets.nr.status.noExpTypeDefined).getDisplayValue(),
    kredoDebt: sheet.getRange(_c.sheets.nr.status.kredoDebt).getDisplayValue(),
    monoBlackBalance: sheet.getRange(_c.sheets.nr.balance.monoBlack).getDisplayValue(),
    kredoBlackBalance: sheet.getRange(_c.sheets.nr.balance.kredoBlack).getDisplayValue()
  };
  
  return dataStatus;
}

var _sheets = {
  getInTxLastNRows: function(rowsN, filterFunction) {
    var timeLimitThreshold = 90*1000;
    var chunkSize = 20;
    
    var startTime = new Date().getTime();
    if (rowsN < 1) rowsN = 1;
    if (rowsN > 500) rowsN = 500;
    
    var ss = SpreadsheetApp.getActive();
    var sheet = ss.getSheetByName(_c.sheets.inTx.name);
    var _c_inTx = _c.sheets.inTx;
    var dateColNo = util.sheets.letterToColumn(_c_inTx.dateCol) - 1;
    var txDateColNo = util.sheets.letterToColumn(_c_inTx.txDateCol) - 1;
    var amountColNo = util.sheets.letterToColumn(_c_inTx.amountCol) - 1;
    var monoDescriptionColNo = util.sheets.letterToColumn(_c_inTx.monoDescriptionCol) - 1;
    var monoCommentColNo = util.sheets.letterToColumn(_c_inTx.monoCommentCol) - 1;
    var myCommentColNo = util.sheets.letterToColumn(_c_inTx.myCommentCol) - 1;
    var txTypeColNo = util.sheets.letterToColumn(_c_inTx.txTypeCol) - 1;
    var expenseTypeColNo = util.sheets.letterToColumn(_c_inTx.expenseTypeCol) - 1;
    
    
    var resultRows = new Array();
    var timedOut = false;
    var goingThroughArchiving = false;
    
    while (true) {
      var rowTo = sheet.getLastRow();
      var lastColumnIndx = sheet.getLastColumn();
      
      while (rowTo >= 3 && !timedOut) {
        var rowFrom = rowTo - chunkSize + 1;
        rowFrom = rowFrom >= 3 ? rowFrom : 3;
        
        var sourceRange = sheet.getRange(rowFrom, 1, rowTo - rowFrom + 1, lastColumnIndx);
        var displayValues = sourceRange.getDisplayValues().reverse();
        var values = sourceRange.getValues().reverse();
        for (var i = 0; i < displayValues.length; i++) {
          var fullDescription = util.sheets.calculateFullDescription(displayValues[i][monoDescriptionColNo],
                                                                     displayValues[i][monoCommentColNo], displayValues[i][myCommentColNo]);
          var row = {
            inTxRowNo: rowTo - i,
            txDate: values[i][txDateColNo] == "" ? values[i][dateColNo] : values[i][txDateColNo],
            amount: displayValues[i][amountColNo],
            fullDescription: fullDescription,
            txType: displayValues[i][txTypeColNo],
            expType: displayValues[i][expenseTypeColNo]
          };
          if (filterFunction && !filterFunction(row)) {
            continue;
          }
          resultRows.push(row);
          if (resultRows.length == rowsN) break;
        }
        
        timedOut = (new Date().getTime() - startTime) > timeLimitThreshold;
        rowTo = rowFrom - 1;
        if (resultRows.length == rowsN) break;
      }
      
      var finished = timedOut || resultRows.length == rowsN;
      
      if (finished || goingThroughArchiving) {
        break;
      } else {
        sheet = ss.getSheetByName(_c.sheets.archTx.name);
        goingThroughArchiving = true;
      }
      
    }
    
    return { rows: resultRows, timedOut: timedOut };
  },
  
  modifyRecord: function(rowNo, newExpType, newMyComment) {
    var ss = SpreadsheetApp.getActive();
    var sheet = ss.getSheetByName(_c.sheets.inTx.name);
    if (!rowNo || isNaN(rowNo) || rowNo < 3 || rowNo > sheet.getLastRow()) {
      throw "Wrong rowNo: " + rowNo;
    }
    var expTypeRange = sheet.getRange(_c.sheets.inTx.expenseTypeCol + rowNo);
    this.updateSingleCellWithNewValueAndKeepOldValue(expTypeRange, newExpType, true);
    var myCommentRange = sheet.getRange(_c.sheets.inTx.myCommentCol + rowNo);
    this.updateSingleCellWithNewValueAndKeepOldValue(myCommentRange, newMyComment, true);
  },
  
  modifyRecordAmount: function(rowNo, newAmount) {
    var ss = SpreadsheetApp.getActive();
    var sheet = ss.getSheetByName(_c.sheets.inTx.name);
    if (!rowNo || isNaN(rowNo) || rowNo < 3 || rowNo > sheet.getLastRow()) {
      throw "Wrong rowNo: " + rowNo;
    }
    var amountRange = sheet.getRange(_c.sheets.inTx.amountCol + rowNo);
    this.updateSingleCellWithNewValueAndKeepOldValue(amountRange, newAmount, false);
  },
  
  markRecordAsDuplicated: function(rowNo) {
    var ss = SpreadsheetApp.getActive();
    var sheet = ss.getSheetByName(_c.sheets.inTx.name);
    var expTypeRange = sheet.getRange(_c.sheets.inTx.expenseTypeCol + rowNo);
    this.updateSingleCellWithNewValueAndKeepOldValue(expTypeRange, _c.expTypes.other, true);
    var myCommentRange = sheet.getRange(_c.sheets.inTx.myCommentCol + rowNo);
    this.updateSingleCellWithNewValueAndKeepOldValue(myCommentRange, "tx duplicated", true);
    var amountRange = sheet.getRange(_c.sheets.inTx.amountCol + rowNo);
    this.updateSingleCellWithNewValueAndKeepOldValue(amountRange, 0, false);
  },
  
  splitRecordIntoMany: function(rowNo, splitCount, newMyComment) {
    var ss = SpreadsheetApp.getActive();
    var sheet = ss.getSheetByName(_c.sheets.inTx.name);
    var _c_inTx = _c.sheets.inTx;
    if (!rowNo || isNaN(rowNo) || rowNo < 3 || rowNo > sheet.getLastRow()) {
      throw "Wrong rowNo: " + rowNo;
    }
    if (!splitCount || isNaN(splitCount) || splitCount < 2 || splitCount > 4) {
      throw "Wrong split count: " + splitCount + ", should be between 2 and 4";
    }
    var expTypeRange = sheet.getRange(_c_inTx.expenseTypeCol + rowNo);
    var origExpTypeVal = expTypeRange.getValue(); // use it as last record expType
    if (origExpTypeVal == _c.expTypes.split2 
        || origExpTypeVal == _c.expTypes.split3
        || origExpTypeVal == _c.expTypes.split4) {
      throw "This record is split already!!!";
    }
    
    sheet.insertRowsAfter(rowNo, splitCount);
    var sourceRange = sheet.getRange(2, 1, 1, sheet.getLastColumn());
    sourceRange.copyTo(sheet.getRange(rowNo + 1, 1, splitCount, sheet.getLastColumn()), {contentsOnly:false});
    
    var newExpTypeVal;
    if (splitCount == 2) newExpTypeVal = _c.expTypes.split2;
    if (splitCount == 3) newExpTypeVal = _c.expTypes.split3;
    if (splitCount == 4) newExpTypeVal = _c.expTypes.split4;
    this.updateSingleCellWithNewValueAndKeepOldValue(expTypeRange, newExpTypeVal, true);
    var myCommentRange = sheet.getRange(_c_inTx.myCommentCol + rowNo);
    this.updateSingleCellWithNewValueAndKeepOldValue(myCommentRange, newMyComment, true);
    
    if (origExpTypeVal != "") {
      var lastRecordExpTypeRange = sheet.getRange(_c_inTx.expenseTypeCol + (rowNo + splitCount));
      this.updateSingleCellWithNewValueAndKeepOldValue(lastRecordExpTypeRange, origExpTypeVal, true);
    }
    
    var amountRange = sheet.getRange(_c_inTx.amountCol + (rowNo + splitCount));
    var amountPref = "$" + _c_inTx.amountCol + "$";
    var amountFormula = (amountPref + rowNo);
    for (var i = 1; i < splitCount; i++) {
      amountFormula += "-" + (amountPref + (rowNo + i));
    }
    // e.g. amountFormula = "$D$23-$D$24-$D$25" for rowNo 23 and splitCount 3
    amountRange.setFormula(amountFormula);
    
    for (var i = 1; i <= splitCount; i++) {
      var range = sheet.getRange(_c_inTx.dateCol + (rowNo + i));
      range.setValue(new Date());
    }
    
    for (var i = 1; i <= splitCount; i++) {
      var range = sheet.getRange(_c_inTx.txDateCol + (rowNo + i));
      var formula = "$" + _c_inTx.txDateCol + "$" + rowNo;
      range.setFormula(formula);
    }
    
    for (var i = 1; i <= splitCount; i++) {
      var range = sheet.getRange(_c_inTx.txTypeCol + (rowNo + i));
      var formula = "$" + _c_inTx.txTypeCol + "$" + rowNo;
      range.setFormula(formula);
    }
  },
  
  updateSingleCellWithNewValueAndKeepOldValue: function(cellRange, newValue, isTextValue) {
    var formula = cellRange.getFormula();
    if (formula && formula !== "") {
      if (isTextValue) {
        newValue = "\"" + newValue + "\"";
      }
      var newFormula = "=IF(true," + newValue + ",(" + formula.substring(1) + "))";
      cellRange.setFormula(newFormula);
    } else {
      var value = cellRange.getValue();
      if (value && value !== "") {
        if (isTextValue) {
          value = "\"" + value + "\"";
          newValue = "\"" + newValue + "\"";
        }
        cellRange.setFormula("=IF(true," + newValue + ",(" + value + "))");
      } else {
        cellRange.setValue(newValue);
      }
    }
  },
  
  /*
  sheet - to modify
  data - object with config parameters:
  - sourceRowNo - row to copy From
  - targetRowNo - row to copy To
  - fillDateColNo - Column No to fill with current date, 0 or undefined to disable
  - skipRowIfColNo - If this column has value, then skip this row. 0 to disable this functionality
  */
  fillRowWithDataFromSourceRow: function(sheet, data) {
    var sourceRowNo = data.sourceRowNo;
    var targetRowNo = data.targetRowNo;
    var fillDateColNo = data.fillDateColNo;
    var skipRowIfColNo = data.skipRowIfColNo;
    var preserveValueOfColNo = data.preserveValueOfColNo;
    
    if (sourceRowNo >= targetRowNo) throw "sourceRowNo >= targetRowNo";
    if (sourceRowNo > sheet.getLastRow()) throw "sourceRowNo > LastRow";
    
    if (skipRowIfColNo && sheet.getRange(targetRowNo, skipRowIfColNo).getValue() != "")
    return;
    
    var lastColumnNo = sheet.getLastColumn();
    
    var useCode = "var2";
    if (useCode === "var1") {
      for (var i = 1; i <= lastColumnNo; i++) {
        var targetRange = sheet.getRange(targetRowNo, i);
        if (targetRange.getValue() == "") {
          if (i == fillDateColNo) {
            targetRange.setValue(new Date());
          } else {
            sheet.getRange(sourceRowNo, i).copyTo(targetRange);
          }
        }
      }
    } else if (useCode==="var2"){
      // This code fails by overwriting user-entered value, unless preserveValueOfColNo is specified
      // Bug2: still doesn't preserve value of last column :(
      var midColNo = lastColumnNo + 1;
      if (preserveValueOfColNo && (preserveValueOfColNo >= 1) && (preserveValueOfColNo < lastColumnNo) && (preserveValueOfColNo !== fillDateColNo)) {
        midColNo = preserveValueOfColNo;
      }
      //process left part
      if (midColNo > 1) {
        var targetRange = sheet.getRange(targetRowNo, 1, 1, midColNo - 1);
        sheet.getRange(sourceRowNo, 1, 1, midColNo - 1).copyTo(targetRange);
      }
      // process right part
      if (midColNo < lastColumnNo) {
        var targetRange = sheet.getRange(targetRowNo, midColNo + 1, 1, lastColumnNo - midColNo);
        sheet.getRange(sourceRowNo, midColNo + 1, 1, lastColumnNo - midColNo).copyTo(targetRange);
      }
      
      if (fillDateColNo && fillDateColNo > 0) {
        sheet.getRange(targetRowNo, fillDateColNo).setValue(new Date());
      }
    }
  },
  
  
  recordViberSender: function(senderId, senderName, jsonObjStr, skipFlush) {
    var ss = SpreadsheetApp.getActive();
    var sheet = ss.getSheetByName(_c.sheets.viber.name);
    if (sheet.getRange(2, 2).getValue() === "yes") {
      var lastRow = sheet.getLastRow();
      sheet.getRange(lastRow + 1, 2).setValue(senderId);
      sheet.getRange(lastRow + 1, 3).setValue(senderName);
      sheet.getRange(lastRow + 1, 4).setValue(jsonObjStr);
      if (!skipFlush) SpreadsheetApp.flush();
    }
  },
  
  searchForDuplicateMonoTx: function(statementId, skipRowNo) {
    var ss = SpreadsheetApp.getActive();
    var sheet = ss.getSheetByName(_c.sheets.mono.name);
    var lastRowNo = sheet.getLastRow();
    if (lastRowNo < 3) {
      return false;
    }
    var fromRowNo = lastRowNo - _c.perf.mono.goBackRowsToCheckStatementIdDuplicate;
    if (fromRowNo < 3) fromRowNo = 3;
    var values = sheet.getRange("" + _c.sheets.mono.statementIdCol + fromRowNo + ":" + _c.sheets.mono.statementIdCol + lastRowNo).getValues();
    for (var i = 0; i < values.length; i++) {
      if (skipRowNo && (skipRowNo == (fromRowNo+i))) {
        continue;
      }
      
      if (values[i][0] === statementId) {
        return true;
      }
    }
    return false;
  },
  
  recordMonoTx: function(jsonObjStr, statementId) {
    var ss = SpreadsheetApp.getActive();
    var sheet = ss.getSheetByName(_c.sheets.mono.name);
    var rowNo = sheet.getLastRow() + 1;
    sheet.getRange(_c.sheets.mono.statementIdCol + rowNo).setValue(statementId);
    sheet.getRange(_c.sheets.mono.transactionDataCol + rowNo).setValue(jsonObjStr);
    SpreadsheetApp.flush();
    return rowNo;
  },
  
  setMonoTxStatus: function(rowNo, status) {
    var ss = SpreadsheetApp.getActive();
    var sheet = ss.getSheetByName(_c.sheets.mono.name);
    sheet.getRange(_c.sheets.mono.statusCol + rowNo).setValue(status);
  }
  
};