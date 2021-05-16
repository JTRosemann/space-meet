import { Snap } from "./Snap";
import { EuclideanCircle as EuclideanCircle } from "./EuclideanCircle";
import { Effector } from "./Effector";
import { Physics } from "./Physics";
import { EuclideanStepPhysics } from "./EuclideanStepPhysics";
import { ParsedInput } from "./protocol";

/**
 * A snapshot of a Simulation using EuclideanCircle states.
 */
export class EuclideanCircleSnap implements Snap<EuclideanCircle> {

    private states : Record<string,EuclideanCircle>;
    private effectors : Effector<EuclideanCircle>[];
    private physics: EuclideanStepPhysics;

    constructor(physics : EuclideanStepPhysics, 
            effectors : Effector<EuclideanCircle>[] = [], 
            states : Record<string,EuclideanCircle> = {}) {
        this.physics = physics;
        this.effectors = effectors;
        this.states = states;
    }
    
    /**
     * @inheritdoc
     */
    get_physics(): Physics<EuclideanCircle> {
        return this.physics;
    }

    /**
     * @inheritdoc
     */
    get_effectors(): Effector<EuclideanCircle>[] {
        return this.effectors;
    }

    /**
     * @inheritdoc
     */
    get_states(): Record<string, EuclideanCircle> {
        return this.states;
    }

    /**
     * @inheritdoc
     */
    set_player(viewer_id: string, new_state: EuclideanCircle): void {
        this.states[viewer_id] = new_state;
    }

    /**
     * @inheritdoc
     */
    get_player_state(viewer_id: string): EuclideanCircle {
        return this.states[viewer_id];
    }

    /**
     * Get the width of this snap's map.
     * @returns the width of snap's map
     */
    get_width() : number {
        return this.physics.get_width();
    }
    
    /**
     * Get the height of this snap's map.
     * @returns the height of snap's map
     */
    get_height() : number {
        return this.physics.get_height();
    }
    /**
     */
    interpret_input(id: string, inp: ParsedInput, frac: number = 1): void {
        const old_state = this.get_player_state(id);
        const new_state = this.physics.interpret_input(old_state, inp);
        // here we assume that endtime of old_state equals start_time of new_state
        const interpol = old_state.interpolate(new_state, frac);
        this.set_player(id, interpol);
    }

}
