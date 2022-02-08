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
      
      var responseHandler = function(text, senderName, messageTrackingData, keyboardData) {
        _viber.sendReplyToViberBotUser(senderId, text, senderName, messageTrackingData, keyboardData);
      };
      _commandEngine.executeCommand(messageText, messageTrackingData, responseHandler);
      
    } else if (eventType === "webhook") {
      console.log("Viber webhook registration event received");
    } else {
      throw "Viber wrong POST JSON call";
    }
  } catch (err) {
    var errMsg = "*⛔️ERROR:* " + err;
    if (err.stack) errMsg += "\n" + err.stack;
    if (senderId) {
      _viber.sendReplyToViberBotUser(senderId, errMsg);
    }
    console.error(errMsg);
  }
}

function runManuallySend() {
  var keyboard1 = {
    "Type": "keyboard",
    "Buttons": [{
      "Columns": 3,
      "Rows": 2,
      "Text": "<font color=\"#494E67\">Smoking</font><br><br>",
      "TextSize": "medium",
      "TextHAlign": "center",
      "TextVAlign": "bottom",
      "ActionType": "reply",
      "ActionBody": "Smoking",
      "BgColor": "#f7bb3f",
      "Image": "https: //s12.postimg.org/ti4alty19/smoke.png"
    }, {
      "Columns": 3,
      "Rows": 2,
      "Text": "<font color=\"#494E67\">Non Smoking</font><br><br>",
      "TextSize": "medium",
      "TextHAlign": "center",
      "TextVAlign": "bottom",
      "ActionType": "reply",
      "ActionBody": "Non smoking",
      "BgColor": "#f6f7f9",
      "Image": "https: //s14.postimg.org/us7t38az5/Nonsmoke.png"
    }]
  };
  
  var keyboard2 = {
    "Type": "keyboard",
    "DefaultHeight": false,
    "BgColor": "#FFFFFF",
    "Buttons": [{
      "Columns": 2,
      "Rows": 1,
      "BgColor": "#2db9b9",
      "BgMediaType": "gif",
      "BgMedia": "http://www.url.by/test.gif",
      "BgLoop": true,
      "ActionType": "open-url",
      "ActionBody": "www.tut.by",
      "Image": "www.tut.by/img.jpg",
      "Text": "Key text",
      "TextVAlign": "middle",
      "TextHAlign": "center",
      "TextOpacity": 60,
      "TextSize": "regular"
    }]
    
  }
  
  _viber.sendReplyToViberBotUser("ftRbkaeNqyYv6rfv1ZmFrg==", "test message 005", null, null, keyboard2);
}

var _viber = {
  
  /*
  message - use * for bold, _ for italic, ~ for striked through, ``` for monospace
  */
  sendReplyToViberBotUser: function(receiverId, message, senderName, trackingData, keyboardData) {
    authToken = this.getAuthToken();
    receiverId = receiverId ? ("" + receiverId) : "";
    senderName = senderName ? ("" + senderName) : "🤖Bot is my name";
    trackingData = trackingData ? ("" + trackingData) : "";
    message = message ? ("" + message) : "🛸";
    
    var data = {
      receiver: receiverId,
      sender: {
        name: senderName
      },
      tracking_data: trackingData,
      type: "text",
      text: message
    };
    if (keyboardData) {
      data.keyboard = keyboardData;
    }
    var options = {
      method: "post",
      headers: {
        "X-Viber-Auth-Token": authToken
      },
      contentType: "application/json",
      payload: JSON.stringify(data)
    };
    var response = UrlFetchApp.fetch("https://chatapi.viber.com/pa/send_message", options);
    var allHeaders = response.getAllHeaders();
    var respCode = response.getResponseCode();
    var respText = response.getContentText();
    return response;
  },
  
  authToken: null,
  getAuthToken: function() {
    if (!this.authToken) {
      this.authToken = PropertiesService.getScriptProperties().getProperty("Viber-Auth-Token");
      if (!this.authToken || this.authToken == "") throw "⛔️ No Viber Auth Token defined! Go to \"Z > Register Viber Hook\" section to register it!";
    }
    
    return this.authToken;
  },
  
  registerWebHook: function(gasWebAppUrl) {
    console.info("gasWebAppUrl: " + gasWebAppUrl);
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
    console.log("response code: " + response.getResponseCode());
    console.log("response text: " + response.getContentText());
    if (response.getResponseCode() != 200) {
      // TODO When call fails because of wrong authToken provided - remove it from Properties and let user know that it failed and should be reentered!
    }
    return response;
  }
};

