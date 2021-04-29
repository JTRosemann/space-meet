import { PresentationCtrl } from "./Podium";
import { State } from "./State";

/**
 * An effector provides *front-end* effects.
 */
export interface Effector<S extends State> {
    covers(state: S): boolean;
    provoke(ctrl : PresentationCtrl) : void;
}
