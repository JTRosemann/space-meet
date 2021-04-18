import { SimulationI } from "./SimulationI";


export class Simulation<S> implements SimulationI<S> {
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
