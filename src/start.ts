import moment from 'moment';
import { Budget } from './budget.ts';
import { config, AccountMapping } from './config.ts';
import { accountsToCreate } from './util.ts';
import { SimpleFinAccount, TransactionClassification } from './types.ts';
import { ask } from './openai.ts';

async function createNecessaryAccounts(
  budget: Budget,
  simpleFinData: SimpleFinAccount[],
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
      budget.createAccount(
        {
          id: account.id,
          name: AccountMapping[account.id].name,
          type: AccountMapping[account.id].type,
          offbudget: account.offbudget,
        },
        account.balance,
      ),
    ),
  );
}

async function convertSimpleFinTransactionAndPush(
  budget: Budget,
  simpleFinData: SimpleFinAccount[],
): Promise<string[]> {
  const budgetAccounts = await budget.getAccounts();

  const createdTransactions = await Promise.all(
    simpleFinData.map(async (simpleFinAccount) => {
      const accountName = AccountMapping[simpleFinAccount.id].name;
      const accountId = budgetAccounts.find(
        (acc) => acc.name === accountName,
      ).id;

      const { added } = await budget.createTransactions(
        accountId,
        simpleFinAccount.transactions,
      );

      return added;
    }),
  );

  return createdTransactions.flatMap((t) => t);
}

async function categorizeTransactions(
  budget: Budget,
  transactionIds: string[],
  simpleFinData: SimpleFinAccount[],
): Promise<TransactionClassification[]> {
  if (transactionIds.length) {
    const budgetAccounts = await budget.getAccounts();
    const categoryGroups = await budget.getCategoryGroups();
    const payees = await budget.getPayees();

    const transactionPromises = simpleFinData.map(async (simpleFinAccount) => {
      const accountName = AccountMapping[simpleFinAccount.id].name;
      const accountId = budgetAccounts.find(
        (acc) => acc.name === accountName,
      ).id;
      const transactions = await budget.getTransactions({
        accountId,
        transactionIds,
        start: moment('2024-07-01').toDate(),
        end: moment().endOf('day').toDate(),
      });

      return transactions;
    });
    const transactionsWithAccountIds = await Promise.all(transactionPromises);

    return ask(
      categoryGroups,
      transactionsWithAccountIds.flatMap((t) => t),
      payees,
    );
    // for (const simpleFinAccount of simpleFinData) {
    //   const accountName = AccountMapping[simpleFinAccount.id].name;
    //   const accountId = budgetAccounts.find(
    //     (acc) => acc.name === accountName,
    //   ).id;

    //   const transactions = await budget.getTransactions({
    //     accountId,
    //     transactionIds,
    //     start: moment('2024-07-01').toDate(),
    //     end: moment().endOf('day').toDate(),
    //   });

    //   await testOpenRouter(categoryGroups, transactions, payees);
    // }
  }

  return [];
}

async function updateTransactionCategories(
  budget: Budget,
  classifications: TransactionClassification[],
): Promise<void> {
  await budget.updateTransactionCategories(classifications);
}

async function start(): Promise<void> {
  let budget: Budget;
  try {
    budget = new Budget({
      budgetId: config.budgetId,
      dataDir: config.dataDir,
      url: config.url,
      password: config.password,
      syncId: config.syncId,
    });

    const simpleFinData = await budget.pullSimpleFin({
      start: moment('2024-07-01').unix(),
      end: moment().unix(),
      pending: 1,
      filterAccounts: Object.keys(AccountMapping),
    });

    await createNecessaryAccounts(budget, simpleFinData);
    const addedTransactions = await convertSimpleFinTransactionAndPush(
      budget,
      simpleFinData,
    );

    const classifications = await categorizeTransactions(
      budget,
      addedTransactions,
      simpleFinData,
    );

    await updateTransactionCategories(budget, classifications);
  } catch (e) {
    console.log(e);
  } finally {
    await budget.terminateConnection();
  }
}

start();
// sync everything from server
// fetch simplefin data
// decide if new accounts need to be created
// create transactions and push to actual budget
// categorize transactions
