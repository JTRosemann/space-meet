import { PongData } from "../../common/src/protocol";
import { Queue } from "../../common/src/Queue";
import { Debugger } from "./Debugger";

export class Timer {

    static timer_cache_size : number = 16;
    static timer_max_diff : number = 1000;

    static offset_self : number = 50;//TODO this is dependent on refresh rate (animationFrame)
    static offset_others : number = 100;//TODO this is dependent on server updates

    private diff : number = 0;
    private lag : number = 0;
    private lag_sum : number = 0;
    private lagQ : Queue<number> = new Queue();
    // to enforce monotone time functions:
    private last_server_time : number = 0;
    private last_self_time : number = 0;
    private last_others_time : number = 0;

    constructor(debugui: Debugger = null) {
        if (debugui) {
            debugui.add_monitor(this, 'lag');
            debugui.add_monitor(this, 'diff');
            debugui.add_monitor(this, 'lag_sum');
            debugui.add_monitor(this, 'last_server_time');
        }
    }

    register_pong(receive_time : number, data: PongData) {
        const lag = receive_time - data[0];
        // add lag to queue
        this.lagQ.enqueue(lag);
        this.lag_sum += lag;
        // if too long, dequeue
        if (this.lagQ.length() > Timer.timer_cache_size) {
            this.lag_sum -= this.lagQ.dequeue();
        }
        this.lag = this.lag_sum / this.lagQ.length();
        this.diff = Math.min(Timer.timer_max_diff, data[1] + this.lag/2 - receive_time);
    }

    get_server_time() : number {
        // enforce the server_time to be monotone
        const server_time = Math.max(this.last_server_time, Date.now() + this.diff);
        this.last_server_time = server_time;
        return server_time;
    }

    get_self_time() : number {
        const self_time = Math.max(this.last_self_time, Date.now() + this.diff + Timer.offset_self);
        this.last_self_time = self_time;
        return self_time;
    }

    get_others_time() : number {
        const others_time = Math.max(this.last_others_time, Date.now() + this.diff + Timer.offset_others);
        this.last_others_time = others_time;
        return others_time;
    }
}
