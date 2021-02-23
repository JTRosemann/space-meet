import { CarrierClient } from "../../common/src/protocol";
import { Controller } from "../../common/src/Controller";


export class PingController implements Controller {
    carrier: CarrierClient;

    constructor(carrier: CarrierClient) {
        this.carrier = carrier;
    }

    update(_delta_time: number, now_time: number): void {
        this.carrier.emit_ping(now_time);
    }

}
