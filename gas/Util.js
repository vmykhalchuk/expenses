var _util_cache = {};

var util = {
  
  comm: {
    capitalize: function(s) {
      if (typeof s !== "string") return "";
      return s.charAt(0).toUpperCase() + s.slice(1);
    },
    
    evalLocalCache: function(key, evalFunc) {
      if (!_util_cache[key]) {
        _util_cache[key] = evalFunc.call();
      }
      return _util_cache[key];
    },
    
    evalCache: function(key, evalFunc) {
      return this.evalLocalCache(key, function() {
        var cacheRes = CacheService.getScriptCache().get(key);
        if (!cacheRes) {
          cacheRes = evalFunc.call();
          CacheService.getScriptCache().put(key, cacheRes, 21600 /*6h*/);
        }
        return cacheRes;
      });
    },
    
    removeCacheEntry: function(key) {
      CacheService.getScriptCache().remove(key);
    },
    
    parallelizeTwoStreams: function(stream1, stream2, pickSizeHandler) {
      return {
        stream1: stream1,
        stream2: stream2,
        handler: pickSizeHandler,
        
        hasNext: function() {
          return this.stream1.hasNext() || this.stream2.hasNext();
        },
        
        next: function() {
          if (!this.stream1.hasNext()) {
            return this.stream2.next();
          } else if (this.stream2.hasNext()) {
            return this.stream1.next();
          } else {
            if (this.handler(this.stream1.peek(), this.stream2.peek())) {
              return this.stream1.next();
            } else {
              return this.stream2.next();
            }
          }
        },
        
        peek: function() {
          throw new Error("Under construction!");
        }
      };
    },
    
    concatenateTwoStreams: function(stream1, stream2) {
      return {
        stream1: stream1,
        stream2: stream2,
        
        hasNext: function() {
          stream1.hasNext() || stream2.hasNext();
        },
        
        next: function() {
          if (stream1.hasNext()) {
            return stream1.next();
          } else {
            return stream2.next();
          }
        },
        
        peek: function() {
          if (stream1.hasNext()) {
            return stream1.peek();
          } else {
            return stream2.peek();
          }
        }
      };
    }
  },
  
  gas: {
    checkWebAppState: function() {
      if (false) {
        //this dummy code is used to trick gas to enable dev access
        //to be able to create access token with required creds to access
        // see here: https://github.com/tanaikech/taking-advantage-of-Web-Apps-with-google-apps-script/blob/master/README.md
        DriveApp.getFiles();
      }
      
      return ScriptApp.getService().isEnabled();
    },
    
    getWebAppDevUrlWithAccessToken: function() {
      if (false) {
        // see here: https://github.com/tanaikech/taking-advantage-of-Web-Apps-with-google-apps-script/blob/master/README.md
        DriveApp.getFiles();
      }
      // webAppUrl is /dev not /exec, however it should work for now (unless DriveApp auth scope is not included, see few lines above)
      var webAppUrlDev = ScriptApp.getService().getUrl() + "?access_token=" + ScriptApp.getOAuthToken();
      return webAppUrlDev;
    },
    
    // if (util.gas.checkIfTokenRepeats(token, "Viber-message-")) {
    //   console.warn("Duplicate viber message received: " + token);
    //   throw "error";
    // }
    checkIfTokenRepeats: function(token, cachePref) {
      // check if cache contains this token already
      var cache = CacheService.getScriptCache();
      var cacheKey = cachePref + token;
      if (cache.get(cacheKey) != null) {
        return true;
      }
      var lock = LockService.getScriptLock();
      lock.waitLock(5000);
      // check again
      if (cache.get(cacheKey) != null) {
        return true;
      }
      cache.put(cacheKey, "MSG");
      lock.releaseLock();
      return false;
    }
  },
  
  viber: {
    augmentExpType: function(expType, houseSubType, miscSubType) {
      if (expType == _c.expTypes.week) return "Ⓦ";
      if (expType && expType.startsWith("_")) return expType.substring(1);
      if (expType && houseSubType) {
        expType += ":" + houseSubType;
      }
      if (expType && miscSubType) {
        expType += ":" + miscSubType;
      }
      return expType ? expType : "⁉️";
    },
    
    dateTodayChar: "Ⓣ",
    dateYesterdayChar: "Ⓨ",
    
    convertToUserFriendlyNumber: function(number) {
      var numberStr = "" + number;
      if (numberStr.startsWith("-")) {
        numberStr = "−" + numberStr.substring(1) + "";//⨺
      }
      return numberStr;
    },
    
    timeToHappyDisplayText: function(dateTime) {
      if (!dateTime || !(dateTime instanceof Date) || isNaN(dateTime.getFullYear())) {
        return "E:" + dateTime;
      }
      
      //var hours = dateTime.getHours();
      //var minutes = dateTime.getMinutes();
      var year = dateTime.getFullYear();
      var month = dateTime.getMonth();
      var date = dateTime.getDate();
      
      var todayDateTime = new Date();
      var yesterdayDateTime = new Date(); yesterdayDateTime.setDate(yesterdayDateTime.getDate() - 1);
      
      var datePortionStr;
      if (year == todayDateTime.getFullYear() && month == todayDateTime.getMonth() && date == todayDateTime.getDate()) {
        // this is Today
        datePortionStr = this.dateTodayChar;
      } else if (year == yesterdayDateTime.getFullYear() && month == yesterdayDateTime.getMonth() && date == yesterdayDateTime.getDate()) {
        // this is Yesterday
        datePortionStr = this.dateYesterdayChar;
      } else {
        datePortionStr = dateTime.toISOString().slice(0, 10);
      }
      
      return datePortionStr + " " + dateTime.toLocaleTimeString("uk-UK").slice(0,5);
      
    },
    
    isDateCode: function(code) {
      if (util.viber.matchesWordPartially(code, "now"))
        return true;
      // FIXME finish it
    },
    
    calculateDateByCode: function(code) {
      code = "" + code;
      if (code === "-")
        return new Date();
      if (util.viber.matchesWordPartially(code, "now"))
        return new Date();
      
      for (var i = 1; i < 99; i++) {
        if (code === "-" + i + "d") {
          return new Date(new Date().getTime() - i*24*60*60*1000);
        } else if (code === "-" + i + "h") {
          return new Date(new Date().getTime() - i*60*60*1000);
        }
      }
      
      return new Date();
    },
    
    splitToWords: function(str) {
      var arr = str.split(' ');
      var arrRes = [];
      for (const s of arr) {
        if (s.trim() !== "") {
          arrRes.push(s.trim());
        }
      }
      return arrRes;
    },
    
    matchesWordPartially: function(str, testWord) {
      if (!str || !testWord) return false;
      if (str.length > testWord.length) {
        return false;
      }
      for (var i = 0; i < str.length; i++) {
        if (str.charAt(i) != testWord.charAt(i)) {
          return false;
        }
      }
      return true;
    },
    
    matchesOneOfTheWordsInListPartially: function(str, listOfWords) {
      for (var i = 0; i < listOfWords.length; i++) {
        if (this.matchesWordPartially(str, listOfWords[i])) {
          return listOfWords[i];
        }
      }
      return null;
    },
    
    matchesOneOfTheWordsInMapKeysPartially: function(str, mapOfWords) {
      for (var k in mapOfWords) {
        if (this.matchesWordPartially(str, k)) {
          return k;
        }
      }
      return null;
    },
    
    // returns: {expType: "<expType>", expTypeUserFriendly: "<expTypeNoUnderscores>", subType: "<subType>"}
    parseRawExpenseType: function(expTypeStr) {
      if (!expTypeStr) return {};
      var separatorIndx = expTypeStr.indexOf(":") == -1 ? expTypeStr.indexOf(".") : expTypeStr.indexOf(":");
      var mainTypeStr = separatorIndx == -1 ? expTypeStr : expTypeStr.substring(0, separatorIndx);
      var subTypeStr = separatorIndx == -1 ? "" : expTypeStr.substring(separatorIndx + 1);
      mainTypeStr = mainTypeStr.trim().toLowerCase();
      subTypeStr = subTypeStr.trim().toLowerCase();
      
      var res = {};
      
      var expTypeUserFriendly = this.matchesOneOfTheWordsInMapKeysPartially(mainTypeStr, this.getUserFriendlyMapOfExpenseTypes());
      if (!expTypeUserFriendly) throw "Wrong expense type: " + expTypeStr;
      
      res["expTypeUserFriendly"] = expTypeUserFriendly;
      res["expType"] = this.getUserFriendlyMapOfExpenseTypes()[expTypeUserFriendly];
      
      if (subTypeStr !== "" && expTypeUserFriendly === "house") {
        var houseSubTypes = _sheets.getListOfHouseSubTypes();
        var subType = this.matchesOneOfTheWordsInListPartially(subTypeStr, houseSubTypes);
        if (!subType) throw "Wrong sub type: " + subTypeStr;
        res["subType"] = subType;
      } else if (subTypeStr !== "" && expTypeUserFriendly === "misc") {
        var miscSubTypes = _sheets.getListOfMiscSubTypes();
        var subType = this.matchesOneOfTheWordsInListPartially(subTypeStr, miscSubTypes);
        if (!subType) throw "Wrong sub type: " + subTypeStr;
        res["subType"] = subType;
      }
      
      return res;
    },
    
    // return {"none": "_none", "house": "house", ...}
    getUserFriendlyMapOfExpenseTypes: function() {
      var thiz = this;
      var lambda = () => {
        var expenseTypes = _sheets.getListOfExpenseTypes();
        var res = new Object();
        expenseTypes.forEach(el => (res[thiz._expenseTypeToUserFriendlyExpType(el)] = el));
        return res;
      };
      return util.comm.evalLocalCache("userFriendlyListOfExpenseTypes", lambda);
    },
    
    _expenseTypeToUserFriendlyExpType: function(expType) {
      return expType.replace(/_/g, '');
    },
    
    getDescriptionFromCommandWords: function(words, startingFromWordNo) {
      if (startingFromWordNo >= words.length) {
        return null;
      }
      var description = "";
      for (var i = startingFromWordNo; i < words.length; i++) {
        if (description !== "") description += " ";
        description += words[i];
      }
      return description;
    }
  },
  
  sheets: {
    appendStrIf: function(str, str2Append, delim) {
      if (str2Append) {
        return str == "" ? str2Append : (str + delim + str2Append);
      } else {
        return str;
      }
    },
    
    calculateFullDescription: function(description, monoComment, myComment) {
      var resStr = "";
      resStr = this.appendStrIf(resStr, description, "/");
      resStr = this.appendStrIf(resStr, monoComment, "/");
      resStr = this.appendStrIf(resStr, myComment, "/");
      return resStr;
    },
    
    /**
    returns stream with next(), hasNext() methods, to get next() element which is {values: [], displayValues: [], rowNo: int, sheet: Sheet }
    */
    getStreamOfRowsFromSheetInReverse: function(sheet, chunkSize) {
      
      var _calculateNextBatch = function() {
        this.rowFrom = this.rowTo - this.chunkSize + 1;
        this.rowFrom = this.rowFrom >= this.minimumRowNo ? this.rowFrom : this.minimumRowNo;
        var sourceRange = this.sheet.getRange(this.rowFrom, 1, this.rowTo - this.rowFrom + 1, this.lastColumnIndx);
        this.displayValues = sourceRange.getDisplayValues().reverse();
        this.values = sourceRange.getValues().reverse();
        this.i = 0;
      };
      
      var nextFunc = function() {
        var po = this.peekObj;
        if (po) {
          this.peekObj = null;
          return po;
        }

        if (!this.hasNext()) {
          return null;
        }
        
        if (this.i < this.displayValues.length) {
          var resObj = {
            values: this.values[this.i],
            displayValues: this.displayValues[this.i],
            rowNo: this.rowTo - this.i,
            sheet: this.sheet
          }
          this.i++;
          return resObj;
          
        } else {
          
          this.rowTo = this.rowFrom - 1;
          this._calculateNextBatch();
          return this.next();
        }
      };
      
      var stream = {
        _calculateNextBatch: _calculateNextBatch,
        next: nextFunc,
        hasNext: function() {
          return this.peekObj || ((this.rowTo - this.i) >= this.minimumRowNo);
        },
        peek: function() {
          if (!this.peekObj && this.hasNext()) {
            this.peekObj = this.next();
          }
          return this.peekObj;
        },
        
        sheet: sheet,
        chunkSize: chunkSize,
        
        minimumRowNo: _c.sheets.inTx.firstRowNo,
        rowTo: sheet.getLastRow(),
        lastColumnIndx: sheet.getLastColumn()
      };
      stream._calculateNextBatch();
      return stream;
    },
    
    columnToLetter: function(column) {
      var temp, letter = '';
      while (column > 0) {
        temp = (column - 1) % 26;
        letter = String.fromCharCode(temp + 65) + letter;
        column = (column - temp - 1) / 26;
      }
      return letter;
    },
    
    letterToColumn: function(letter) {
      var column = 0, length = letter.length;
      for (var i = 0; i < length; i++) {
        column += (letter.charCodeAt(i) - 64) * Math.pow(26, length - i - 1);
      }
      return column;
    }
  }
};
