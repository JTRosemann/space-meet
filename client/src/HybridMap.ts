import { FrontEnd as Frontend } from "./Frontend";
import { MediaManager } from "./MediaManager";
import { Simulation } from "./Simulation";
import { Snap } from "./Snap";

export class HybridMap implements Frontend {
    private simulation: Simulation;
    private mediaManager: MediaManager;
    private viewport: HTMLCanvasElement;

    constructor(simulation: Simulation, mediaManager: MediaManager, viewport: HTMLCanvasElement) {
        this.simulation = simulation;
        this.mediaManager = mediaManager;
        this.viewport = viewport;
        //Adjust viewport size
        viewport.width = viewport.offsetWidth;
        viewport.height = viewport.offsetHeight;
    }
    animate(frame: Snap): void {
        throw new Error("Method not implemented.");
    }
}
