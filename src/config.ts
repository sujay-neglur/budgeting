import { AccountType, TBudget } from './types.ts';
import 'dotenv/config';

const config: TBudget.Props = {
  budgetId: process.env.BUDGET_ID,
  dataDir: process.env.DATA_DIR,
  password: process.env.PASSWORD,
  url: process.env.URL,
  syncId: process.env.SYNC_ID,
};

const AccountMapping: Record<string, { name: string; type: AccountType }> = {
  'ACT-1803cbde-16e6-4e29-9c96-ac49c7f543f5': {
    name: 'RBC Enhanced Savings',
    type: AccountType.CHECKING,
  },
  'ACT-fdf3ee50-5305-48c4-b1da-9e2b9ca2ce2a': {
    name: 'FHSA',
    type: AccountType.INVESTMENT,
  },
  'ACT-42de842c-fd2d-487c-a5f4-ea00eb7cdf33': {
    name: 'Managed TFSA',
    type: AccountType.INVESTMENT,
  },
  'ACT-95e9f768-0a5a-4494-81d1-99687a9606fa': {
    name: 'RBC RRSP',
    type: AccountType.INVESTMENT,
  },
  'ACT-ed986c6d-dc1d-41c3-acbb-c9ab1cab8afc': {
    name: 'Managed Group RRSP Trolley',
    type: AccountType.INVESTMENT,
  },
  'ACT-e0852e39-2e15-4977-9f4c-dc18cb1c3a55': {
    name: 'Credit Card',
    type: AccountType.CREDIT,
  },
  'ACT-d2b721f8-2341-4e7c-b737-ad1f6a04ef22': {
    name: 'Salary',
    type: AccountType.CHECKING,
  },
  'ACT-7797486e-fbd9-4473-b86a-69232e38a0a5': {
    name: 'EQ Bank Card',
    type: AccountType.CHECKING,
  },
  'ACT-86cd8d59-1c57-4c81-a067-3af731e401a8': {
    name: 'Self Directed RRSP',
    type: AccountType.INVESTMENT,
  },
  'ACT-92387868-1bf3-4848-872b-4e8c5d98e511': {
    name: 'Emergency',
    type: AccountType.SAVINGS,
  },
};

const BudgetAccountTypes = [AccountType.CHECKING, AccountType.CREDIT];

export const CategoryAllocations: Record<string, number> = {};

export { config, AccountMapping, BudgetAccountTypes };
