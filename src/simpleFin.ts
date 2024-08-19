import axios from 'axios';
import { SimpleFin } from './types.ts';
import moment from 'moment';

export async function loadTransactions({
  start,
  end,
  onlyData,
  pending,
  filterAccounts,
}: SimpleFin.Query): Promise<SimpleFin.Account[]> {
  try {
    const response = await axios.get<{
      error: Error[];
      accounts: SimpleFin.Account[];
    }>(`${process.env.SIMPLE_FIN_URL}/accounts`, {
      params: {
        'start-date': moment(start).unix(),
        'end-date': moment(end).unix(),
        pending,
      },
    });

    if (onlyData) {
      return response.data.accounts.filter(
        (account) => account.transactions.length,
      );
    }

    if (filterAccounts) {
      return response.data.accounts.filter((account) =>
        filterAccounts.includes(account.id),
      );
    }

    return response.data.accounts;
  } catch (e) {
    console.log(e);
    return [];
  }
}
