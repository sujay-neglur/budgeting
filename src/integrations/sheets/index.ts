import { JWT } from 'google-auth-library';
import { GoogleSpreadsheet, GoogleSpreadsheetRow } from 'google-spreadsheet';
import { Util } from '../../config.ts';
import { AddRowInput, TransactionColumns, TransactionRow } from './types.ts';

export class SheetsClient {
  private document: GoogleSpreadsheet;

  constructor() {
    const auth = new JWT({
      email: process.env.SHEETS_EMAIL,
      key: process.env.SHEETS_KEY,
      scopes: process.env.SHEETS_SCOPES.split(','),
    });

    this.document = new GoogleSpreadsheet(process.env.MAIN_SHEET_ID, auth);
  }

  static getRowData<T>(row: GoogleSpreadsheetRow): T {
    return row.toObject() as T;
  }

  private async loadInfo(): Promise<void> {
    if (!process.env.SHEET_INFO) {
      await this.document.loadInfo();
      process.env.SHEET_INFO = 'true';
    }
  }

  private async addTransactionRow(row: TransactionRow): Promise<void> {
    await this.loadInfo();

    const config = Util.SheetConfig.transactions;
    const sheet = this.document.sheetsById[config.id];

    const rowCount = (await this.getRows<TransactionRow>('transactions'))
      .length;

    const startRow = rowCount + config.headerRowNumber;

    const cells = [];

    const dateCell = sheet.getCell(startRow, 1);
    dateCell.value = row[TransactionColumns.DATE];

    cells.push(dateCell);

    const outflowCell = sheet.getCell(startRow, 2);
    outflowCell.value = Math.abs(Number(row[TransactionColumns.OUTFLOW]));
    cells.push(outflowCell);

    const inflowCell = sheet.getCell(startRow, 3);
    inflowCell.value = row[TransactionColumns.INFLOW];
    cells.push(inflowCell);

    const accountCell = sheet.getCell(startRow, 5);
    accountCell.value = row[TransactionColumns.ACCOUNT];
    cells.push(accountCell);

    const memoCell = sheet.getCell(startRow, 6);
    memoCell.value = row[TransactionColumns.MEMO];
    cells.push(memoCell);

    const statusCell = sheet.getCell(startRow, 7);
    statusCell.value = row[TransactionColumns.STATUS];
    cells.push(statusCell);

    const idCell = sheet.getCell(startRow, 8);
    statusCell.value = row[TransactionColumns.ID];
    cells.push(idCell);

    await sheet.saveCells(cells);
  }

  async getRows<T>(
    type: keyof typeof Util.SheetConfig,
  ): Promise<GoogleSpreadsheetRow<T>[]> {
    const config = Util.SheetConfig[type];
    const sheet = this.document.sheetsById[config.id];

    await sheet.loadHeaderRow(config.headerRowNumber);
    await sheet.setHeaderRow(sheet.headerValues, config.headerRowNumber);

    return sheet.getRows<T>();
  }

  async addRow(input: AddRowInput): Promise<void> {
    if (input.type === 'transactions') {
      await this.addTransactionRow(input.data);
    }
  }
}
