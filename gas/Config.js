// unicode emoji: https://emojipedia.org/hammer-and-wrench/
var _c = {
  mono: {
    whiteCardAccId: "W_lPmQPxdqFR_QuIqyy8JQ",
    blackCardAccId: "GxdGoQDsS9V9haSkeGrx6g",
    topUpFromKredo: {
      mcc: 4829,
      description: "Від: 516804****3878"
    },
    autoRounding: {
      mcc: 4829,
      description: "На ремонт хонди"
    }
  },
  txTypes: {
    monoWhite: "mono-white",
    monoBlack: "mono-black",
    kredoBlack: "kredo-black",
    cashWallet: "cash-wallet"
  },
  expTypes: {
    month: "month", //📅
    extra: "extra", //Ⓧ or Ⓔ
    kycja: "kycja", //🦊
    house: "house", //🏡
    none: "_none",
    week: "_week",
    other: "_other",
    split2: "_split_2",
    split3: "_split_3",
    split4: "_split_4"
  },
  
  currenciesList: ["", "USD", "EUR"],
  currenciesFormats: ["[$грн.]#,##0.00", "[$$]#,##0.00", "[$€]#,##0.00"],
  
  perf: {
    mono: {
      goBackRowsToCheckStatementIdDuplicate: 20
    }
  },
  
  sheets: {
    config: {
      name: "Conf"
    },
    data: {
      name: "Data",
      
      weeklyAvailableCell: "B10"
    },
    inTx: {
      name: "InTx",
      
      firstRowNo: 3,
      
      statusCol: "A",
      dateCol: "B",
      txDateCol: "C",
      amountCol: "D",
      currencyCol: "E",
      exchRateCol: "F",
      monoMccCol: "G",
      monoDescriptionCol: "H",
      monoCommentCol: "I",
      txTypeCol: "J",
      expenseTypeCol: "K",
      paidFlagCol: "L",
      registeredFlagCol: "M",
      myCommentCol: "N",
      incomingPostDataCol: "O",
      miscSubTypeCol: "P",
      houseSubTypeCol: "Q"
    },
    aidTx: {
      name: "AidTx"
    },
    archTx: {
      name: "ArchTx"
    },
    viber: {
      name: "Viber"
    },
    mono: {
      name: "Mono",
      statusCol: "A",
      statementIdCol: "B",
      transactionDataCol: "C"
    },
    nr: { // named ranges
      balance: {
        kredoBlack: "Kredo_black_balance",
        monoBlack: "Mono_black_balance",
        monoWhite: "Mono_white_balance",
        kycjaAccount: "Kycja_acc_balance",
        wallet: "Wallet_balance"
      },
      status: {
        kycjaAccountAvailable: "Status_Kycja_available_Balance",
        weeklyBalance: "Data!B10",
        noExpTypeDefined: "Data!C10",
        weeklyBalance2: "Data!B11",
        kredoDebt: "Data!B12"
      },
      inTxSummary: "IN_TX_SUMMARY",
      config: {
        expenseTypes: "C_EXP_TYPES",
        houseSubTypes: "C_HOUSE_SUB_TYPES",
        miscSubTypes: "C_MISC_SUB_TYPES",
        currentWeekStart: "C_CURR_WEEK_START"
      }
    }
  },
  
  // localOnly - wil not be cached in GAS Cache service, only locally
  //    NOTE: only local cache can hold arbitrary objects, while global cache supports strings only
  caches: {
    listOfExpenseTypes: { name: "listOfExpenseTypes" },
    listOfHouseSubTypes: { name: "listOfHouseSubTypes" },
    listOfMiscSubTypes: { name: "listOfMiscSubTypes" },
    underscoreJSCode: { name: "underscoreJSCode" },
    userFriendlyListOfExpenseTypes: { name: "userFriendlyListOfExpenseTypes", localOnly: true }
  }
};
