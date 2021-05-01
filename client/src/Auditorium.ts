import { FrontEnd as Frontend } from "./Frontend";
import { MediaManager } from "./MediaManager";
import { Snap } from "../../common/src/Snap";
import { State } from "../../common/src/State";
import { Simulation } from "../../common/src/Simulation";

export class Auditorium<S extends State> implements Frontend<S> {
    
    private mediaManager: MediaManager;
    private viewer_id: string;

    constructor(mediaManager: MediaManager, viewer_id: string) {
        this.mediaManager = mediaManager;
        this.viewer_id = viewer_id;
    }

    render(frame: Snap<S>): void {
        //TODO implement
        //throw new Error("Method not implemented.");
    }
}
