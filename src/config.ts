import moment from 'moment';
import {
  CategoryColumns,
  NetWorthColumns,
  TransactionColumns,
  TransactionRow,
} from './integrations/sheets/types.ts';
import {
  AccountType,
  SimpleFinTransaction,
} from './integrations/simplefin/types.ts';

export class Util {
  private static BACKOFF_SECONDS = 60 * 1000;

  private static async delay(ms: number): Promise<void> {
    return new Promise((res) => setTimeout(res, ms));
  }
  private static async retryWithBackoff<T>(
    retries: number,
    maxRetries: number,
    onRetry: () => T,
  ): Promise<T> {
    try {
      // Make sure we don't wait on the first attempt
      if (retries > 0) {
        // Here is where the magic happens.
        // on every retry, we exponentially increase the time to wait.
        // Here is how it looks for a `maxRetries` = 4
        // (2 ** 1) * 100 = 200 ms
        // (2 ** 2) * 100 = 400 ms
        // (2 ** 3) * 100 = 800 ms
        const timeToWait = 2 ** retries * this.BACKOFF_SECONDS;
        console.log(`waiting for ${timeToWait}ms...`);
        await Util.delay(timeToWait);
      }

      return await onRetry();
    } catch (e) {
      // only retry if we didn't reach the limit
      // otherwise, let the caller handle the error
      if (retries < maxRetries) {
        // onRetry();
        return Util.retryWithBackoff(retries + 1, maxRetries, onRetry);
      } else {
        console.warn('Max retries reached. Bubbling the error up');
        throw e;
      }
    }
  }

  static AccountIds = [
    'ACT-fdf3ee50-5305-48c4-b1da-9e2b9ca2ce2a',
    'ACT-42de842c-fd2d-487c-a5f4-ea00eb7cdf33',
    'ACT-95e9f768-0a5a-4494-81d1-99687a9606fa',
    'ACT-ed986c6d-dc1d-41c3-acbb-c9ab1cab8afc',
    'ACT-e0852e39-2e15-4977-9f4c-dc18cb1c3a55',
    'ACT-d2b721f8-2341-4e7c-b737-ad1f6a04ef22',
    'ACT-86cd8d59-1c57-4c81-a067-3af731e401a8',
    'ACT-92387868-1bf3-4848-872b-4e8c5d98e511',
  ] as const;

  static AccountMapping: {
    [id in (typeof Util.AccountIds)[number]]: {
      name: string;
      type: AccountType;
    };
  } = {
    'ACT-fdf3ee50-5305-48c4-b1da-9e2b9ca2ce2a': {
      name: 'FHSA',
      type: AccountType.NET_WORTH,
    },
    'ACT-42de842c-fd2d-487c-a5f4-ea00eb7cdf33': {
      name: 'TFSA',
      type: AccountType.NET_WORTH,
    },
    'ACT-95e9f768-0a5a-4494-81d1-99687a9606fa': {
      name: 'RRSP (RBC)',
      type: AccountType.NET_WORTH,
    },
    'ACT-ed986c6d-dc1d-41c3-acbb-c9ab1cab8afc': {
      name: 'RRSP (Wealthsimple)',
      type: AccountType.NET_WORTH,
    },
    'ACT-e0852e39-2e15-4977-9f4c-dc18cb1c3a55': {
      name: '💳 Visa',
      type: AccountType.CREDIT,
    },
    'ACT-d2b721f8-2341-4e7c-b737-ad1f6a04ef22': {
      name: '💰 Sujay Salary EQ',
      type: AccountType.CHECKING,
    },
    'ACT-86cd8d59-1c57-4c81-a067-3af731e401a8': {
      name: 'RRSP (Self)',
      type: AccountType.CHECKING,
    },
    'ACT-92387868-1bf3-4848-872b-4e8c5d98e511': {
      name: 'Sujay Emergency',
      type: AccountType.SAVING,
    },
  } as const;

  static SheetConfig = {
    transactions: {
      id: Number(process.env.TRANSACTIONS_SHEET_ID),
      headerRowNumber: 8,
      columns: [
        TransactionColumns.ACCOUNT,
        TransactionColumns.CATEGORY,
        TransactionColumns.DATE,
        TransactionColumns.INFLOW,
        TransactionColumns.OUTFLOW,
        TransactionColumns.MEMO,
        TransactionColumns.STATUS,
      ],
    },

    categories: {
      id: Number(process.env.CONFIGURATION_SHEET_ID),
      headerRowNumber: 8,
      columns: [
        CategoryColumns.BANK_ACCOUNTS,
        CategoryColumns.CATEGORY,
        CategoryColumns.CLEARED,
        CategoryColumns.CREDIT_CARDS,
        CategoryColumns.GOAL_AMOUNT,
        CategoryColumns.MONTHLY_AMOUNT,
      ],
    },

    netWorth: {
      id: Number(process.env.NET_WORTH_SHEET_ID),
      headerRowNumber: 19,
      columns: [
        NetWorthColumns.AMOUNT,
        NetWorthColumns.CLEARED,
        NetWorthColumns.DATE,
        NetWorthColumns.NET_WORTH_CATEGORY,
        NetWorthColumns.NOTES,
      ],
    },
  } as const;

  static simplefinTransactionToSheetRow(
    accountId: string,
    simpleFinTransaction: SimpleFinTransaction,
  ): TransactionRow {
    return {
      [TransactionColumns.ACCOUNT]: Util.AccountMapping[accountId].name,
      [TransactionColumns.CATEGORY]: '',
      [TransactionColumns.DATE]: moment(
        simpleFinTransaction.transactedAt,
      ).format('l'),
      [TransactionColumns.INFLOW]:
        Number(simpleFinTransaction.amount) > 0
          ? simpleFinTransaction.amount
          : '',
      [TransactionColumns.MEMO]: simpleFinTransaction.memo,
      [TransactionColumns.OUTFLOW]:
        Number(simpleFinTransaction.amount) < 0
          ? simpleFinTransaction.amount
          : '',
      [TransactionColumns.STATUS]: '✅',
      [TransactionColumns.ID]: simpleFinTransaction.id,
    };
  }

  static calculateNewTransactions(
    transactions: SimpleFinTransaction[],
    existingTransactions: TransactionRow[],
  ): SimpleFinTransaction[] {
    return transactions.filter(
      (t) =>
        !existingTransactions.find((et) => et[TransactionColumns.ID] === t.id),
    );
  }

  static async retry<T>(func: () => T): Promise<T> {
    return this.retryWithBackoff(0, 5, func);
  }
}
