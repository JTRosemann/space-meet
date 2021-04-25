import { SimulationI } from "./SimulationI";
import { Snap } from "./Snap";
import { State } from "./State";
import { Trail } from "./Trail";

export interface SimulationData<S> {

}

export class Simulation<S extends State> implements SimulationI<S> {

    private trails : Record<string,Trail<S>>;
    //TODO add zones/effectors

    constructor(trails: Record<string,Trail<S>> = {}) {
        this.trails = trails;
    }

    init_from_snap(snap: Snap<S>) {
        throw new Error("Method not implemented");
    }

    freeze_last_player_state_before(p_id: string, time: number): S {
        throw new Error("Method not implemented.");
    }
    get_last_fixed_player_state_before(id: string, time: number): S {
        throw new Error("Method not implemented.");
    }
    rm_player(id: string): void {
        throw new Error("Method not implemented.");
    }
    clear_before(id: string, time: number): void {
        throw new Error("Method not implemented.");
    }
    clear_all_before(time: string): void {
        throw new Error("Method not implemented.");
    }
    clear(id: string): void {
        throw new Error("Method not implemented.");
    }
    clear_all(): void {
        throw new Error("Method not implemented.");
    }
    push_update(id: string, state: S, time: number): void {
        throw new Error("Method not implemented.");
    }

    to_data() : SimulationData<S> {
        return { };
    }
}
