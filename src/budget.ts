import * as api from '@actual-app/api';
import { SimpleFin, TBudget } from './types.ts';
import * as fs from 'fs';
import { loadTransactions } from './simpleFin.ts';
import moment from 'moment';

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

  constructor({ budgetId, dataDir, url, password, syncId }: TBudget.Props) {
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

  async loadBudget(force = true): Promise<void> {
    const connection = await this.getConnection();
    if (!this.isBudgetDownloaded()) {
      await connection.downloadBudget(this.syncId);
    }
    await connection.loadBudget(this.id);

    await connection.sync();

    if (force) {
      const accounts = await this.getAccounts();

      await Promise.all(
        accounts.map((acc) => connection.deleteAccount(acc.id)),
      );
    }

    await connection.sync();
  }

  async pullSimpleFin(config: SimpleFin.Query): Promise<SimpleFin.Account[]> {
    return loadTransactions(config);
  }

  async getCategoryGroups(): Promise<TBudget.CategoryGroup[]> {
    const connection = await this.getConnection();

    const categoryGroups = await connection.getCategoryGroups();

    return categoryGroups.map((group) => {
      return {
        id: group.id ?? '',
        hidden: group.hidden ?? false,
        name: group.name,
        categories: group.categories.map((category) => {
          return {
            id: category.id,
            name: category.name,
            isIncome: !!category.is_income,
            hidden: !!category.hidden,
            groupId: category.group_id,
          };
        }),
      };
    });
  }

  async getPayees(ids?: string[]): Promise<TBudget.Payee[]> {
    const connection = await this.getConnection();

    const payees = await connection.getPayees();

    const finalPayees = payees.map((payee) => ({
      ...payee,
      transferId: payee.transfer_acct,
    }));

    if (ids?.length) {
      return finalPayees.filter((payee) => ids.includes(payee.id));
    }

    return finalPayees;
  }

  async getAccounts(): Promise<TBudget.Account[]> {
    const connection = await this.getConnection();

    return connection.getAccounts();
  }

  async createAccount(account: TBudget.AccountCreate): Promise<string> {
    const connection = await this.getConnection();

    const accountId = connection.createAccount(account, account.balance);

    await connection.sync();

    return accountId;
  }

  async createTransactions(
    accountId: string,
    simpleFinTransactions: SimpleFin.Transaction[],
  ): Promise<TBudget.TransactionCreateResponse> {
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
    classifications: TBudget.Classification[],
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

  async getTransactions(
    input: TBudget.TransactionQuery,
  ): Promise<TBudget.Transaction[]> {
    const connection = await this.getConnection();

    const budgetTransactions = await connection.getTransactions(
      input.accountId,
      input.start,
      input.end,
    );

    const transactions: TBudget.Transaction[] = budgetTransactions.map((t) => {
      return {
        accountId: t.account?.toString(),
        amount: api.utils.integerToAmount(t.amount),
        categoryId: t.category?.toString(),
        id: t.id,
        cleared: t.cleared ?? false,
        date: moment(t.date).toDate(),
        importedId: t.imported_id ?? null,
        importedPayee: t.imported_payee ?? '',
        notes: t.notes ?? null,
        payeeId: t.payee?.toString() ?? null,
        reconciled: t.reconciled ?? false,
        subTransactions: t.subtransactions?.map((st) => st.id) ?? [],
        transferId: t.transfer_id ?? null,
      };
    });

    if (input.transactionIds) {
      return transactions.filter((t) => input.transactionIds.includes(t.id));
    }

    return transactions;
  }

  async getMonth(month: string): Promise<TBudget.Month> {
    const connection = await this.getConnection();

    const budgetMonth = (await connection.getBudgetMonth(
      month,
    )) as TBudget.NativeMonthResponse;

    return {
      month: budgetMonth.month,
      incomeAvailable: api.utils.integerToAmount(budgetMonth.incomeAvailable),
      lastMonthOverspent: api.utils.integerToAmount(
        budgetMonth.lastMonthOverspent,
      ),
      forNextMonth: api.utils.integerToAmount(budgetMonth.forNextMonth),
      totalBudgeted: api.utils.integerToAmount(budgetMonth.totalBudgeted),
      toBudget: api.utils.integerToAmount(budgetMonth.toBudget),
      fromLastMonth: api.utils.integerToAmount(budgetMonth.fromLastMonth),
      totalIncome: api.utils.integerToAmount(budgetMonth.totalIncome),
      totalSpent: api.utils.integerToAmount(budgetMonth.totalSpent),
      totalBalance: api.utils.integerToAmount(budgetMonth.totalBalance),
      categoryGroups: budgetMonth.categoryGroups.map((group) => {
        return {
          id: group.id.toString(),
          name: group.name.toString(),
          hidden: !!group.hidden,
          budgeted: api.utils.integerToAmount(group.budgeted) ?? 0,
          spent: api.utils.integerToAmount(group.spent),
          balance: api.utils.integerToAmount(group.balance),
          categories: group.categories.map((cat) => {
            return {
              id: cat.id,
              name: cat.name,
              isIncome: cat.is_income,
              hidden: cat.hidden,
              groupId: cat.group_id,
              budgeted: cat.budgeted,
              spent: cat.spent,
              balance: cat.balance,
              carryover: cat.carryover,
            };
          }),
        };
      }),
    };
  }
}
