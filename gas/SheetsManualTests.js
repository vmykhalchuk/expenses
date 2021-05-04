function runManualSheetsTest() {
  //__manualTestsSuitSheets.getInTxLastNRows();
  //_sheets.updateSingleCellWithNewValueAndKeepOldValue(SpreadsheetApp.getActive().getRange("SheetRoman!A1"), "thats complicated", true);
  var res = _sheets.searchForDuplicateMonoTx("test01", 201);
  console.log("res: " + res);
  res = _sheets.searchForDuplicateMonoTx("test01");
  console.log("res: " + res);
}

var __manualTestsSuitSheets = {
  recordViberSender: function() {
    _sheets.recordViberSender("sender-007", "Bond", { postData: {contents: "fig vam"}})
  },
  
  modifyBalanceV2: function() {
    modifyBalanceV2(-300, "TestRange");
  },
  
  fillRowWithDataFromSourceRow_insertAtTheEndOfInTxSheet: function() {
    var ss = SpreadsheetApp.getActive();
    var sheet = ss.getSheetByName(_c.sheets.inTx.name);
    _sheets.fillRowWithDataFromSourceRow(sheet, {sourceRowNo: 2, targetRowNo: sheet.getLastRow() + 1, 
                                                 fillDateColNo: 2, skipRowIfColNo: 2,
                                                 preserveValueOfColNo: null});
  },
  
  getInTxLastNRows: function() {
    var r = _sheets.getInTxLastNRows(3);
    var z = r.length;
  },
  
  formattingOfDate: function() {
    var ss = SpreadsheetApp.getActive();
    var range = ss.getRangeByName("TestRange");
    var value = range.getValue();
    var hh = value.getHours();
    var mm = value.getMinutes();
  }
};

