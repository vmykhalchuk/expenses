function doProcessViberMessage(jsonObjStr) {
  var jsonObj = JSON.parse(jsonObjStr);
  var eventType = jsonObj.event;
  var senderId = jsonObj.sender ? jsonObj.sender.id : null;
  var senderName = jsonObj.sender ? jsonObj.sender.name : null;
  var messageToken = jsonObj.message_token;
  var messageType = jsonObj.message ? jsonObj.message.type : null;
  var messageText = jsonObj.message ? jsonObj.message.text : null;
  var messageTrackingData = jsonObj.message ? jsonObj.message["tracking_data"] : null;
  console.log("messageToken: " + messageToken);
  
  if (util.gas.checkIfTokenRepeats(messageToken, "Viber-message-")) {
    console.warn("Duplicate viber message received: " + messageToken);
    return;
  }
  
  try {
    if (eventType === "message" && messageType === "text") {
      _viber.processViberMessage(senderId, senderName, messageText, messageTrackingData, jsonObjStr);
    } else if (eventType === "webhook") {
      console.log("Viber webhook registration event received");
    } else {
      throw "Viber wrong POST JSON call";
    }
  } catch (err) {
    recordInTxRow({status: "V-ERR"}, jsonObjStr);
    if (senderId) {
      _viber.sendReplyToViberBotUser(senderId, "⛔️*ERROR:* " + err);
    }
  }
}

var _viber = {
  _viberBotCommands: {},
  
  _constructCommandsList: function() {
    var cmdPref = "_process";
    var cmdSuf = "Command";
    var res = {};
    for (var k in this) {
      if (this[k] instanceof Function && k.startsWith(cmdPref) && k.endsWith(cmdSuf)) {
        var cmdKey = k.substring(cmdPref.length);
        cmdKey = cmdKey.substring(0,cmdKey.length - cmdSuf.length).toLowerCase();
        
        var cmdObjTmplt = this["_" + cmdKey];
        if (!cmdObjTmplt || cmdObjTmplt instanceof Function) 
          cmdObjTmplt = { underConstruction: true, description: "🚧 command is under construction"};
        cmdObjTmplt.handler = k;
        res[cmdKey] = cmdObjTmplt;
      }
    }
    this._viberBotCommands = res;
  },
  
  _getCmdObject: function(cmdKey) {
    var cmdObj = this._viberBotCommands[cmdKey];
    if (!cmdObj) throw "🤖: wrong keyword: " + cmdKey;
    cmdObj.key = cmdKey;
    if (!cmdObj.name) cmdObj.name = util.comm.capitalize(cmdKey);
    if (!cmdObj.helpCmdName) cmdObj.helpCmdName = cmdKey;
    if (cmdObj.underConstruction) {
      cmdObj.helpCmdName = "🚧" + cmdObj.helpCmdName;
    }
    if (!cmdObj.description) cmdObj.description = "🚧 no description yet";
    if (!cmdObj.usage) cmdObj.usage = "🚧 no usage yet";
    if (!cmdObj.handler || !this[cmdObj.handler] || !(this[cmdObj.handler] instanceof Function))
    throw "🤖: command is not properly registered, no handler defined! keyword: " + cmdKey;
    return cmdObj;
  },
  
  supportedCommand: function(word0) {
    this._constructCommandsList();
    
    for (var cmdKey in this._viberBotCommands) {
      if (util.viber.matchesWordPartially(word0, cmdKey)) {
        return this._getCmdObject(cmdKey);
      }
    }
    return null;
  },
  
  processViberMessage: function(senderId, senderName, messageText, messageTrackingData, jsonObjStr) {
    _sheets.recordViberSender(senderId, senderName, jsonObjStr);
    
    messageText = ("" + messageText).trim();
    var messageTextLC = messageText.toLowerCase();
    var wordsLC = util.viber.splitToWords(messageTextLC);
    var words = util.viber.splitToWords(messageText);
    
    if (wordsLC.length == 0) {
      throw "🙊 Empty command string";
    }
    var cmdObj = this.supportedCommand(wordsLC[0]);
    if (!cmdObj) {
      throw "*Unknown command*";
    }
    
    if (wordsLC.length > 1 && util.viber.matchesWordPartially(wordsLC[1], "help")) {
      
      var cmdHelpMessage = "" + cmdObj.usage + "\n_" + cmdObj.description + "_";
      _viber.sendReplyToViberBotUser(senderId, cmdHelpMessage, cmdObj.name);
      
    } else {
      
      var request = {
        senderId: senderId,
        senderName: senderName,
        messageText: messageText,
        messageTrackingData: messageTrackingData,
        words: words,
        wordsLC: wordsLC,
        jsonObjStr: jsonObjStr
      };
      
      try {
        this[cmdObj.handler].call(this, cmdObj, request);
      } catch(err) {
        this.sendReplyToViberBotUser(senderId, "⛔️*ERROR:* " + err, cmdObj.name);
      }
      
    }
  },
  
  
  /**
  _<command_keyword>: {
  - key: // auto-populated with keyword of command
  - handler: // auto-populated with name of handler function in _viber
  - name: "<UI Name>", // optional, will use capitalized key if none defined
  - helpCmdName: "<name used in help syntax>", // optional, will use key if none defined. This is used in help command when constructing list of command keys
  - description: "", // optional
  - usage: "", // optional
  - underConstruction: true/false // optional, false by default - to flag that command is still under construction
  }
  
  _process<Commandkeyword>Command: function(cmdObj, request)
  - cmdObj - see object above
  - request: {senderId, senderName, words, wordsLC, jsonObjStr}
  */
  
  _help: {
    name: "💡Help",
    description: "Display list of commands, or usage and description of command",
    usage: "h[elp] [<command>]"
  },
  
  _processHelpCommand: function(cmdObj, request) {
    var cmdHelpObj = request.wordsLC.length > 1 ? this.supportedCommand(request.wordsLC[1]) : null;
    
    if (cmdHelpObj) {
      var cmdHelpMessage = "" + cmdHelpObj.usage + "\n_" + cmdHelpObj.description + "_";
      
      this.sendReplyToViberBotUser(request.senderId, cmdHelpMessage, cmdHelpObj.name);
      
    } else {
      var usageMsg = "";
      for (var cmdKey in this._viberBotCommands) {
        var helpCmdName = this._getCmdObject(cmdKey).helpCmdName;
        usageMsg += usageMsg == "" ? "" : ", ";
        usageMsg += helpCmdName ? helpCmdName : cmdKey;
      }
      
      this.sendReplyToViberBotUser(request.senderId, usageMsg, cmdObj.name);
    }
  },
  
  _cash: {
    name: "💴Cash",
    description: "Register 💴Wallet cash expense",
    usage: "c[ash] <amount> [-|<expense_type>] [-|+-Nhd] [<description>]"
  },
  
  _processCashCommand: function(cmdObj, request) {
    this.processCashOrKredoCommand(_c.txTypes.cashWallet, request.words, request.wordsLC, request.jsonObjStr);
  },
  
  _kredo: {
    name: "💳Kredo",
    description: "Register 💳Kredo Black card expense",
    usage: "k[redo] <amount> [-|<expense_type>] [-|+-Nhd] [<description>]"
  },
  
  _processKredoCommand: function(cmdObj, request) {
    this.processCashOrKredoCommand(_c.txTypes.kredoBlack, request.words, request.wordsLC, request.jsonObjStr);
  },
  
  _mono: {
    name: "💳Mono",
    description: "Register 💳Mono White card expense",
    usage: "m[ono] <amount> [-|<expense_type>] [-|+-Nhd] [<description>]"
  },
  
  _processMonoCommand: function(cmdObj, request) {
    this.processCashOrKredoCommand(_c.txTypes.monoWhite, request.words, request.wordsLC, request.jsonObjStr);
  },
  
  processCashOrKredoCommand: function(txType, words, wordsLC, jsonObjStr) {
    if (txType != _c.txTypes.cashWallet && 
        txType != _c.txTypes.kredoBlack &&
        txType != _c.txTypes.monoWhite) {
      throw "Wrong txType: " + txType;
    }
    
    // c[ash] <amount> [-|<expense_type>] [-|+-Nhd] [<description>]
    // k[redo] ....
    var amount = wordsLC.length > 1 ? parseFloat(wordsLC[1]) : null;
    amount = -amount;
    var expType = wordsLC.length > 2 ? wordsLC[2] : null;
    expType = util.viber.viberCorrectExpType(expType);
    var txDateCode = wordsLC.length > 3 ? wordsLC[3] : null;
    // FIXME fails when we miss txDateCode in command!!! then only starting from second word - we get description
    var description = wordsLC.length > 4 ? util.viber.getDescriptionFromCommandWords(words, 4) : null;
    var txDate = util.viber.calculateDateByCode(txDateCode);
    var rowNo = recordInTxRow({
      status: "V-OK",
      txDate: txDate,
      amount: amount,
      myComment: description,
      txType: txType,
      expType: expType === "-" ? null : expType
    }, jsonObjStr, true);
    var amountF = rowNo > 2 ? (_c.sheets.inTx.name + "!" + _c.sheets.inTx.amountCol + rowNo) : amount; // FIXME this must be in Sheets code base!!!
    var namedRangeName;
    if (txType == _c.txTypes.cashWallet) {
      namedRangeName = _c.sheets.nr.balance.wallet;
    } else if (txType == _c.txTypes.kredoBlack) {
      namedRangeName = _c.sheets.nr.balance.kredoBlack;
    } else if (txType == _c.txTypes.monoWhite) {
      namedRangeName = _c.sheets.nr.balance.monoWhite;
    }
    modifyBalanceV2(amountF, namedRangeName);
  },
  
  _duplicated: {
    description: "Mark record as duplicated, thereby correcting related acounting",
    usage: "d[uplicated] <rowNo>"
  },
  
  _processDuplicatedCommand: function(cmdObj, req) {
    if (req.wordsLC.length < 1) {
      throw "First argument must be a number!";
    } else {
      var rowNo = parseInt(req.wordsLC[1]);
      if (isNaN(rowNo)) {
        throw "First argument must be a number!";
      } else {
        _sheets.markRecordAsDuplicated(rowNo);
      }
    }
  },
  
  _edit: {
    name: "✏Edit",
    helpCmdName: "✏edit",
    description: "Let's you modify expensetType and description of the record",
    usage: "e[dit] <rowNo|last> [<expType>] [<description>]"
  },
  
  _processEditCommand: function(cmdObj, req) {
    if (req.words.length < 3) {
      throw "Expect at least two arguments: row number and expense type!";
    } else {
      var rowNo = parseInt(req.words[1]);
      if (util.viber.matchesWordPartially(req.wordsLC[1], "last")) {
        rowNo = null; // to fix this - use tracking data to get last row no, bug was that hidden or filtered out by last command row was modified - not the last row shown by last command
        throw "🚧 last keyword is not supported yet!";
      }
      if (isNaN(rowNo)) {
        throw "First argument must be a row number or ```last``` keyword!";
      }
      // FIXME implement validation of expense types!
      var expTypeObj = null;
      try {
        expTypeObj = util.viber.parseRawExpenseType(req.words[2]);
      } catch(err) {
      }
      var newExpType = expTypeObj ? expTypeObj.expType : null;
      var newHouseSubType = (newExpType === "house" && expTypeObj) ? expTypeObj.subType : null;
      var newMiscSubType = (newExpType === "misc" && expTypeObj) ? expTypeObj.subType : null;
      console.log("subType: " + newHouseSubType);
      var newMyComment = util.viber.getDescriptionFromCommandWords(req.words, newExpType ? 3 : 2);
      _sheets.modifyRecord(rowNo, newExpType, newMyComment, newHouseSubType, newMiscSubType);
    }
  },
  
  _amount: {
    description: "Let's you modify amount of record",
    usage: "a[mount] <rowNo> <newAmmount>",
    underConstruction: true
  },
  
  _processAmountCommand: function(cmdObj, req) {
    if (req.words.length < 3) {
      throw "Expect at least two arguments: row number and expense type!";
    } else {
      var rowNo = parseInt(req.words[1]);
      if (isNaN(rowNo)) {
        throw "First argument must be a row number!";
      }
      var newAmount = parseFloat(req.words[2]);
      if (isNaN(newAmount)) {
        throw "Amount is not a valid number!";
      }
      _sheets.modifyRecordAmount(rowNo, (-newAmount));
    }
  },
  
  _last: {
    usage: "l[ast] [help|<rowsN>] [<expense_type>|all]",
    description: "View last transactions, filter if needed"
  },
  
  _processLastCommand: function(cmdObj, req) {
    var rowsN = 5;
    var filterByExpType = null;
    if (req.wordsLC.length > 1) {
      if (isNaN(parseInt(req.wordsLC[1]))) {
        filterByExpType = req.wordsLC[1];
      } else {
        rowsN = parseInt(req.wordsLC[1]);
      }
      if (req.wordsLC.length > 2) {
        filterByExpType = req.wordsLC[2];
      }
    }
    
    this.executeLastCommand(rowsN, filterByExpType, req.senderId, req.messageTrackingData, cmdObj.name);
  },
  
  executeLastCommand: function(rowsN, filterByExpType, senderId, trackingData, cmdName) {
    var startTime = new Date().getTime();
    var charCreditCard = "💳";
    var charMoney = "💴";
    var showAll = false;
    var expTypeObj = null;
    var expType = null;
    var houseSubType = null;
    var miscSubType = null;
    
    if (filterByExpType === "all") {
      showAll = true;
    } else {
      expTypeObj = filterByExpType === "" ? {} : util.viber.parseRawExpenseType(filterByExpType);
      expType = expTypeObj.expType;
      houseSubType = expType === "house" ? expTypeObj.subType : null;
      miscSubType = expType === "misc" ? expTypeObj.subType : null;
    }
    
    var filterFunction = function(row) {
      if (showAll) {
        return true;
      }
      if (expType) {
        var houseCheck = houseSubType ? row.houseSubType == houseSubType : true;
        var miscCheck = miscSubType ? row.miscSubType == miscSubType : true;
        return row.expType == expType && houseCheck && miscCheck;
      } else {
        return row.expType != _c.expTypes.none && row.expType != _c.expTypes.other;
      }
    };
    var lastInTxRows = _sheets.getInTxLastNRows(rowsN, filterFunction);
    var rows = lastInTxRows.rows.reverse();
    if (!rows || rows.length == 0) {
      _viber.sendReplyToViberBotUser(senderId, "🛸 вкрало дані...", cmdName);
      return;
    }
    var text = "";
    if (rows.length > 0) {
      for (var i = 0; i < rows.length; i++) {
        if (text != "") text += "\n";
        var txTypeStr = charCreditCard;
        if (rows[i].txType == _c.txTypes.cashWallet) txTypeStr = charMoney;
        var expTypeStr = util.viber.augmentExpType(rows[i].expType, rows[i].houseSubType, rows[i].miscSubType);
        var dateTimeStr = util.viber.timeToUnicodeDisplayText(rows[i].txDate);
        var amountStr = rows[i].amount ? rows[i].amount + "₴" : "-";
        text += "◦" + txTypeStr + amountStr + " *" + expTypeStr + "* " + dateTimeStr + " " + rows[i].fullDescription;
        if (rows[i].inTxRowNo) {
          text += " _[#" + rows[i].inTxRowNo + "]_";
        }
      }
    }
    if (lastInTxRows.timedOut) {
      text = "*⚠️Timed Out!!!*\n" + text;
    }
    var newTrackingData = rows[0] ? ("last " + rows[0].inTxRowNo + " " + rows.length) : "";
    var sendReplyTimeStart = new Date().getTime();
    _viber.sendReplyToViberBotUser(senderId, text, cmdName, newTrackingData);
    if (false/*debug: show how long it executes*/) {
      var sendReplyTime = new Date().getTime() - sendReplyTimeStart;
      var processTime = new Date().getTime() - startTime;
      var timerMessage = "Took: " + sendReplyTime + "ms to send. General took: " + processTime + "ms";
      _viber.sendReplyToViberBotUser(senderId, timerMessage, cmdName, newTrackingData);
    }
  },
  
  _record: {
    usage: "r[ecord] <KREDOBANK MESSAGE HERE>"
  },
  
  _processRecordCommand: function(cmdObj, req) {
    _ifttt.handleSmsReceived(req.messageText);
  },
  
  _status: {
    description: "Displays weekly balance leftovers, balance of Kycja account, etc",
    usage: "s[tatus]"
  },
  
  _processStatusCommand: function(cmdObj, req) {
    var dataStatus = getDataStatus();
    var weeklyToProcessStr = dataStatus.noExpTypeDefinedCount;
    if (weeklyToProcessStr && weeklyToProcessStr.indexOf(":") > 0) {
      weeklyToProcessStr = weeklyToProcessStr.substring(weeklyToProcessStr.indexOf(":") + 1).trim();
    }
    var weeklyStr = util.viber.convertToUserFriendlyNumber(dataStatus.weekly);
    var weekly2Str = util.viber.convertToUserFriendlyNumber(dataStatus.weekly2);
    var kycjaBalStr = util.viber.convertToUserFriendlyNumber(dataStatus.kycja);
    var walletBalStr = util.viber.convertToUserFriendlyNumber(dataStatus.wallet);
    var monoBlackBalStr = util.viber.convertToUserFriendlyNumber(dataStatus.monoBlackBalance);
    var kredoBlackBalStr = util.viber.convertToUserFriendlyNumber(dataStatus.kredoBlackBalance);
    _viber.sendReplyToViberBotUser(req.senderId, "*◦ⓌWeekly:* " + weeklyStr + " {" + weeklyToProcessStr + "} | _(" + weekly2Str + ")_\n" + 
                                   "*```◦Kycja:```* " + kycjaBalStr + "\n" +
                                   "*◦💴Wallet:* " + walletBalStr + "\n" + 
                                   "*◦💳Oleh's mono:* " + monoBlackBalStr + "\n" +
                                   "*◦💳Kredo black:* " + kredoBlackBalStr + "\n" +
                                   "", "💴Status");
  },
  
  _split: {
    usage: "sp[lit] <rowNo|last> <2|3|4> [<description>]"
  },
  
  _processSplitCommand: function(cmdObj, req) {
    if (req.words.length < 3) {
      throw "Expect at least two arguments: row number and on how many records to split!";
    } else {
      var rowNo = parseInt(req.words[1]);
      if (util.viber.matchesWordPartially(req.wordsLC[1], "last")) {
        rowNo = null; // to fix this - use tracking data to get last row no, bug was that hidden or filtered out by last command row was modified - not the last row shown by last command
        throw "🚧 last keyword is not supported yet!";
      }
      if (isNaN(rowNo)) {
        throw "First argument must be a number or ```last``` keyword!";
      }
      var splitCount = parseInt(req.words[2]);
      var newMyComment = util.viber.getDescriptionFromCommandWords(req.words, 3);
      _sheets.splitRecordIntoMany(rowNo, splitCount, newMyComment);
    }
  },
  
  _wallet: {
    usage: "w[allet] [b[alance]|help] <new amount>",
    description: "Modifies wallet cash balance"
  },
  
  _processWalletCommand: function(cmdObj, req) {
    if (req.wordsLC.length > 1 && util.viber.matchesWordPartially(req.wordsLC[1], "balance")) {
      if (req.words.length <= 2 || isNaN(parseFloat(req.words[2]))) {
        throw "New Amount is not a number";
      }
      
      var newBalance = parseFloat(req.words[2]);
      var range = SpreadsheetApp.getActive().getRange(_c.sheets.nr.balance.wallet);
      _sheets.updateSingleCellWithNewValueAndKeepOldValue(range, newBalance, false);
      
    } else {
      throw "Wrong command syntaxys"
    }
  },
  
  _man: {
    name: "Man-ual",
    description: "Displays available expense types, sub-types",
    usage: "m[an]"
  },
  
  _processManCommand: function(cmdObj, request) {
    var startTime = new Date().getTime();
    var manualMsg = "*Expense Types:* " + _sheets.getListOfExpenseTypes().join(", ");
    manualMsg += "\n*House Sub Types:* " + _sheets.getListOfHouseSubTypes().join(", ");
    manualMsg += "\n*Misc Sub Types:* " + _sheets.getListOfMiscSubTypes().join(", ");
    var tookMs = new Date().getTime() - startTime;
    manualMsg += "\n*Took: " + tookMs + "ms*";
    
    this.sendReplyToViberBotUser(request.senderId, manualMsg, cmdObj.name);
  },
  
  _admin: {
    helpCmdName: "🛠️admin",
    underConstruction: true
  },
  _processAdminCommand: function(cmdObj, req) {
    throw "🚧 Under construction!!!";
  },
  
  _test: {
    name: "🧪Test",
    helpCmdName: "🧪test"
  },
  _processTestCommand: function(cmdObj, req) {
    recordInTxRow({
      status: "V-TST"
    }, req.jsonObjStr);
  },
  
  authToken: null,
  getAuthToken: function() {
    if (!this.authToken) {
      this.authToken = PropertiesService.getScriptProperties().getProperty("Viber-Auth-Token");
      if (!this.authToken || this.authToken == "") throw "⛔️ No Viber Auth Token defined! Go to \"Z > Register Viber Hook\" section to register it!";
    }
    
    return this.authToken;
  },
  
  /*
  message - use * for bold, _ for italic, ~ for striked through, ``` for monospace
  */
  sendReplyToViberBotUser: function(receiverId, message, senderName, trackingData) {
    authToken = this.getAuthToken();
    receiverId = receiverId ? ("" + receiverId) : "";
    senderName = senderName ? ("" + senderName) : "🤖Bot is my name";
    trackingData = trackingData ? ("" + trackingData) : "";
    message = message ? ("" + message) : "🛸";
    
    var data = {
      "receiver": receiverId,
      "sender": {
        "name": senderName
      },
      "tracking_data": trackingData,
      "type":"text",
      "text": message
    };
    var options = {
      "method": "post",
      "headers": {
        "X-Viber-Auth-Token": authToken
      },
      "contentType": "application/json",
      "payload": JSON.stringify(data)
    };
    var response = UrlFetchApp.fetch("https://chatapi.viber.com/pa/send_message", options);
    return response;
  },
  
  registerWebHook: function(gasWebAppUrl) {
    authToken = this.getAuthToken();
    gasWebAppUrl = gasWebAppUrl ? ("" + gasWebAppUrl) : "";
    if (gasWebAppUrl.indexOf("?") == -1) {
      gasWebAppUrl += "?";
    } else {
      gasWebAppUrl += "&";
    }
    gasWebAppUrl += "source=viber";
    
    var data = {
      "url": gasWebAppUrl,
      "event_types": [],
      "send_name": true,
      "send_photo":true
    };
    var options = {
      "method": "post",
      "headers": {
        "X-Viber-Auth-Token": authToken
      },
      "contentType": "application/json",
      "payload": JSON.stringify(data)
    };
    var response = UrlFetchApp.fetch("https://chatapi.viber.com/pa/set_webhook", options);
    // TODO When call fails because of wrong authToken provided - remove it from Properties and let system know that it failed and should be reentered!
    return response;
  }
};

