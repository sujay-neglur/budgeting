import OpenAI from 'openai';
import { TBudget } from './types.ts';

const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_API_KEY,
});

function getIndividualTransactionPrompt(
  categoryGroups: TBudget.CategoryGroup[],
  transaction: TBudget.Transaction,
  payees: TBudget.Payee[],
): string {
  let prompt =
    'Given I want to categorize the bank transaction in one of the following categories:\n';
  categoryGroups.forEach((categoryGroup) => {
    categoryGroup.categories.forEach((category) => {
      prompt += `* ${category.name} (${categoryGroup.name}) (ID: "${category.id}") \n`;
    });
  });
  prompt +=
    'Please categorize the following transaction represented as a json: \n';

  const payeeName = payees.find((p) => p.id === transaction.payeeId)?.name;
  prompt += JSON.stringify({
    account: transaction.accountId,
    id: transaction.id,
    amount: Math.abs(transaction.amount),
    type: transaction.amount > 0 ? 'Income' : 'Expense',
    payee: payeeName ? payeeName : transaction.importedPayee,
  });

  prompt +=
    'Return the result as a json with transaction id, category id. Use camel case for property names';

  return prompt;
}

async function generatePrompt1(
  categoryGroups: TBudget.CategoryGroup[],
  transactions: TBudget.Transaction[],
  payees: TBudget.Payee[],
): Promise<void> {
  const prompts = transactions.map((t) =>
    getIndividualTransactionPrompt(categoryGroups, t, payees),
  );

  for (const prompt of prompts) {
    const categorization = await callOpenAI(prompt);

    console.log(categorization);
  }
}

async function generatePrompt(
  categoryGroups: TBudget.CategoryGroup[],
  transactions: TBudget.Transaction[],
  payees: TBudget.Payee[],
): Promise<string> {
  let prompt =
    'Given I want to categorize the bank transactions in following categories:\n';
  categoryGroups.forEach((categoryGroup) => {
    categoryGroup.categories.forEach((category) => {
      prompt += `* ${category.name} (${categoryGroup.name}) (ID: "${category.id}") \n`;
    });
  });

  prompt +=
    'Please categorize the following transactions in the json array: \n';

  prompt += JSON.stringify(
    transactions.map((t) => {
      const payeeName = payees.find((p) => p.id === t.payeeId)?.name;
      return {
        account: t.accountId,
        id: t.id,
        amount: Math.abs(t.amount),
        type: t.amount > 0 ? 'Income' : 'Expense',
        payee: payeeName ? payeeName : t.importedPayee,
      };
    }),
    null,
    2,
  );

  prompt +=
    'Return the result as a json array with transaction id, category id. Also identify transfers in the transactions. If transfer is identified also include from and to account id in object . Use camel case for property names';

  return prompt;
}

async function callOpenAI(prompt: string): Promise<any> {
  const model = 'gpt-3.5-turbo';

  const response = await openai.chat.completions.create({
    model,
    messages: [{ role: 'system', content: prompt }],
    stream: true,
  });

  let guess = '';
  for await (const part of response) {
    guess += part.choices[0].delta.content;
  }

  // let guess = response.choices[0].text;
  guess = guess.replace(/(\r\n|\n|\r)/gm, '');
  guess = guess.replace('undefined', '');

  return JSON.parse(guess);
}

export async function ask(
  categoryGroups: TBudget.CategoryGroup[],
  transactions: TBudget.Transaction[],
  payees: TBudget.Payee[],
): Promise<TBudget.Classification[]> {
  const prompt = await generatePrompt(categoryGroups, transactions, payees);
  console.log(prompt);

  return callOpenAI(prompt);
}

export async function ask1(
  categoryGroups: TBudget.CategoryGroup[],
  transactions: TBudget.Transaction[],
  payees: TBudget.Payee[],
): Promise<void> {
  generatePrompt1(categoryGroups, transactions, payees);
}
