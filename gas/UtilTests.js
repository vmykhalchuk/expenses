var __testSuiteUtil = {
  
  checkUnderscoreLibrary: function() {
    //util.sys.initializeUnderscore();
    _i();
    assertTrue(_.isFunction(console.log));
    assertFalse(_.isFunction("not a function"));
    assertFalse(_.isFunction(null));
  },
  
  augmentExpType: function() {
    assertEquals("none", util.viber.augmentExpType("_none"));
    assertEquals("none", util.viber.augmentExpType("none"));
    assertEquals("Ⓦ", util.viber.augmentExpType("_week"));
  },
  
  testTimeToHappyDisplayTextWrongDate: function() {
    assertTrue(util.viber.timeToHappyDisplayText("wrong_date") == "E:wrong_date", "E:wrong_date");
    assertTrue(util.viber.timeToHappyDisplayText(null) == "E:null", "E:null");
    assertEquals("E:768765.789", util.viber.timeToHappyDisplayText(768765.789));
  },
  
  viberSplitToWords: function() {
    assertEquals(1, util.viber.splitToWords("word").length, "word");
    assertEquals(2, util.viber.splitToWords(" a  b").length, " a  b");
  },
  
  matchesWordPartially: function() {
    assertTrue(util.viber.matchesWordPartially("c", "cash"), "c");
    assertFalse(util.viber.matchesWordPartially("ce", "cash"), "ce");
    assertTrue(util.viber.matchesWordPartially("ca", "cash"), "ca");
    assertTrue(util.viber.matchesWordPartially("cash", "cash"), "cash");
    assertFalse(util.viber.matchesWordPartially("cashe", "cash"), "cashe");
  },
  
  parseRawExpenseType: function() {
    assertEquals("house", util.viber.parseRawExpenseType("house").expType);
    assertEquals("misc", util.viber.parseRawExpenseType("house:mi").subType);
    assertEquals("_none", util.viber.parseRawExpenseType("none").expType);
    assertEquals("_none", util.viber.parseRawExpenseType("no").expType);
    assertEquals("_other", util.viber.parseRawExpenseType("Other").expType);
    assertException(() => util.viber.parseRawExpenseType("ho:uuu"), "Wrong sub type: uuu");
  },
  
  testAssertTrue: function() {
    assertTrue(true, "Universe has reversed!!! Now True is False!???");
  },
  
  mock: {
    funcToTest: function(v1) {
      if (v1 === "failure") {
        throw "exception msg";
      }
    }
  },
  
  testAssertException: function() {
    var _thiz = this;
    var val = "failure";
    var f = function() {
      _thiz.mock.funcToTest(val);
    };
    assertException(f,null,"Dummy message here");
    val = "!failure";
    assertNoException(f,"Another Dummy message here");
  },
  
  testAssertException2: function() {
    var thiz = this;
    assertException(() => thiz.mock.funcToTest("failure"),"exception msg");
    assertNoException(() => thiz.mock.funcToTest(""));
  }
};

function romanTest() {
  var ss = SpreadsheetApp.getActive();
  var sheetRoman = ss.getSheetByName("SheetRoman");
  var z = Math.round(Math.random() * 4);
  
  
  if (z == 2) sheetRoman.getRange("G15:K18").setBackground("yellow");
  if (z == 3) sheetRoman.getRange("G15:K18").setBackground("red");
  if (z == 0) sheetRoman.getRange("G15:K18").setBackground("green");
  if (z == 1) sheetRoman.getRange("G15:K18").setBackground("purple");
}