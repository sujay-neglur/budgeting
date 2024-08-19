import moment from 'moment';
import { loadTransactions } from './simpleFin.ts';
import { AccountMapping, config } from './config.ts';
import { accountsToCreate, identifyTransfers } from './util.ts';
import { Budget } from './budget.ts';
import * as api from '@actual-app/api';
import { SimpleFin } from './types.ts';

async function createNecessaryAccounts(
  budget: Budget,
  simpleFinData: SimpleFin.Account[],
): Promise<void> {
  await budget.loadBudget();
  console.log(
    (await budget.getCategoryGroups()).map((group) => group.categories),
  );
  const existingBudgetAccounts = await budget.getAccounts();
  const necessarayAccounts = accountsToCreate(
    simpleFinData,
    existingBudgetAccounts,
  );

  await Promise.all(
    necessarayAccounts.map((account) =>
      budget.createAccount({
        id: account.id,
        name: AccountMapping[account.id].name,
        type: AccountMapping[account.id].type,
        offbudget: account.offbudget,
        balance: account.balance,
      }),
    ),
  );
}

async function test(): Promise<void> {
  const budget = new Budget(config);

  const connection = await budget.getConnection();

  await budget.loadBudget();

  const simpleFinData = await loadTransactions({
    start: moment('2024-07-01').toDate(),
    end: moment().toDate(),
    pending: 1,
    filterAccounts: Object.keys(AccountMapping),
  });

  await createNecessaryAccounts(budget, simpleFinData);

  const budgetAccounts = await budget.getAccounts();

  const payees = await budget.getPayees();

  const transferPayees = payees.filter((p) => p.transferId);

  console.log(transferPayees);

  const simpleFinTransactions = simpleFinData
    .map((account) =>
      account.transactions.map((t) => ({ ...t, accountId: account.id })),
    )
    .flatMap((t) => t);

  const transfers = identifyTransfers(
    simpleFinTransactions,
    budgetAccounts,
    payees,
  );

  const transfersByAccountId = transfers.reduce(
    (prev, curr) => {
      if (prev[curr.accountId]) {
        prev[curr.accountId].push(curr);
      } else {
        prev[curr.accountId] = [curr];
      }

      return prev;
    },
    {} as Record<string, SimpleFin.TransactionWithAccountId[]>,
  );

  for (const [account, transactions] of Object.entries(transfersByAccountId)) {
    const transactionsToCreate = transactions.map((t) => {
      return {
        date: new Date(t.transacted_at * 1000),
        amount: api.utils.amountToInteger(t.amount),
        imported_id: t.id,
        payee: t.payee,
        notes: t.description,
      };
    });

    const result = await connection.importTransactions(
      account,
      transactionsToCreate,
    );
    console.log('Added', result);
  }

  await budget.terminateConnection();
}

test();

// step 1 - get data from simple fin
// step 2 - new accounts?  -> skip for now
// step 3 - calculate transfers.
// step 4 - create transfer transactions
// step 5 - create non transfer transactions
// step 6 - categorize non transfer transactions
