import { Effector } from "./Effector";
import { Physics } from "./Physics";
import { PhysicsData } from "./PhysicsFactory";
import { ParsedInput } from "./protocol";
import { SimulationI } from "./SimulationI";
import { Snap } from "./Snap";
import { State } from "./State";
import { Trail, TrailData } from "./Trail";

export interface SimulationData<S extends State> {
    trails: Record<string,TrailData<S>>,
    effectors: Effector<S>[],
    physics: PhysicsData
}

export class Simulation<S extends State> implements SimulationI<S> {

    private trails : Record<string,Trail<S>>;
    private effectors : Effector<S>[];
    private physics : Physics<S>;

    constructor(trails: Record<string,Trail<S>> = {}, effectors : Effector<S>[] = []) {
        this.trails = trails;
        this.effectors = effectors;
    }

    init_from_snap(snap: Snap<S>, time: number) {
        //init trails
        this.trails = {};//first, reset trails
        const states = snap.get_states();
        for (const k of Object.keys(states)) {
            this.trails[k] = new Trail<S>(states[k], time);
        }
        //init effectors
        this.effectors = snap.get_effectors();
        this.physics = snap.get_physics();
    }

    freeze_last_player_state_before(p_id: string, time: number): S {
        return this.trails[p_id].freeze_last_state_before(time);
    }

    rm_player(id: string): void {
        delete this.trails[id];
    }

    clear_before(id: string, time: number): void {
        this.trails[id].clear_before(time);
    }
    
    clear_all_before(time: number): void {
        for (const v of Object.values(this.trails)) {
            v.clear_before(time);
        }
    }

    clear(id: string): void {
        this.trails[id].clear();
    }

    clear_all(): void {
        for (const v of Object.values(this.trails)) {
            v.clear();
        }
    }

    push_update(id: string, state: S, time: number): void {
        this.trails[id].push_mark(state, time);
    }

    to_data() : SimulationData<S> {
        const trail_data : Record<string,TrailData<S>> = {};
        for (const id of Object.keys(this.trails)) {
            trail_data[id] = this.trails[id].to_data();
        }
        return {
            trails: trail_data,
            effectors: this.effectors,
            physics: this.physics.to_data()
        };
    }

    get_num_players() : number {
        return Object.keys(this.trails).length;
    }

    interpret_input(id : string, inp : ParsedInput) {
        // To prevent over-reaching interpolation, we have to duplicate the old state before the move.
        const start_time = inp.start;
        const old_state = this.freeze_last_player_state_before(id, start_time);
        const new_state = this.physics.interpret_input(old_state, inp);
        const end_time = start_time + inp.duration;
        this.push_update(id, new_state, end_time);
    }
}
