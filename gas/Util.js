var util = {
  comm: {
    capitalize: function(s) {
      if (typeof s !== "string") return "";
      return s.charAt(0).toUpperCase() + s.slice(1);
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
    }
  },
  
  viber: {
    augmentExpType: function(expType) {
      if (expType == _c.expTypes.week) return "Ⓦ";
      if (expType && expType.startsWith("_")) return expType.substring(1);
      return expType ? expType : "⁉️";
    },
    
    dateTodayChar: "Ⓣ",
    dateYesterdayChar: "Ⓨ",
    
    timeToUnicodeDisplayText: function(dateTime) {
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
      
      for (var i = 1; i < 12; i++) {
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
    
    viberCorrectExpType: function(expType) {
      if (_c.expTypes[expType]) {
        return _c.expTypes[expType];
      } else {
        return expType;
      }
    },
    
    getDescriptionFromCommandWords: function(words, startingFromWordNo) {
      if (startingFromWordNo >= words.length) {
        return "";
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
