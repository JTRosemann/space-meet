import { FrontEnd as Frontend } from "./Frontend";
import { MediaManager } from "./MediaManager";
import { SimulationI } from "../../common/src/SimulationI";
import { Snap } from "../../common/src/Snap";

export class Auditorium<S> implements Frontend<S> {
    private simulation: SimulationI<S>; 
    private mediaManager: MediaManager;

    constructor(simulation: SimulationI<S>, mediaManager: MediaManager) {
        this.simulation = simulation;
        this.mediaManager = mediaManager;
    }

    animate(frame: Snap<S>): void {
        throw new Error("Method not implemented.");
    }
}
