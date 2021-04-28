import { Snap } from "../../common/src/Snap";
import { State } from "../../common/src/State";

export interface FrontEnd<S extends State> {
    animate(frame: Snap<S>) : void;
}