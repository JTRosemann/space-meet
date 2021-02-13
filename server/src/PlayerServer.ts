import * as sio from 'socket.io';
import {
    State,
    Player,
    get_input_obj,
    Input,
    InputProcessor,
    process_inputs,
    Mvmnt
} from '../../common/src/game.core';

export class PlayerServer extends Player implements InputProcessor {
    last_input_seq: number;
    last_input_time: number;
    inputs: Input[] = [];
    instance: sio.Socket;

    constructor(state: State, id: string, call_id: string, socket: sio.Socket) {
        super(state, id, call_id);
        this.instance = socket;
    }

    get_input_obj() {
        return get_input_obj(this.state, this.last_input_seq);
    }

    process_inputs(): Mvmnt {
        return process_inputs(this, this.state.dir);
    }
}
