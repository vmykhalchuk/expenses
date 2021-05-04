var _ifttt = {
  
  handleSmsReceived: function(smsText) {
    if (!smsText) return;
    
    const balanceWordStr = 'ZALISHOK';
    var balanceWordIdx = smsText.indexOf(balanceWordStr);
    if (balanceWordIdx == -1) {
      throw "Wrong KREDOBANK message!!!"
    }
    var balanceStr = smsText.substring(balanceWordIdx + balanceWordStr.length);
    var balance = parseFloat(balanceStr);
    if (balance) recordBalance(balance, _c.sheets.nr.balance.kredoBlack);
  }
  
}

