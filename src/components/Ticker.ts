import type { Any } from "../types.ts";

type TickCallback = (stats: TickStats, ticker: Ticker) => Any;
type RevocableProxy<T> = { proxy: T; revoke: () => void };
type StatProxyArray = [RevocableProxy<TickStats>, RevocableProxy<TickStats["timing"]>];
interface TickStats {
  /**
   * The time delta between the last tick execution and the current one.
   */
  dt: number;

  /**
   * The ticks-per-second or how many times the tick would be executed in
   * one second assuming that `TickStats["dt"]` remains constant.
   */
  tps: number;

  /**
   * The average tps derived from the ten most recent `TickStats["tps"]`
   * values. It typically yields a better representation of the stability
   * of the execution interval of the tick and how fast it feels.
   */
  atps: number;

  /**
   * The number of ticks-per-second that the ticker will try to maintain for
   * this tick. This value will probably never be equal to `TickStats["tps"]`
   * or `TickStats["atps"]`.
   */
  targetTps: number;

  /**
   * A record of timing data of the executions of the tick.
   */
  timing: {
    start: number;
    run: number;
    end: number;
    delta: number;
  };
}

const returnFalse = () => false;
const now = performance.now.bind(performance);
const throwError = (error: unknown) => {
  throw error;
};
const tickShouldRun = (stats: TickStats, currentTime: number, always = false) => {
  if (always) return true;

  const interval = 1000 / stats.targetTps;
  const diff = currentTime - stats.timing.start;

  if (diff >= interval) return true;
  if (Math.abs(diff) <= Ticker.DELTA_FLUCTUATION) return true;
  return false;
};

class Ticker {
  static DELTA_FLUCTUATION = 1.35;
  static get defaultTickStats(): TickStats {
    return {
      dt: 0,
      tps: 0,
      atps: 0,
      targetTps: 0,
      timing: {
        start: 0,
        run: 0,
        end: 0,
        delta: 0,
      },
    };
  }

  running = false;
  interval: number | null = null;
  #selfid: string = crypto.randomUUID();

  ticks = new Map<string, TickStats>();
  callbacks = new Map<string, Set<TickCallback>>();
  statProxies = new Map<string, StatProxyArray>();

  stats: TickStats;

  tick = () => {
    for (const [name, stats] of this.ticks) {
      const _now = now();
      if (!tickShouldRun(stats, _now, name === this.#selfid)) continue;

      const callbacks = this.callbacks.get(name);

      stats.timing.delta = _now - stats.timing.start;
      stats.timing.start = _now;

      if (callbacks) {
        for (const callback of callbacks) {
          try {
            const stats = this.ticks.get(name);
            callback.call(null, stats || Ticker.defaultTickStats, this);
          } catch (error) {
            setTimeout(throwError, 1, error);
          }
        }
      }

      stats.timing.end = now();
      stats.timing.run = stats.timing.end - stats.timing.start;
      stats.tps = 1000 / stats.timing.delta;
      stats.dt = stats.timing.delta;
    }
  };

  constructor() {
    this.addTick(this.#selfid, 0);

    const stats = this.statProxies.get(this.#selfid);
    if (!stats) throw new ReferenceError("Failed to acquire stat proxy.");
    this.stats = stats[0].proxy;
  }

  start(): Ticker {
    if (this.running) return this;

    const _now = now();
    this.running = true;
    this.interval = setInterval(this.tick, 1);
    for (const [_tickName, stats] of this.ticks) {
      stats.timing.start = _now;
    }

    return this;
  }

  pause(): Ticker {
    if (!this.running) return this;

    clearInterval(this.interval ?? void 0);
    this.running = false;
    this.interval = null;

    return this;
  }

  addTick(tickName: string, tps: number): Ticker {
    type TK = keyof TickStats;
    type TTK = keyof TickStats["timing"];

    if (!(tickName && typeof tickName === "string")) throw new TypeError("Invalid tick name.");
    if (!(Number.isFinite(tps) && Math.sign(tps) !== -1)) throw new TypeError("Invalid tps.");
    if (this.ticks.has(tickName)) throw new Error("The specified name is already in use.");

    const stats: TickStats = Ticker.defaultTickStats;
    const proxies: StatProxyArray = [
      Proxy.revocable(stats, {
        get: (target, prop: TK) => (prop === "timing" ? proxies[1].proxy : target[prop]),
        set: returnFalse,
        defineProperty: returnFalse,
        deleteProperty: returnFalse,
        setPrototypeOf: returnFalse,
        preventExtensions: returnFalse,
      }),
      Proxy.revocable(stats.timing, {
        get: (target, prop: TTK) => target[prop],
        set: returnFalse,
        defineProperty: returnFalse,
        deleteProperty: returnFalse,
        setPrototypeOf: returnFalse,
        preventExtensions: returnFalse,
      }),
    ];

    this.ticks.set(tickName, stats);
    this.callbacks.set(tickName, new Set());
    this.statProxies.set(tickName, proxies);
    stats.targetTps = tps;
    return this;
  }

  removeTick(tickName: string): boolean {
    const proxies = this.statProxies.get(tickName);
    if (!proxies) return false;

    proxies[0].revoke();
    proxies[1].revoke();

    this.ticks.delete(tickName);
    this.callbacks.delete(tickName);
    this.statProxies.delete(tickName);

    return true;
  }

  addCallback(tickName: string, callback: TickCallback): Ticker {
    const callbacks = this.callbacks.get(tickName);
    if (!callbacks) {
      throw new ReferenceError("Failed to acquire callback set. Unknown tick name.");
    }

    if (typeof callback !== "function") {
      throw new TypeError(
        `Invalid tick callback. Expected a value of type \`function\`, received \`${typeof callback}\`.`,
      );
    }

    callbacks.add(callback);
    return this;
  }

  removeCallback(tickName: string, callback: TickCallback): boolean {
    return this.callbacks.get(tickName)?.delete(callback) || false;
  }
}

export default Ticker;
