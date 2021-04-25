import { Simulation } from "../../common/src/Simulation";
import { Snap } from "../../common/src/Snap";
import { State } from "../../common/src/State";


export class ServerSimulation<S extends State> extends Simulation<S> {

    constructor(init_snap: Snap<S>) {
        super();
    }

    add_player(id: string, time: number): S {
        throw new Error("Method not implementd.");
    }
}
