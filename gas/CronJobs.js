function cronJobsInitialize() {
  // go through cron jobs and initialize schedules and corresponding functions
}

var cronJobs = {
  
  job1: {
    dscription: "KredoBank limit checker. Will let user know that limit is below virtual zero!",
    recurrence: {
      everyHours: 12
    },
    handler: function() {
      // check kredo status
      var status = _sheets.getDataStatus(true);
      // get list of viber Receiver IDs to notify
      var receiverId = "ftRbkaeNqyYv6rfv1ZmFrg==";
      // send notifications
      var message = "Kredobank balance is LOW!!!\n" + status.kredoBlackBalance;
      _viber.sendReplyToViberBotUser(receiverId, message, "Admin🤖");
    }
  }
}