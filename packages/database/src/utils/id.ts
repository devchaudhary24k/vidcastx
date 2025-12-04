import { customAlphabet } from "nanoid";

const alphabet =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const generate = customAlphabet(alphabet, 21);

export function generateId(prefix?: string): string {
  return prefix ? `${prefix}_${generate()}` : generate();
}
