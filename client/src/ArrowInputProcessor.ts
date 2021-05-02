import { InputProcessor } from "./InputProcessor";
import { ParsedInput } from "../../common/src/protocol";
import { THREEx } from "../lib/keyboard";


export class ArrowInputProcessor implements InputProcessor {

    private keyboard = new THREEx.KeyboardState();
    private last_cycle : number;

    constructor(last_input_time : number) {
        this.last_cycle = last_input_time;
    }

    /**
     * Probe for an input via keyboard keys or wasd and return a parsed input.
     * The input is always registered as starting from the last probing until this probing.
     * @param time time of the probing
     * @returns the parsed input
     */
    fetch_input(time: number): ParsedInput {
        let up = 0;
        let right = 0;
        //left
        if(this.keyboard.pressed('A') || this.keyboard.pressed('left')) {
            right--;
        }

        //right
        if(this.keyboard.pressed('D') || this.keyboard.pressed('right')) {
            right++;
        }

        //down
        if(this.keyboard.pressed('S') || this.keyboard.pressed('down')) {
            up--;
        }

        //up
        if(this.keyboard.pressed('W') || this.keyboard.pressed('up')) {
            up++;
        }

        const start = this.last_cycle;
        const duration = time - this.last_cycle;
        this.last_cycle = time;
        return {
            up: up as -1 | 0 | 1,
            right: right as -1 | 0 | 1,
            start: start,
            duration: duration
        };

    }
}
