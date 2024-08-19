import { AccountMapping, BudgetAccountTypes } from './config.ts';
import { TBudget, SimpleFin, AccountType } from './types.ts';
import { utils } from '@actual-app/api';

export function accountsToCreate(
  simpleFinAcccounts: SimpleFin.Account[],
  budgetAccounts: TBudget.Account[],
): TBudget.AccountCreate[] {
  if (!budgetAccounts.length) {
    return simpleFinAcccounts.map((account) => {
      const type = AccountMapping[account.id].type;
      return {
        id: account.id,
        name: `${account.id}-${account.name}`,
        balance: utils.amountToInteger(account.balance),
        offbudget: !BudgetAccountTypes.includes(type),
        type,
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
        type,
      };
    });
}

export function identifyTransfers(
  transactions: SimpleFin.TransactionWithAccountId[],
  accounts: TBudget.Account[],
  payees: TBudget.Payee[],
): SimpleFin.TransactionWithAccountId[] {
  const transfers: SimpleFin.TransactionWithAccountId[] = [];

  const sortedTransactions = transactions.sort(
    (a, b) => Number(a.amount) - Number(b.amount),
  );

  let i = 0,
    j = sortedTransactions.length - 1;

  while (i < j) {
    const left = sortedTransactions[i];
    const right = sortedTransactions[j];
    const sum = Number(left.amount) + Number(right.amount);

    const sourceAccount = AccountMapping[left.accountId];

    if (
      sum === 0 &&
      left.accountId !== right.accountId &&
      sourceAccount.type !== AccountType.CREDIT
    ) {
      transfers.push({
        ...left,
        accountId: getBudgetAccountIdFromSimpleFinAccountId(
          accounts,
          left.accountId,
        ),
        payee: getPayeeIdFromSimpleFinAccountId(
          accounts,
          payees,
          right.accountId,
        ),
      });

      transfers.push({
        ...right,
        accountId: getBudgetAccountIdFromSimpleFinAccountId(
          accounts,
          right.accountId,
        ),
        payee: getPayeeIdFromSimpleFinAccountId(
          accounts,
          payees,
          right.accountId,
        ),
      });
      i++;
      j--;
    } else if (sum < 0) {
      i++;
    } else {
      j--;
    }
  }

  return transfers;
}

export function getBudgetAccountIdFromSimpleFinAccountId(
  budgetAccounts: TBudget.Account[],
  simpleFinAccountId: string,
): string {
  const connectedName = AccountMapping[simpleFinAccountId].name;

  const account = budgetAccounts.find((ba) => ba.name === connectedName);

  return account.id;
}

export function getPayeeIdFromSimpleFinAccountId(
  budgetAccounts: TBudget.Account[],
  payees: TBudget.Payee[],
  accountId: string,
): string {
  const budgetAccountId = getBudgetAccountIdFromSimpleFinAccountId(
    budgetAccounts,
    accountId,
  );

  const payee = payees.find((p) => p.transferId === budgetAccountId);

  return payee?.id ?? '';
}

export function getPayeeIdFromBudgetAccountId(
  payees: TBudget.Payee[],
  accountId: string,
): string {
  const payee = payees.find((p) => p.transferId === accountId);

  return payee?.id ?? '';
}
