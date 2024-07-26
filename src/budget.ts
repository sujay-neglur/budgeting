import * as api from '@actual-app/api';
import {
  SimpleFinAccount,
  BudgetProps,
  CategoryGroup,
  SimpleFinTransaction,
  SimpleFinTransactionConfig,
  Transaction,
  Account,
  AccountType,
  TransactionClassification,
} from './types.ts';
import * as fs from 'fs';
import { loadTransactions } from './simpleFin.ts';
import { APIPayeeEntity } from '@actual-app/api/@types/loot-core/server/api-models.js';

export class Budget {
  private static connected = false;
  private budgetId: string;
  private dataDir: string;
  private url: string;
  private password: string;
  private budgetSyncId: string;

  public get id(): string {
    return this.budgetId;
  }

  public get serverUrl(): string {
    return this.url;
  }

  public get dataUrl(): string {
    return this.dataDir;
  }

  public get syncId(): string {
    return this.budgetSyncId;
  }

  constructor({ budgetId, dataDir, url, password, syncId }: BudgetProps) {
    this.budgetId = budgetId;
    this.password = password;
    this.url = url;
    this.dataDir = dataDir;
    this.budgetSyncId = syncId;
  }

  private isBudgetDownloaded(): boolean {
    return !!fs.readdirSync(this.dataDir).length;
  }

  async terminateConnection(): Promise<void> {
    console.log('Terminating connection');
    await api.shutdown();
  }

  async getConnection(): Promise<typeof api> {
    if (!Budget.connected) {
      await api.init({
        dataDir: this.dataDir,
        serverURL: this.url,
        password: this.password,
      });
      Budget.connected = true;
    }
    return api;
  }

  async loadBudget(): Promise<void> {
    const connection = await this.getConnection();
    if (!this.isBudgetDownloaded()) {
      await connection.downloadBudget(this.syncId);
    }
    await connection.loadBudget(this.id);

    await connection.sync();

    const accounts = await this.getAccounts();

    await Promise.all(accounts.map((acc) => connection.deleteAccount(acc.id)));

    await connection.sync();
  }

  async pullSimpleFin(
    config: SimpleFinTransactionConfig,
  ): Promise<SimpleFinAccount[]> {
    return loadTransactions(config);
  }

  async getCategoryGroups(): Promise<CategoryGroup[]> {
    const connection = await this.getConnection();

    return connection.getCategoryGroups();
  }

  async getPayees(ids?: string): Promise<APIPayeeEntity[]> {
    const connection = await this.getConnection();

    const payees = await connection.getPayees();

    if (ids?.length) {
      return payees.filter((payee) => ids.includes(payee.id));
    }

    return payees;
  }

  async getAccounts(): Promise<Account[]> {
    const connection = await this.getConnection();

    return connection.getAccounts();
  }

  async createAccount(
    account: {
      id: string;
      name: string;
      type: AccountType;
      offbudget: boolean;
    },
    balance: number,
  ): Promise<string> {
    const connection = await this.getConnection();

    const accountId = connection.createAccount(account, balance);

    await connection.sync();

    return accountId;
  }

  async createTransactions(
    accountId: string,
    simpleFinTransactions: SimpleFinTransaction[],
  ): Promise<{
    errors?: {
      message: string;
    }[];
    added: string[];
    updated: string[];
  }> {
    const connection = await this.getConnection();
    await connection.sync();
    const result = await connection.importTransactions(
      accountId,
      simpleFinTransactions.map((st) => ({
        date: new Date(st.transacted_at * 1000),
        amount: api.utils.amountToInteger(st.amount),
        imported_id: st.id,
        payee_name: st.payee,
        notes: st.description,
      })),
    );

    await connection.sync();

    return result;
  }

  async updateTransactionCategories(
    classifications: TransactionClassification[],
  ): Promise<void> {
    const connection = await this.getConnection();

    await connection.batchBudgetUpdates(() => {
      return classifications.map((c) =>
        connection.updateTransaction(c.transactionId, {
          category: c.categoryId,
        }),
      );
    });
  }

  async getTransactions(input: {
    accountId: string;
    transactionIds?: string[];
    start: Date;
    end: Date;
  }): Promise<Transaction[]> {
    const connection = await this.getConnection();

    const transactions = await connection.getTransactions(
      input.accountId,
      input.start,
      input.end,
    );

    if (input.transactionIds) {
      return transactions.filter((t) =>
        input.transactionIds.includes(t.id),
      ) as Transaction[];
    }

    return transactions as Transaction[];
  }
}

//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
//"https://openrouter.ai/api/v1"
