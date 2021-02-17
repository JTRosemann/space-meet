import { Controller } from "../../common/src/Controller";
import { fixed } from "../../common/src/game.core";
import { CarrierClient } from "../../common/src/protocol";
import { THREEx } from '../lib/keyboard.js';


export class InputController implements Controller {
    keyboard = new THREEx.KeyboardState();
    carrier: CarrierClient;

    constructor(carrier: CarrierClient) {
        this.carrier = carrier;    
    }
    
    update(delta_time: number, now_time: number): void {
        this.capture_emit_input(now_time);
    }

    private capture_emit_input(time: number) {
        //TODO fix time dependence no rendering speed
        //This takes input from the client and keeps a record,
        //It also sends the input information to the server immediately
        //as it is pressed. It also tags each input with a sequence number.
        const input : string[] = [];

        if(this.keyboard.pressed('A') || this.keyboard.pressed('left')) {
            input.push('l');
        } //left

        if(this.keyboard.pressed('D') || this.keyboard.pressed('right')) {
            input.push('r');
        } //right

        if(this.keyboard.pressed('S') || this.keyboard.pressed('down')) {
            input.push('d');
        } //down

        if(this.keyboard.pressed('W') || this.keyboard.pressed('up')) {
            input.push('u');
        } //up

        if(input.length) {

            //Store the input state as a snapshot of what happened.
            const server_packet = {
                keys : input,
                time : fixed(time)
            };

            //Send the packet of information to the server.
            this.carrier.emit_input(server_packet);
            //TODO make it available for client prediction
        }
    }
}
