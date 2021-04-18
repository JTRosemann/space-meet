import { Snap } from "./Snap";

export interface FrontEnd<S> {
    animate(frame: Snap<S>) : void;
}