import { Effector } from "./Effector";
import { SimulationI } from "./SimulationI";
import { Snap } from "./Snap";
import { State } from "./State";
import { Trail, TrailData } from "./Trail";

export interface SimulationData<S extends State> {
    trails: Record<string,TrailData<S>>,
    zones: Effector<S>[]
}

export class Simulation<S extends State> implements SimulationI<S> {

    private trails : Record<string,Trail<S>>;
    private zones : Effector<S>[];

    constructor(trails: Record<string,Trail<S>> = {}, zones : Effector<S>[] = []) {
        this.trails = trails;
        this.zones = zones;
    }

    init_from_snap(snap: Snap<S>, time: number) {
        //init trails
        this.trails = {};//first, reset trails
        const states = snap.get_states();
        for (const k of Object.keys(states)) {
            this.trails[k] = new Trail<S>();
            this.trails[k].push_mark(states[k], time);
        }
        //init effectors
        this.zones = snap.get_zones();
    }

    hit(state : S) : Effector<S>[] {
        return this.zones.filter((z : Effector<S>) => z.covers(state));
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
        return {
            trails: this.trails,
            zones: this.zones
        };
    }
}
