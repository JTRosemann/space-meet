import { FrontEnd as Frontend } from "./Frontend";
import { MediaManager } from "./MediaManager";
import { Snap } from "../../common/src/Snap";
import { State } from "../../common/src/State";
import { Simulation } from "../../common/src/Simulation";

export class Auditorium<S extends State> implements Frontend<S> {
    private simulation: Simulation<S>; 
    private mediaManager: MediaManager;

    constructor(simulation: Simulation<S>, mediaManager: MediaManager) {
        this.simulation = simulation;
        this.mediaManager = mediaManager;
    }

    animate(frame: Snap<S>): void {
        throw new Error("Method not implemented.");
    }
}
