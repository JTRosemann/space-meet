import { Snap } from "../../common/src/Snap";

export interface FrontEnd<S> {
    animate(frame: Snap<S>) : void;
}