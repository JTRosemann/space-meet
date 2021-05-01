import { PhysicsData } from "./PhysicsFactory";
import { ParsedInput } from "./protocol";
import { State } from "./State";

export interface Physics<S extends State> {
    //Note: as soon as I develop other physics models, 
    //maybe the other classes have to generalize over Physics, instead (or addionally?) to State
    //or even: SomeClass<P extends Physics<S extends State>> ?
    //no, probably this suffices: SomeClass<P extends Physics>
    //since one specific Physics class corresponds to a specific S (extends State)

    /**
     * Return the state that results after interpreting input `inp` on start state `old_state`.
     * @param old_state the state at the begin of the input
     * @param inp the input
     * @returns new state, after input
     */
    interpret_input(old_state: S, inp: ParsedInput) : S;

    /**
     * Create a physics data object for communication.
     * @returns a physics data object
     */
    to_data() : PhysicsData;
}
