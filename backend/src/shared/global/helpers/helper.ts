

export class Helpers {
  static firstLetterToUppercase(str: string): string {
    const valueStr = str.toLowerCase()
    return valueStr
      .split(' ')
      .map((value) => {
        ;`${value.charAt(0).toUpperCase()}${value.slice(1).toLowerCase()}`
      })
      .join(' ')
  }

  static lowerCase(str: string): string {
    return str.toLowerCase()
  }

  static generateRandomNums(length: number): number {
    const characters = '0123456789'
    let result = ''
    const characterLength = characters.length
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characterLength))
    }
    return parseInt(result, 10)
  }
}