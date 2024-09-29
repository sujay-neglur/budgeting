import moment from 'moment';
import { HttpClient } from '../rest/index.ts';
import {
  SimpleFinAccount,
  SimpleFinResponse,
  SimpleFinTransaction,
} from './types.ts';

export class SimpleFin {
  private client: HttpClient;

  constructor() {
    this.client = new HttpClient(process.env.SIMPLE_FIN_URL);
  }

  async getAccounts(ids?: string[]): Promise<SimpleFinAccount[]> {
    const accountResponse = await this.client.get<{
      accounts: SimpleFinResponse[];
    }>('/accounts', {
      'start-date': moment('1970-01-01').unix(),
      'end-date': moment().unix(),
    });

    const accounts = accountResponse.accounts.map((acc) => ({
      org: {
        ...acc.org,
        sfinUrl: acc.org['sfin-url'],
      },
      name: acc.name,
      availableBalance: acc['available-balance'],
      balance: acc.balance,
      id: acc.id,
      currency: acc.currency,
      balanceDate: moment(acc['balance-date'] * 1000).toDate(),
    }));

    if (ids) {
      return accounts.filter((acc) => ids.includes(acc.id));
    }

    return accounts;
  }

  async getTransactions(
    accountId: string,
    start?: Date,
    end?: Date,
    ids?: string[],
  ): Promise<SimpleFinTransaction[]> {
    const accountResponse = await this.client.get<{
      accounts: SimpleFinResponse[];
    }>('/accounts', {
      'start-date': start ? moment(start).unix() : moment('1970-01-01').unix(),
      'end-date': end ? moment(end).unix() : moment().unix(),
    });

    const account = accountResponse.accounts.find(
      (acc) => acc.id === accountId,
    );

    if (!account) {
      return [];
    }

    const transactions: SimpleFinTransaction[] = account.transactions.map(
      (t) => ({
        id: t.id,
        postedAt: moment(t.posted * 1000).toDate(),
        amount: t.amount,
        description: t.description,
        payee: t.payee,
        memo: t.memo,
        transactedAt: moment(t.transacted_at * 1000).toDate(),
      }),
    );

    if (ids) {
      return transactions.filter((t) => ids.includes(t.id));
    }

    return transactions;
  }
}
