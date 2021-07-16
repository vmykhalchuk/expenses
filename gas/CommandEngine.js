var runManually = function() {
  var cmdToRun = "test";
  _commandEngine.executeCommand(cmdToRun, null, (text, senderName, messageTrackingData) => console.log("[" + senderName + "] " + text));
};

var _commandEngine = {
  
  _botCommands: {},
  
  _constructCommandsList: function() {
    _i();
    var cmdPref = "_process";
    var cmdSuf = "Command";
    var res = {};
    for (var k in _commandEngineCommands) {
      if (_.isFunction(_commandEngineCommands[k]) && k.startsWith(cmdPref) && k.endsWith(cmdSuf)) {
        var cmdKey = k.substring(cmdPref.length);
        cmdKey = cmdKey.substring(0,cmdKey.length - cmdSuf.length).toLowerCase();
        
        var cmdObjTmplt = _commandEngineCommands["_" + cmdKey];
        if (!cmdObjTmplt)
          cmdObjTmplt = { underConstruction: true, description: "🚧 command is under construction"};
        if (_.isFunction(cmdObjTmplt)) {
          throw new Error("function is not expected! see _commandEngineCommands # _" + cmdKey);
        }
        cmdObjTmplt.handler = k;
        res[cmdKey] = cmdObjTmplt;
      }
    }
    this._botCommands = res;
  },
  
  _getCmdObject: function(cmdKey) {
    _i();
    var cmdObj = this._botCommands[cmdKey];
    if (!cmdObj) throw "🤖: wrong keyword: " + cmdKey;
    cmdObj.key = cmdKey;
    if (!cmdObj.name) cmdObj.name = util.comm.capitalize(cmdKey);
    if (!cmdObj.helpCmdName) cmdObj.helpCmdName = cmdKey;
    if (cmdObj.underConstruction) {
      cmdObj.helpCmdName = "🚧" + cmdObj.helpCmdName;
    }
    if (!cmdObj.description) cmdObj.description = "🚧 no description yet";
    if (!cmdObj.usage) cmdObj.usage = "🚧 no usage yet";
    if (!cmdObj.handler || !_commandEngineCommands[cmdObj.handler] || !_.isFunction(_commandEngineCommands[cmdObj.handler]))
    throw "🤖: command is not properly registered, no function handler defined! keyword: " + cmdKey;
    return cmdObj;
  },
  
  supportedCommand: function(word0) {
    this._constructCommandsList();
    
    for (var cmdKey in this._botCommands) {
      if (util.viber.matchesWordPartially(word0, cmdKey)) {
        return this._getCmdObject(cmdKey);
      }
    }
    return null;
  },
  
  /**
  . - responseCallback - callback function(text, senderName, messageTrackingData)
  */
  executeCommand: function(messageText, messageTrackingData, responseCallback) {
    _i();
    if (!_.isFunction(responseCallback)) {
      throw new Error("responseCallback must exist and be a function");
    }
    
    messageText = ("" + messageText).trim();
    var messageTextLC = messageText.toLowerCase();
    var wordsLC = util.viber.splitToWords(messageTextLC);
    var words = util.viber.splitToWords(messageText);
    
    if (wordsLC.length == 0) {
      throw "🙊 Empty command string"; // FIXME make it a nice reply to responseCallback
    }
    var cmdObj = this.supportedCommand(wordsLC[0]);
    if (!cmdObj) {
      throw "*Unknown command*"; // FIXME make it a nice reply to responseCallback
    }
    
    if (wordsLC.length > 1 && util.viber.matchesWordPartially(wordsLC[1], "help")) {
      
      var cmdHelpMessage = "" + cmdObj.usage + "\n_" + cmdObj.description + "_";
      responseCallback(cmdHelpMessage, cmdObj.name);
      
    } else {
      
      var cmdCtxt = {
        messageText: messageText,
        messageTrackingData: messageTrackingData,
        words: words,
        wordsLC: wordsLC
      };
      
      try {
        var wrappedResponseCallback = function(text, messageTrackingData, senderName) {
          if (!senderName) senderName = cmdObj.name;
          responseCallback(text, senderName, messageTrackingData);
        };
        _commandEngineCommands[cmdObj.handler].call(_commandEngineCommands, cmdObj, cmdCtxt, wrappedResponseCallback);
      } catch(err) {
        var errMsg = "*⛔️ERROR:* " + err;
        if (err.stack) errMsg += "\n" + err.stack;
        if (responseCallback) responseCallback(errMsg);
        console.error(errMsg);
      }
      
    }
  }
};