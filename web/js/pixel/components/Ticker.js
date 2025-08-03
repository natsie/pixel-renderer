var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _Ticker_selfid;
const returnFalse = () => false;
const now = performance.now.bind(performance);
const throwError = (error) => {
    throw error;
};
const tickShouldRun = (stats, currentTime, always = false) => {
    if (always)
        return true;
    const interval = 1000 / stats.targetTps;
    const diff = currentTime - stats.timing.start;
    if (diff >= interval)
        return true;
    if (Math.abs(diff) <= Ticker.DELTA_FLUCTUATION)
        return true;
    return false;
};
class Ticker {
    static get defaultTickStats() {
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
    constructor() {
        this.running = false;
        this.interval = null;
        _Ticker_selfid.set(this, crypto.randomUUID());
        this.ticks = new Map();
        this.callbacks = new Map();
        this.statProxies = new Map();
        this.tick = () => {
            for (const [name, stats] of this.ticks) {
                const _now = now();
                if (!tickShouldRun(stats, _now, name === __classPrivateFieldGet(this, _Ticker_selfid, "f")))
                    continue;
                const callbacks = this.callbacks.get(name);
                stats.timing.delta = _now - stats.timing.start;
                stats.timing.start = _now;
                if (callbacks) {
                    for (const callback of callbacks) {
                        try {
                            const stats = this.ticks.get(name);
                            callback.call(null, stats || Ticker.defaultTickStats, this);
                        }
                        catch (error) {
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
        this.addTick(__classPrivateFieldGet(this, _Ticker_selfid, "f"), 0);
        const stats = this.statProxies.get(__classPrivateFieldGet(this, _Ticker_selfid, "f"));
        if (!stats)
            throw new ReferenceError("Failed to acquire stat proxy.");
        this.stats = stats[0].proxy;
    }
    start() {
        if (this.running)
            return this;
        const _now = now();
        this.running = true;
        this.interval = setInterval(this.tick, 1);
        for (const [_tickName, stats] of this.ticks) {
            stats.timing.start = _now;
        }
        return this;
    }
    pause() {
        var _a;
        if (!this.running)
            return this;
        clearInterval((_a = this.interval) !== null && _a !== void 0 ? _a : void 0);
        this.running = false;
        this.interval = null;
        return this;
    }
    addTick(tickName, tps) {
        if (!(tickName && typeof tickName === "string"))
            throw new TypeError("Invalid tick name.");
        if (!(Number.isFinite(tps) && Math.sign(tps) !== -1))
            throw new TypeError("Invalid tps.");
        if (this.ticks.has(tickName))
            throw new Error("The specified name is already in use.");
        const stats = Ticker.defaultTickStats;
        const proxies = [
            Proxy.revocable(stats, {
                get: (target, prop) => (prop === "timing" ? proxies[1].proxy : target[prop]),
                set: returnFalse,
                defineProperty: returnFalse,
                deleteProperty: returnFalse,
                setPrototypeOf: returnFalse,
                preventExtensions: returnFalse,
            }),
            Proxy.revocable(stats.timing, {
                get: (target, prop) => target[prop],
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
    removeTick(tickName) {
        const proxies = this.statProxies.get(tickName);
        if (!proxies)
            return false;
        proxies[0].revoke();
        proxies[1].revoke();
        this.ticks.delete(tickName);
        this.callbacks.delete(tickName);
        this.statProxies.delete(tickName);
        return true;
    }
    addCallback(tickName, callback) {
        const callbacks = this.callbacks.get(tickName);
        if (!callbacks) {
            throw new ReferenceError("Failed to acquire callback set. Unknown tick name.");
        }
        if (typeof callback !== "function") {
            throw new TypeError(`Invalid tick callback. Expected a value of type \`function\`, received \`${typeof callback}\`.`);
        }
        callbacks.add(callback);
        return this;
    }
    removeCallback(tickName, callback) {
        var _a;
        return ((_a = this.callbacks.get(tickName)) === null || _a === void 0 ? void 0 : _a.delete(callback)) || false;
    }
}
_Ticker_selfid = new WeakMap();
Ticker.DELTA_FLUCTUATION = 1.35;
export default Ticker;
