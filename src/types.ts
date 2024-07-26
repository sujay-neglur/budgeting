import { APIAccountEntity } from '@actual-app/api/@types/loot-core/server/api-models.js';
import { TransactionEntity } from '@actual-app/api/@types/loot-core/types/models/transaction.js';

export type BudgetProps = {
  url: string;
  password: string;
  dataDir: string;
  budgetId: string;
  syncId: string;
};

export type SimpleFinTransactionConfig = {
  start?: number;
  end?: number;
  onlyData?: boolean;
  pending?: 0 | 1;
  filterAccounts?: string[];
};

export interface SimpleFinAccount {
  org: Org;
  id: string;
  name: string;
  currency: string;
  balance: string;
  'available-balance': string;
  'balance-date': number;
  transactions: SimpleFinTransaction[];
}

export interface Org {
  domain: string;
  name: string;
  'sfin-url': string;
  url: string;
  id: string;
}

export interface SimpleFinTransaction {
  id: string;
  posted: number;
  amount: string;
  description: string;
  payee: string;
  memo: string;
  transacted_at: number;
}

export interface Category {
  id?: string;
  name: string;
  is_income?: boolean;
  cat_group?: string;
  sort_order?: number;
  tombstone?: boolean;
  hidden?: boolean;
}

export interface CategoryGroup {
  id?: string;
  name: string;
  is_income?: boolean;
  sort_order?: number;
  tombstone?: boolean;
  hidden?: boolean;
  categories?: Category[];
}

export interface Payee {
  id: string;
  name: string;
  transfer_acct?: string;
  tombstone?: boolean;
}

export type Transaction = TransactionEntity & {
  payee: string;
  account: string;
};

export type Account = APIAccountEntity;

export interface CreateTransactionInput {
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
}

export type AccountCreation = {
  id: string;
  name: string;
  balance: number;
  offbudget: boolean;
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

export type TransactionClassification = {
  transactionId: string;
  accountId: string;
  categoryId: string;
  categoryName: string;
};

export type BudgetMonth = {
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
    CategoryGroup & {
      budgeted: number;
      spent: number;
      balance: number;
      categories: Array<
        Category & {
          balance: number;
          budgeted: number;
          carryover: boolean;
          group_id: string;
          spent: number;
        }
      >;
    }
  >;
};
