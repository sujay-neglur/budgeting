import { Util } from '../../config.ts';

export type SimpleFinResponse = {
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
  transactions: SimpleFinTransactionResponse[];
};

export type SimpleFinAccount = Omit<
  SimpleFinResponse,
  'org' | 'available-balance' | 'balance-date' | 'transactions'
> & {
  org: Omit<SimpleFinResponse['org'], 'sfin-url'> & { sfinUrl: string };
  availableBalance: string;
  balanceDate: Date;
};

export type SimpleFinTransactionResponse = {
  id: (typeof Util.AccountIds)[number];
  posted: number;
  amount: string;
  description: string;
  payee: string;
  memo: string;
  transacted_at: number;
};

export type SimpleFinTransaction = Omit<
  SimpleFinTransactionResponse,
  'transacted_at' | 'posted'
> & {
  postedAt: Date;
  transactedAt: Date;
};

export enum AccountType {
  CHECKING = 'CHECKING',
  CREDIT = 'CREDIT',
  NET_WORTH = 'NET_WORTH',
  SAVING = 'SAVING',
}
