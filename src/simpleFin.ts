import axios from 'axios';
import { SimpleFinAccount, SimpleFinTransactionConfig } from './types.ts';

const url =
  'https://0116D9F94D9A73CA88CC4722CE522EC8AE2FA3AF4A508CD04B9BE34DF7FD4DCE:86258BB7644796070400744CA0426BF84C074C67262E9631403D01CD8E17F2C7@beta-bridge.simplefin.org/simplefin';

export async function loadTransactions({
  start,
  end,
  onlyData,
  pending,
  filterAccounts,
}: SimpleFinTransactionConfig): Promise<SimpleFinAccount[]> {
  try {
    const response = await axios.get<{
      error: Error[];
      accounts: SimpleFinAccount[];
    }>(`${url}/accounts`, {
      params: {
        'start-date': start,
        'end-date': end,
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
