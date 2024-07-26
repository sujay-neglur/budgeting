import { AccountMapping, BudgetAccountTypes } from './config.ts';
import { Account, AccountCreation, SimpleFinAccount } from './types.ts';
import { utils } from '@actual-app/api';

export function accountsToCreate(
  simpleFinAcccounts: SimpleFinAccount[],
  budgetAccounts: Account[],
): AccountCreation[] {
  if (!budgetAccounts.length) {
    return simpleFinAcccounts.map((account) => {
      const type = AccountMapping[account.id].type;
      return {
        id: account.id,
        name: `${account.id}-${account.name}`,
        balance: utils.amountToInteger(account.balance),
        offbudget: !BudgetAccountTypes.includes(type),
      };
    });
  }

  const existingAccounts = new Set(budgetAccounts.map((acc) => acc.name));
  return simpleFinAcccounts
    .filter((account) => !existingAccounts.has(AccountMapping[account.id].name))
    .map((account) => {
      const type = AccountMapping[account.id].type;
      return {
        id: account.id,
        name: `${account.id}-${account.name}`,
        balance: Number(account.balance) * 1000,
        offbudget: !BudgetAccountTypes.includes(type),
      };
    });
}
