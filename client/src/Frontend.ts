import { Snap } from "../../common/src/Snap";
import { State } from "../../common/src/State";
import { MediaManager } from "./MediaManager";

export interface FrontEnd<S extends State> {
    render(frame: Snap<S>) : void;
}