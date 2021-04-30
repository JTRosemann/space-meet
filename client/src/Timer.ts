import { PongData } from "../../common/src/protocol";

export class Timer {

    private diff : number = 0;
    private lag : number = 0;

    register_pong(receive_time : number, data: PongData) {
        this.lag = receive_time - data[0];
        this.diff = data[1] + this.lag/2 - receive_time;
    }

    get_server_time() : number {
        return Date.now() + this.diff;
    }

    get_lag() : number {
        return this.lag;
    }
}
