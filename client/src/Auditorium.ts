import { FrontEnd as Frontend } from "./Frontend";
import { MediaManager } from "./MediaManager";
import { Simulation } from "./Simulation";
import { Snap } from "./Snap";

export class Auditorium implements Frontend {
    private simulation: Simulation; 
    private mediaManager: MediaManager;

    constructor(simulation: Simulation, mediaManager: MediaManager) {
        this.simulation = simulation;
        this.mediaManager = mediaManager;
    }
    animate(frame: Snap): void {
        throw new Error("Method not implemented.");
    }
}
