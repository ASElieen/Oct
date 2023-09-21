

export class Helpers {
  static firstLetterToUppercase(str: string): string {
    const valueStr = str.toLowerCase()
    return valueStr.toLowerCase().replace(/( |^)[a-z]/g, (L) => L.toUpperCase())
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

  static parseJSON(prop: any) {
    //如果redis中不是stringnify的数据就直接return
    try {
      return JSON.parse(prop)
    } catch (error) {
      return prop
    }
  }

  static isDataUrl(value: string): boolean {
    const regex = /^\s*data:([a-z]+\/[a-z0-9-+.]+(;[a-z-]+=[a-z0-9-]+)?)?(;base64)?,([a-z0-9!$&',()*+;=\-._~:@\\/?%\s]*)\s*$/i
    return regex.test(value)
  }

  static shuffle(list: string[]): string[] {
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[list[i], list[j]] = [list[j], list[i]]
    }
    return list
  }

  static escapeRegex(text: string): string {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')
  }
}