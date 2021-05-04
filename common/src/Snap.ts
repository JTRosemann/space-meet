import { Effector } from "./Effector";
import { Physics } from "./Physics";
import { ParsedInput } from "./protocol";
import { State } from "./State";

export interface Snap<S extends State> {

    /**
     * Get the physics of this snap.
     * @returns a physics object
     */
    get_physics(): Physics<S>;

    /**
     * Get a list of Effectors.
     * @returns list of Effectors
     */
    get_effectors(): Effector<S>[];

    /**
     * Get a record containg a map from player IDs to states.
     * @returns a map from player IDs to states
     */
    get_states() : Record<string,S>;

    /**
     * Update the state of player `id` to `state`.
     * @param id of the player
     * @param state to be updated to
     */
    set_player(id: string, state: S) : void;

    /**
     * Get the state of player with ID `id`.
     * @param id 
     * @returns the state of player `id`
     */
    get_player_state(id: string) : S;

    /**
     * Interpret the given input.
     * If a fraction less than 1, an interpolation is applied.
     * @param id of the player
     * @param inp parsed input to be interpreted
     * @param frac fraction (between 0 and 1) of the input time to interpret
     */
    interpret_input(id: string, inp: ParsedInput, frac: number) : void ;
}


