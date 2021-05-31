function runManualViberTest() {
  __manualTestsSuitViber.run();
}

var __manualTestsSuitViber = {
  run: function() {
    //this.processCashOrKredoCommand();
    //_viber.sendReplyToViberBotUser(this.senderId, "Test message");
  },
  
  senderId: "ftRbkaeNqyYv6rfv1ZmFrg==",
  
  processCashOrKredoCommand: function() {
    var words = ["c", "100", "week", "n", "test"];
    var wordsLC = words;
    _viber.processCashOrKredoCommand(_c.txTypes.cashWallet, false, words, wordsLC, "");
  },
  
  processLastCommand: function() {
    processLastCommand(5, null, this.senderId, "");
  }
  
};
