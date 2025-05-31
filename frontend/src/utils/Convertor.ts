
export function convertIfInteger(num: number) {
    if (num % 1 === 0) {
      return Math.floor(num);
    }
    return num;
}
