import { Snap } from "./Snap";

export interface FrontEnd {
    animate(frame: Snap) : void;
}