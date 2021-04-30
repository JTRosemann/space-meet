import { FrontEnd as Frontend } from "./Frontend";
import { MediaManager } from "./MediaManager";
import { Simulation } from "../../common/src/Simulation";
import { Snap } from "../../common/src/Snap";
import { State } from "../../common/src/State";

export class HybridMap<S extends State> implements Frontend<S> {

    private mediaManager: MediaManager;
    private viewport: HTMLCanvasElement;

    constructor(mediaManager: MediaManager, viewport: HTMLCanvasElement) {
        this.mediaManager = mediaManager;
        this.viewport = viewport;
        //Adjust viewport size
        viewport.width = viewport.offsetWidth;
        viewport.height = viewport.offsetHeight;
    }

    render(frame: Snap<S>): void {
        throw new Error("Method not implemented.");
    }
}
