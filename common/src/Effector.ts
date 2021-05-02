import { EffectorData } from "./EffectorFactory";
import { PresentationCtrl } from "./PresentationCtrl";
import { Snap } from "./Snap";
import { State } from "./State";

/**
 * An effector provides *front-end* effects.
 */
export interface Effector<S extends State> {
    /**
     * Generate transmittable data.
     * @returns EffectorData corresponding to this Effector
     */
    to_data() : EffectorData;

    /**
     * Provoke an effect on the dedicated front-end this runs in.
     * @param ctrl this the interface a front-end must implement to instantiate the effect
     * @param snap the snap of the simulation to render
     */
    provoke(ctrl : PresentationCtrl, snap : Snap<S>) : void;
}
