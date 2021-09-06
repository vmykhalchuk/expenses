function __getAllTestSuites() {
  var res = new Array();
  var global = this;
  for (var k in global) {
    if (!(global[k] instanceof Function) && k.startsWith("__testSuite")) {
      var suit = global[k];
      suit.name = k.substring("__testSuite".length);
      res.push(suit);
    }
  }
  return res;
}

function runAllUnitTestsInSpreadsheetApp() {
  runAllUnitTests((msg) => SpreadsheetApp.getUi().alert(msg), true);
}

function runAllUnitTests(alertMsgCallback, verbose) {
  // Setup Unit Testing Framework
  addUnitTestAsserts(this);
  
  var allTestSuites = __getAllTestSuites();
  
  var suitsCount = 0;
  var suitsFailed = 0;
  var totalTests = 0;
  var totalTestsFailed = 0;
  for (var i in allTestSuites) {
    suitsCount++;
    
    var testSuite = allTestSuites[i];
    var testSuiteName = "#" + i;
    if (testSuite && testSuite.name) {
      testSuiteName += " " + testSuite.name;
    }
    
    if (!testSuite) {
      alertMsgCallback("⛔️TestSuite miss configured: " + testSuiteName);
      suitsFailed++;
      continue;
    }
    
    var testResults = "";
    var testCases = 0;
    var testCasesFailed = 0;
    for (var testKey in testSuite) {
      var testFunc = testSuite[testKey];
      if (testFunc instanceof Function) {
        testCases++;
        var testCaseRes = null;
        try {
          testCaseRes = testFunc.call(testSuite);
        } catch (err) {
          var errMsg = "⛔️ERROR: " + err;
          if (verbose && err.stack) errMsg += "\n" + err.stack;
          
          testCasesFailed++;
          if (testResults !== "") {
            testResults += "\n";
          }
          testResults += "  " + testKey + ": " + errMsg;
        }
      }
    }
    
    totalTests += testCases;
    totalTestsFailed += testCasesFailed;
    if (testCasesFailed >= 1) {
      suitsFailed++;
      alertMsgCallback("⚠️Test Suite failed: " + testSuiteName + "\n" + testResults);
    }
  }
  
  alertMsgCallback("☣️️✔️Test suits failed/total: " + suitsFailed + "/" + suitsCount + 
           "\n☣️️✔️Test cases failed/total: " + totalTestsFailed + "/" + totalTests);
}

function addUnitTestAsserts(testSuite) {
  var assertTrueTmplt = function(val, message) {
    if (val != true) throw "True is expected!" + (message ? "\n" + message : "");
  };
  testSuite.assertTrue = assertTrueTmplt;
  
  var assertFalseTmplt = function(val, message) {
    if (val != false) throw "False is expected!" + (message ? "\n" + message : "");
  };
  testSuite.assertFalse = assertFalseTmplt;
  
  var assertEqualsTmplt = function(expectedVal, actualVal, message) {
    if (expectedVal !== actualVal) throw "Expected: " + expectedVal + " but got: " + actualVal + 
      (message ? "\n" + message : "");
  };
  testSuite.assertEquals = assertEqualsTmplt;
  
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
  testSuite.assertException = assertExceptionTmplt;
  
  var assertNoExceptionTmplt = function(func, message) {
    if (!func || !func instanceof Function) throw "func{" + func + "} is not a Function";
    try {
      func.call();
    } catch (e) {
      throw "" + func.name + " is Not expected to throw exception! However exception occured: \"" + e + "\"" + 
        (message ? "\n" + message : "");
    }
  }
  testSuite.assertNoException = assertNoExceptionTmplt;
  
  return testSuite;
}