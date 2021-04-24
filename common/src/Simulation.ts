import { SimulationI } from "./SimulationI";


export class Simulation<S> implements SimulationI<S> {
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
}
