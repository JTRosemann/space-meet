import { fixed, Input, Item, State } from "./game.core";
import { vec } from "./vec";
import { Controller } from "./Controller";

/**
 * Base class for the Player controller used in server and client.
 */

export class Player implements Controller {
    static mv_speed: number = 120;
    static trn_speed: number = 3;
    static std_rad: number = 16;
    controllee: Item;
    id: string;
    call_id: string; // TODO: move to some VideoEnv or something






    /**
     * Update the controllee corresponding to the time passed.
     * @param delta_time time between last update and now in ms
     * @param now_time time passed in total since starting the update loop in ms
     */
    update(delta_time: number, now_time: number): void {
        const mvmnt = this.process_inputs(delta_time);
        this.controllee.state = Player.apply_mvmnt(this.controllee.state, mvmnt);
    }

    constructor(state: State, id: string, call_id: string) {
        this.controllee = { state: state.clone(), rad: Player.std_rad };
        this.id = id;
        this.call_id = call_id;
    }

    last_input_seq: number;
    last_input_time: number;
    inputs: Input[];

    /**
     * Positions are added up, direction is overwritten.
     * @param state current state
     * @param mvmnt state to "add" on current state
     */
    static apply_mvmnt(state: State, mvmnt: State): State {
        return new State(state.pos.add(mvmnt.pos), mvmnt.dir);
    }

    /**
     * Compute the mvment.
     * @param r number of steps to go forward (may be negative)
     * @param phi angle to add to @param base_phi
     * @param base_phi direction to start with
     * @param delta_time time (i.e. time to simulate) passed in ms
     */
    static physics_movement_vector_from_direction(r: number, phi: number,
        base_phi: number, delta_time: number): State {
        //Must be fixed step, at physics sync speed.
        const r_s = r * (Player.mv_speed * (delta_time / 1000));
        const phi_s = phi * (Player.trn_speed * (delta_time / 1000)) + base_phi;
        return new State(new vec(fixed(r_s * Math.cos(phi_s)),
            fixed(r_s * Math.sin(phi_s))), phi_s);
    }

    /**
     * Process unprocessed inputs.
     * @param delta_time time to simulate in ms
     */
    process_inputs(delta_time: number): State {
        //It's possible to have received multiple inputs by now,
        //so we process each one
        let r = 0;
        let phi = 0;
        let ic = this.inputs.length;
        if (ic) {
            for (let j = 0; j < ic; ++j) {
                //don't process ones we already have simulated locally
                //FIXME this does not seem to be performant
                if (this.inputs[j].seq <= this.last_input_seq)
                    continue;

                const input = this.inputs[j].keys;
                let c = input.length;
                for (let i = 0; i < c; ++i) {
                    let key = input[i];
                    if (key == 'l') {
                        phi -= 1;
                    }
                    if (key == 'r') {
                        phi += 1;
                    }
                    if (key == 'd') {
                        r -= 1;
                    }
                    if (key == 'u') {
                        r += 1;
                    }
                } //for all input values

            } //for each input command
        } //if we have inputs


        //we have a direction vector now, so apply the same physics as the client
        const base_phi = this.controllee.state.dir;
        const mvmnt = Player.physics_movement_vector_from_direction(r, phi, base_phi, delta_time);
        if (this.inputs.length) {
            //we can now clear the array since these have been processed
            this.last_input_time = this.inputs[ic - 1].time;
            this.last_input_seq = this.inputs[ic - 1].seq;
        }
        //console.log({x: mvmnt.pos.x, y: mvmnt.pos.y, dir: mvmnt.dir, r: r});
        //give it back
        return mvmnt;
    }

}
