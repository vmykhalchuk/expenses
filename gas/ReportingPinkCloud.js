class ReportingPinkCloud extends Reporting {
  
  static get inst() {
    if (!this._instPC) {
      this._instPC = new this();
    }
    return this._instPC;
  }
  
  static get i() {
    return this.inst;
  }
  
  constructor() {
    super();
    this.propIdKey = "Reporting_ZPinkCloudReportingID";
    this.propUrlKey = "Reporting_ZPinkCloudReportingURL";
    this.cid = "B";
  }
  
  _getSpreadsheetFileName() {
    return "Y - 📊Reporting - Pink⛅";
  }
  
  _createAllSheets() {
    this._createDataIngestSheet();
    this._createAggregationSheet();
  }
  
  _createDataIngestSheet() {
    var diSheet = this.reportingSs.getActiveSheet();
    diSheet.setName("Data");
    var mainSsId = _sheets.getMainSsId();
    var aidTxValuesRange = _c.sheets.aidTx.name + "!A3:Q";
    var archTxValuesRange = _c.sheets.archTx.name + "!A3:Q";
    var inTxValuesRange = _c.sheets.inTx.name + "!A3:Q";
    
    var ingestFormula = '=QUERY({' +
      'IMPORTRANGE("' + mainSsId + '", "' + aidTxValuesRange + '"); ' +
        'IMPORTRANGE("' + mainSsId + '", "' + archTxValuesRange + '"); ' +
          'IMPORTRANGE("' + mainSsId + '", "' + inTxValuesRange + '")}, ' +
            "\"SELECT Col3, Col4, Col5, Col6, Col7, Col10, Col17, " +
              "Col8, Col9, Col14, year(Col3)*10000+(month(Col3)+1)*100+day(Col3) " +
                "WHERE Col3 > date '2011-11-17' AND Col11='house' " + 
                  "LABEL year(Col3)*10000+(month(Col3)+1)*100+day(Col3)'TxDate'\")";
    
    var headerColNames = [["TX Date", "Amount", "Currency","Exch\nRate", "Mono\nMCC",
                           "Tx Type", "House\nSub Type",
                           "Mono\nDescription", "Mono\nComment", "My Comment", "TxDate\n4Search"]];
    
    var firstRowRange = diSheet.getRange(1, 1, 1, headerColNames[0].length);
    firstRowRange.setValues(headerColNames);
    firstRowRange.setFontWeight("bold");
    firstRowRange.setBackground("lightgray");
    
    diSheet.getRange(2,1).setFormula(ingestFormula);
    diSheet.getRange(2,1).setBackground("lightgray");
    
    diSheet.hideRows(2);
    diSheet.setFrozenRows(2);
    diSheet.deleteColumns(diSheet.getLastColumn() + 1, diSheet.getMaxColumns() - diSheet.getLastColumn());
    
    SpreadsheetApp.flush();
    diSheet.autoResizeColumns(1, diSheet.getLastColumn());
    
    diSheet.protect().setWarningOnly(true);
  }
  
  _createAggregationSheet() {
    var aggSheet = this.reportingSs.insertSheet("🧮Aggregation", 0);
    
    this._createAggregationSheetData(aggSheet);
    this._createAggregationSheetNormalizedData(aggSheet);
    
    {
      var condFormatRules = aggSheet.getConditionalFormatRules();
      var rule = SpreadsheetApp.newConditionalFormatRule()
      .whenNumberEqualTo(0)
      .setFontColor("white")
      .setRanges([aggSheet.getRange("C2:H500")])
      .build();
      condFormatRules.push(rule);
      aggSheet.setConditionalFormatRules(condFormatRules)
    }
    
    SpreadsheetApp.flush();
    aggSheet.autoResizeColumns(1, aggSheet.getLastColumn());
    
    aggSheet.protect().setWarningOnly(true);
  }
  
  _createAggregationSheetData(aggSheet) {
    aggSheet.getRange("A1").setValue("Summary");
    aggSheet.getRange("D1").setValue("Equivalent UAH");
    aggSheet.getRange("A1:D1").setBackground("darkorange").setFontWeight("bold");
    
    var houseSubTypes = [''];
    houseSubTypes.push(... _sheets.getListOfHouseSubTypes());
    
    for (var i in houseSubTypes) {
      for (var j in _c.currenciesList) {
        var rowNo = 2 + i*3 + 1*j;
        aggSheet.getRange("A" + rowNo).setValue(houseSubTypes[i]).setFontWeight("bold");
        aggSheet.getRange("B" + rowNo).setValue(_c.currenciesList[j]).setFontWeight("bold");
        
        var equalToSubTypeStr = houseSubTypes[i] === '' ? '""' : ("A" + rowNo);
        
        var formula = "=ARRAYFORMULA(SUM(\n" +
          "IF('Data'!$G$3:$G=" + equalToSubTypeStr + ",\n" +
            "IF('Data'!$C$3:$C=B" + rowNo + ",\n" +
              "IF('Data'!$F$3:$F=\"" + _c.txTypes.monoWhite + "\",\n" +
                "IF('Data'!$B$3:$B<0,\n" +
                  "FLOOR('Data'!$B$3:$B),\n" +
                    "'Data'!$B$3:$B),\n" +
                      "'Data'!$B$3:$B\n" +
                        ")" +
                          ")" +
                            ")" +
                              "))";
        aggSheet.getRange("C" + rowNo).setFormula(formula).setNumberFormat(_c.currenciesFormats[j]);
        
        var normalizedToUahFormula = "=C" + rowNo;
        if (j > 0) {
          normalizedToUahFormula = "=ARRAYFORMULA(SUM(\n" +
            "IF('Data'!$G$3:$G=" + equalToSubTypeStr + ",\n" +
              "IF('Data'!$C$3:$C=B" + rowNo + ",\n" +
                "IF('Data'!$F$3:$F=\"" + _c.txTypes.monoWhite + "\",\n" +
                  "IF('Data'!$B$3:$B<0,\n" +
                    "FLOOR('Data'!$B$3:$B*'Data'!$D$3:$D),\n" +
                      "'Data'!$B$3:$B*'Data'!$D$3:$D),\n" +
                        "'Data'!$B$3:$B*'Data'!$D$3:$D)\n" +
                          ")\n" +
                            ")\n" +
                              "))";
        }
        aggSheet.getRange("D" + rowNo).setFormula(normalizedToUahFormula).setNumberFormat(_c.currenciesFormats[0]);
      }
    }
  }
  
  _createAggregationSheetNormalizedData(aggSheet) {
    aggSheet.getRange("G1").setValue("Normalized data, $");
    aggSheet.getRange("H1").setValue("$ exch rate:");
    aggSheet.getRange("I1").setFormula('=GOOGLEFINANCE("CURRENCY:USDUAH")');
    aggSheet.getRange("G1:I1").setBackground("darkcyan").setFontWeight("bold");
    
    var houseSubTypes = [''];
    houseSubTypes.push(... _sheets.getListOfHouseSubTypes());
    
    for (var i in houseSubTypes) {
      var rowNo = 2 + i*1;
      aggSheet.getRange("G" + rowNo).setValue(houseSubTypes[i]).setFontWeight("bold");
      
      var cellUah = "$C$" + (2 + i*3);
      var cellUsd = "$C$" + (2 + i*3 + 1);
      var cellEurUah = "$D$" + (2 + i*3 + 2);
      var formula = "= -( " + cellUah + " + " + cellEurUah + ") / $I1 - " + cellUsd;
      aggSheet.getRange("H" + rowNo).setFormula(formula).setNumberFormat(_c.currenciesFormats[1]);
      
      this.reportingSs.setNamedRange("EXP_USD_" + houseSubTypes[i].toUpperCase(), aggSheet.getRange("H" + rowNo));
    }
  }
}