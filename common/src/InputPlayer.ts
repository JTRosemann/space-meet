import { fixed } from "./util";
import { State } from "./State";
import { vec } from "./vec";
import { InputData } from "./protocol";
import { Queue } from "./Queue";
import { Game } from "./Game";
import { IdController } from "./IdController";

/**
 * Base class for the Player controller used in server and client.
 */
export class InputPlayer implements IdController {
    id: string;
    game: Game;
    last_input_time: number;
    inputs: Queue<InputData>;
    mv_speed: number;
    trn_speed: number;

    /**
     * Update the controllee corresponding to the time passed.
     * @param delta_time time between last update and now in ms
     * @param now_time time passed in total since starting the update loop in ms
     */
    update(delta_time: number, now_time: number): void {
        this.process_inputs(delta_time);
    }

    constructor(id: string, game: Game, mv_speed: number, trn_speed: number) {
        this.game = game;
        this.id = id;
        this.inputs = new Queue();
        this.mv_speed = mv_speed;
        this.trn_speed = trn_speed;
    }
    
    /**
     * Push a new input to the queue.
     * @param input new input to push to the queue
     */
    push_input(input: InputData) {
        this.inputs.enqueue(input);
    }

    /**
     * Positions are added up, direction is overwritten.
     * @param state current state
     * @param mvmnt state to "add" on current state
     */
    private static apply_mvmnt(state: State, mvmnt: State): State {
        return new State(state.pos.add(mvmnt.pos), mvmnt.dir);
    }

    private get_controllee_state() {
        return this.game.get_item_state(this.id);
    }

    /**
     * Compute the mvment.
     * @param r number of steps to go forward (may be negative)
     * @param phi angle to add to @param base_phi
     * @param base_phi direction to start with
     * @param delta_time time (i.e. time to simulate) passed in ms
     */
    private physics_movement_vector_from_direction(r: number, phi: number,
        base_phi: number, delta_time: number): State {
        //Must be fixed step, at physics sync speed.
        const r_s = r * (this.mv_speed * (delta_time / 1000));
        const phi_s = phi * (this.trn_speed * (delta_time / 1000)) + base_phi;
        return new State(new vec(fixed(r_s * Math.cos(phi_s)),
            fixed(r_s * Math.sin(phi_s))), phi_s);
    }

    /**
     * Process unprocessed inputs.
     * @param delta_time time to simulate in ms
     */
    private process_inputs(delta_time: number): State {
        if (this.get_controllee_state() == undefined) {
            return;
        }
        const controllee = this.game.get_item_state(this.id);
        //It's possible to have received multiple inputs by now,
        //so we process each one
        let r = 0;
        let phi = 0;
        while (this.inputs.inhabited()) {
            let input = this.inputs.dequeue();
            this.last_input_time = input.time;
            let c = input.keys.length;
            for (let i = 0; i < c; i++) {
                let key = input.keys[i];
                switch (key) {
                    case 'l':
                        phi -= 1;
                        break;
                    case 'r':
                        phi += 1;
                        break;
                    case 'd':
                        r -= 1;
                        break;
                    case 'u':
                        r += 1;
                        break;
                }
            }
        }
        //we have a direction vector now, so apply the same physics as the client
        const base_phi = this.get_controllee_state().dir;
        const mvmnt = this.physics_movement_vector_from_direction(r, phi, base_phi, delta_time);
        //console.log({x: mvmnt.pos.x, y: mvmnt.pos.y, dir: mvmnt.dir, r: r});
        this.game.set_item_state(this.id, InputPlayer.apply_mvmnt(controllee, mvmnt));
    }

}
