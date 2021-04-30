import { PhysicsData } from "./PhysicsFactory";
import { ParsedInput } from "./protocol";
import { State } from "./State";

export interface Physics<S extends State> {
    interpret_input(old_state: S, inp: ParsedInput) : S;
    to_data() : PhysicsData;
}
