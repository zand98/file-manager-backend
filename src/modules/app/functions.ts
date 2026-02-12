import { NotAcceptableException } from '@nestjs/common';

export async function check(array: Array<any>): Promise<any> {
  let result = {};
  for (const record of array) {
    if (record['id']) {
      const data = await record['service'].get(record['id']);

      if (!data) {
        throw new NotAcceptableException(record['message']);
      }
      result[record['key']] = data;
    }
  }
  return result;
}
