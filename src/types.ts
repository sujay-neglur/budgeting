export namespace SimpleFin {
  export type Transaction = {
    id: string;
    posted: number;
    amount: string;
    description: string;
    payee: string;
    memo: string;
    transacted_at: number;
  };

  export type TransactionWithAccountId = Transaction & { accountId: string };

  export type Account = {
    org: {
      domain: string;
      name: string;
      'sfin-url': string;
      url: string;
      id: string;
    };
    id: string;
    name: string;
    currency: string;
    balance: string;
    'available-balance': string;
    'balance-date': number;
    transactions: SimpleFin.Transaction[];
  };

  export type Query = GenericQuery & {
    onlyData?: boolean;
    pending?: 0 | 1;
    filterAccounts?: string[];
  };
}

export namespace TBudget {
  export type Props = {
    url: string;
    password: string;
    dataDir: string;
    budgetId: string;
    syncId: string;
  };

  export type TransactionQuery = GenericQuery & {
    accountId: string;
    transactionIds?: string[];
  };

  export type CategoryGroup = {
    id: string;
    name: string;
    hidden: boolean;
    categories: Category[];
  };

  export type Category = {
    id: string;
    name: string;
    isIncome: boolean;
    hidden: boolean;
    groupId: string;
  };

  export type Payee = {
    id: string;
    name: string;
    transferId: string | null;
  };

  export type Account = {
    id: string;
    name: string;
    offbudget: boolean;
    closed: boolean;
  };

  export type TransactionCreate = {
    accountId: string;
    date: Date;
    payeeId?: string;
    payeeName?: string;
    importedPayee?: string;
    categoryId?: string;
    notes?: string;
    imported_id?: string;
    transfer_id?: string;
    cleared?: boolean;
    subTransactions?: Transaction[];
  };

  export type TransactionCreateResponse = {
    errors?: {
      message: string;
    }[];
    added: string[];
    updated: string[];
  };

  export type Transfer = {
    account: {
      source: string;
      target: string;
      sourceAccountName: string;
      targetAccountName: string;
    };
    transaction: {
      date: Date;
      source: string;
      target: string;
      sourceAmount: number;
      targetAmount: number;
    };
  };

  export type AccountCreate = {
    id: string;
    name: string;
    type: AccountType;
    offbudget: boolean;
    balance: number;
  };

  export type Classification = {
    transactionId: string;
    accountId: string;
    categoryId: string;
    categoryName: string;
  };

  export type NativeMonthResponse = {
    month: string;
    incomeAvailable: number;
    lastMonthOverspent: number;
    forNextMonth: number;
    totalBudgeted: number;
    toBudget: number;
    fromLastMonth: number;
    totalIncome: number;
    totalSpent: number;
    totalBalance: number;
    categoryGroups: Array<{
      id: string;
      name: string;
      is_income: boolean;
      hidden: boolean;
      budgeted: number;
      spent: number;
      balance: number;
      categories: Array<{
        id: string;
        name: string;
        is_income: boolean;
        hidden: boolean;
        group_id: string;
        budgeted: number;
        spent: number;
        balance: number;
        carryover: boolean;
      }>;
    }>;
  };

  export type Month = {
    month: string;
    incomeAvailable: number;
    lastMonthOverspent: number;
    forNextMonth: number;
    totalBudgeted: number;
    toBudget: number;
    fromLastMonth: number;
    totalIncome: number;
    totalSpent: number;
    totalBalance: number;
    categoryGroups: Array<
      Omit<CategoryGroup, 'categories'> & {
        budgeted: number;
        spent: number;
        balance: number;
        categories: Array<
          Category & {
            budgeted: number;
            spent: number;
            balance: number;
            carryover: boolean;
          }
        >;
      }
    >;
  };

  export type Transaction = {
    id: string;
    accountId: string;
    categoryId: string;
    amount: number;
    payeeId: string;
    notes: string | null;
    date: Date;
    importedId: string | null;
    importedPayee: string;
    transferId: string | null;
    cleared: boolean;
    reconciled: boolean;
    subTransactions: string[];
  };
}

type GenericQuery = {
  start: Date;
  end: Date;
};

export enum AccountType {
  CHECKING = 'checking',
  SAVINGS = 'savings',
  CREDIT = 'credit',
  INVESTMENT = 'investment',
  MORTGAGE = 'mortgage',
  DEBT = 'debt',
  OTHER = 'other',
}
