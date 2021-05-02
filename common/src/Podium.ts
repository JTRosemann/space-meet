import { Effector } from "./Effector";
import { EuclideanVector } from "./EuclideanVector";
import { EuclideanCircle } from "./EuclideanCircle";
import { Snap } from "./Snap";
import { PresentationCtrl } from "./PresentationCtrl";
import { EffectorData } from "./EffectorFactory";

/**
 * This effector should simulate a someone being on a podium.
 */
export class Podium implements Effector<EuclideanCircle> {
    
    static establish(podium: Podium) {
        return new Podium(EuclideanVector.establish(podium.pos), podium.rad);
    }

    private pos : EuclideanVector;
    private rad : number;

    constructor(pos : EuclideanVector, rad : number) {
        this.pos = pos;
        this.rad = rad;
    }

    /**
     * Check whether `state` is inside of this podium.
     * @param state state to be checked
     * @returns a boolean answer
     */
    covers(state: EuclideanCircle): boolean {
        return state.get_pos().sub(this.pos).get_abs() <= this.rad;
    }

    /**
    */
    provoke(ctrl : PresentationCtrl, snap : Snap<EuclideanCircle>) {
        const players = snap.get_states();
        // TODO find a more efficient way to calculate hits/zone-inclusion; think raytracer/boundedbox
        for (const id of Object.keys(players)) {
            if (this.covers(players[id])) {
                ctrl.maximize(id);
            }
        }
    }

    /**
     * Getter for the position of the center.
     * @returns the position of the center
     */
    get_pos() : EuclideanVector {
        return this.pos;
    }

    /**
     * Getter for the radius.
     * @returns the radius
     */
    get_rad() : number {
        return this.rad;
    }

    
    to_data() : EffectorData {
        return {
            kind: 'Podium',
            effector: this
        };
    }
}
