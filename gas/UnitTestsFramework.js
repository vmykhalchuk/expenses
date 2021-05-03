function __getAllTestsSuits() {
  var res = new Array();
  var global = this;
  for (var k in global) {
    if (!(global[k] instanceof Function) && k.startsWith("__testsSuit")) {
      var suit = global[k];
      suit.name = k.substring("__testsSuit".length);
      res.push(suit);
    }
  }
  return res;
}

function runUnitTestsInSpreadsheetApp() {
  // Setup Unit Testing Framework
  addUnitTestAsserts(this);
  
  var allTestsSuits = __getAllTestsSuits();
  var ui = SpreadsheetApp.getUi();
  
  var suitsCount = 0;
  var suitsFailed = 0;
  var totalTests = 0;
  var totalTestsFailed = 0;
  for (var i in allTestsSuits) {
    suitsCount++;
    
    var testsSuit = allTestsSuits[i];
    var testsSuitName = "#" + i;
    if (testsSuit && testsSuit.name) {
      testsSuitName += " " + testsSuit.name;
    }
    
    if (!testsSuit) {
      ui.alert("⛔️Tests suit miss configured: " + testsSuitName);
      suitsFailed++;
      continue;
    }
    
    var testResults = "";
    var testCases = 0;
    var testCasesFailed = 0;
    for (var testKey in testsSuit) {
      var testFunc = testsSuit[testKey];
      if (testFunc instanceof Function) {
        testCases++;
        var testCaseRes = null;
        try {
          testCaseRes = testFunc.call(testsSuit);
        } catch (err) {
          testCasesFailed++;
          if (testResults !== "") {
            testResults += "\n";
          }
          testResults += "  " + testKey + ": " + (err ? " ERROR: " + err : "");
        }
      }
    }
    
    totalTests += testCases;
    totalTestsFailed += testCasesFailed;
    if (testCasesFailed >= 1) {
      suitsFailed++;
      ui.alert("⚠️Test suit failed: " + testsSuitName + "\n" + testResults);
    }
  }
  
  ui.alert("☣️️✔️Test suits failed/total: " + suitsFailed + "/" + suitsCount + 
           "\n☣️️✔️Test cases failed/total: " + totalTestsFailed + "/" + totalTests);
}

function addUnitTestAsserts(testsSuit) {
  var assertTrueTmplt = function(val, message) {
    if (val != true) throw "True is expected!" + (message ? "\n" + message : "");
  };
  testsSuit.assertTrue = assertTrueTmplt;
  
  var assertFalseTmplt = function(val, message) {
    if (val != false) throw "False is expected!" + (message ? "\n" + message : "");
  };
  testsSuit.assertFalse = assertFalseTmplt;
  
  var assertEqualsTmplt = function(expectedVal, actualVal, message) {
    if (expectedVal !== actualVal) throw "Expected: " + expectedVal + " but got: " + actualVal + 
      (message ? "\n" + message : "");
  };
  testsSuit.assertEquals = assertEqualsTmplt;
  
  var assertExceptionTmplt = function(func, exceptionMessage, message) {
    if (!func || !func instanceof Function) throw "func{" + func + "} is not a Function";
    try {
      func.call();
    } catch (e) {
      if (exceptionMessage && e != exceptionMessage) {
        throw "" + func.name + " is expected to throw: \"" + exceptionMessage + "\", however actual exception is: \"" + e + 
          "\"" + (message ? "\n" + message : "");
      }
      return;
    }
    throw "" + func.name + " is expected to throw exception!" + (message ? "\n" + message : "");
  }
  testsSuit.assertException = assertExceptionTmplt;
  
  var assertNoExceptionTmplt = function(func, message) {
    if (!func || !func instanceof Function) throw "func{" + func + "} is not a Function";
    try {
      func.call();
    } catch (e) {
      throw "" + func.name + " is Not expected to throw exception! However exception occured: \"" + e + "\"" + 
        (message ? "\n" + message : "");
    }
  }
  testsSuit.assertNoException = assertNoExceptionTmplt;
  
  return testsSuit;
}