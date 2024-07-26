import OpenAI from 'openai';
import {
  CategoryGroup,
  Transaction,
  TransactionClassification,
} from './types.ts';
import { APIPayeeEntity } from '@actual-app/api/@types/loot-core/server/api-models.js';
import _ from 'lodash';

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey:
    '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',
});

async function generatePrompt(
  categoryGroups: CategoryGroup[],
  transactions: Transaction[],
  payees: APIPayeeEntity[],
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
      const payeeName = payees.find((p) => p.id === t.payee)?.name;
      return {
        account: t.account,
        id: t.id,
        amount: Math.abs(t.amount),
        type: t.amount > 0 ? 'Income' : 'Expense',
        payee: payeeName ? payeeName : t.imported_payee,
      };
    }),
    null,
    2,
  );

  prompt +=
    'Return the result as a json array with transaction id, account id, category id and category name. Do not guess. If you do not know the category say idk. Use camel case for property names';

  return prompt;
}

async function callOpenAI(
  prompt: string,
): Promise<TransactionClassification[]> {
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

  return JSON.parse(guess) as TransactionClassification[];
}

export async function ask(
  categoryGroups: CategoryGroup[],
  transactions: Transaction[],
  payees: APIPayeeEntity[],
): Promise<TransactionClassification[]> {
  const prompt = await generatePrompt(categoryGroups, transactions, payees);
  console.log(prompt);

  return transactions.map((t) => {
    const group = _.sample(
      categoryGroups.filter((group) => group.categories.length),
    );
    const category = _.sample(group.categories);

    return {
      transactionId: t.id,
      accountId: t.account,
      categoryId: category.id,
      categoryName: category.name,
    };
  });
}
