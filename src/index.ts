import 'dotenv/config';
import { SheetsClient } from './integrations/sheets/index.ts';
import { SimpleFin } from './integrations/simplefin/index.ts';
import moment from 'moment';
import { Util } from './config.ts';
import { TransactionRow } from './integrations/sheets/types.ts';

async function start(): Promise<void> {
  const client = new SimpleFin();

  const accounts = await client.getAccounts();

  const transactions = await client.getTransactions(
    accounts[13].id,
    moment('2024-09-04').toDate(),
  );

  const sheet = new SheetsClient();

  const existingTransactions =
    await sheet.getRows<TransactionRow>('transactions');

  const transactionsToCreate = Util.calculateNewTransactions(
    transactions,
    existingTransactions.map((et) =>
      SheetsClient.getRowData<TransactionRow>(et),
    ),
  );

  const rowsToAdd = transactionsToCreate.map((t) =>
    Util.simplefinTransactionToSheetRow(accounts[13].id, t),
  );

  try {
    console.log(existingTransactions.length);
    await Promise.all(
      rowsToAdd.map((r) => sheet.addRow({ type: 'transactions', data: r })),
    );
    console.log((await sheet.getRows<TransactionRow>('transactions')).length);
  } catch (e) {
    console.log(e);
  }
}

start();
