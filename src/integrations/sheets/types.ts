export enum TransactionColumns {
  DATE = 'DATE',
  OUTFLOW = 'OUTFLOW',
  INFLOW = 'INFLOW',
  CATEGORY = 'CATEGORY',
  ACCOUNT = 'ACCOUNT',
  MEMO = 'MEMO',
  STATUS = 'STATUS',
  ID = 'ID',
}

export enum CategoryColumns {
  CATEGORY = 'CATEGORY / GROUP NAME',
  MONTHLY_AMOUNT = 'MONTHLY AMOUNT',
  GOAL_AMOUNT = 'GOAL AMOUNT',
  CLEARED = '✓ ✕',
  BANK_ACCOUNTS = 'BANK ACCOUNTS / CASH',
  CREDIT_CARDS = 'CREDIT CARDS',
  SYMBOL = '✧',
}

export enum NetWorthColumns {
  DATE = 'DATE',
  AMOUNT = 'AMOUNT',
  NET_WORTH_CATEGORY = 'NET_WORTH_CATEGORY',
  NOTES = 'NOTES',
  CLEARED = '✱',
}

export type TransactionRow = {
  [TransactionColumns.DATE]: string;
  [TransactionColumns.OUTFLOW]: string;
  [TransactionColumns.INFLOW]: string;
  [TransactionColumns.CATEGORY]: string;
  [TransactionColumns.ACCOUNT]: string;
  [TransactionColumns.MEMO]: string;
  [TransactionColumns.STATUS]: string;
  [TransactionColumns.ID]: string;
};

export type CategoryRow = {
  [CategoryColumns.BANK_ACCOUNTS]: string;
  [CategoryColumns.CATEGORY]: string;
  [CategoryColumns.CLEARED]: string;
  [CategoryColumns.CREDIT_CARDS]: string;
  [CategoryColumns.GOAL_AMOUNT]: string;
  [CategoryColumns.MONTHLY_AMOUNT]: string;
  [CategoryColumns.SYMBOL]: string;
};

export type AddRowInput =
  | {
      type: 'transactions';
      data: TransactionRow;
    }
  | {
      type: 'category';
      data: CategoryRow;
    };
