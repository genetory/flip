declare module "lunar-javascript" {
  interface EightChar {
    getYear(): string;
    getMonth(): string;
    getDay(): string;
    getTime(): string;
  }

  interface LunarDate {
    getEightChar(): EightChar;
    toString(): string;
    getSolar(): SolarDate;
  }

  interface SolarDate {
    getLunar(): LunarDate;
    toString(): string;
  }

  interface SolarStatic {
    fromYmd(year: number, month: number, day: number): SolarDate;
    fromYmdHms(year: number, month: number, day: number, hour: number, minute: number, second: number): SolarDate;
  }

  interface LunarStatic {
    fromYmd(year: number, month: number, day: number): LunarDate;
    fromYmdHms(year: number, month: number, day: number, hour: number, minute: number, second: number): LunarDate;
  }

  const Solar: SolarStatic;
  const Lunar: LunarStatic;
  export { Solar, Lunar };
  const _default: { Solar: SolarStatic; Lunar: LunarStatic };
  export default _default;
}
