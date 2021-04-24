import { FrontEnd as Frontend } from "./Frontend";
import { MediaManager } from "./MediaManager";
import { SimulationI } from "../../common/src/SimulationI";
import { Snap } from "../../common/src/Snap";

export class HybridMap<S> implements Frontend<S> {
    private simulation: SimulationI<S>;
    private mediaManager: MediaManager;
    private viewport: HTMLCanvasElement;

    constructor(simulation: SimulationI<S>, mediaManager: MediaManager, viewport: HTMLCanvasElement) {
        this.simulation = simulation;
        this.mediaManager = mediaManager;
        this.viewport = viewport;
        //Adjust viewport size
        viewport.width = viewport.offsetWidth;
        viewport.height = viewport.offsetHeight;
    }

    animate(frame: Snap<S>): void {
        throw new Error("Method not implemented.");
    }
}
