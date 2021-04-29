import { Effector } from "./Effector";
import { EuclideanVector } from "./EuclideanVector";
import { EuclideanCircle } from "./EuclideanCircle";
import { Snap } from "./Snap";
import { PresentationCtrl } from "./PresentationCtrl";

/**
 * This effector should simulate a someone being on a podium.
 */
export class Podium implements Effector<EuclideanCircle> {

    private pos : EuclideanVector;
    private rad : number;

    constructor(pos : EuclideanVector, rad : number) {
        this.pos = pos;
        this.rad = rad;
    }

    covers(state: EuclideanCircle): boolean {
        return state.get_pos().sub(this.pos).get_abs() <= this.rad;
    }

    provoke(ctrl : PresentationCtrl, snap : Snap<EuclideanCircle>) {
        const players = snap.get_states();
        // TODO find a more efficient way to calculate hits/zone-inclusion; think raytracer/boundedbox
        for (const id of Object.keys(players)) {
            if (this.covers(players[id])) {
                ctrl.maximize(id);
            }
        }
    }
}
