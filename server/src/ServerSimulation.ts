import { Effector } from "../../common/src/Effector";
import { Physics } from "../../common/src/Physics";
import { Simulation } from "../../common/src/Simulation";
import { Snap } from "../../common/src/Snap";
import { State } from "../../common/src/State";
import { Trail } from "../../common/src/Trail";

/**
 * This class extends the Simulation with functionality only needed on the server.
 */
export class ServerSimulation<S extends State> extends Simulation<S> {

    private add_p : (num:number) => S;

    constructor(trails : Record<string,Trail<S>>, effectors : Effector<S>[], physics : Physics<S>,
            add_p: (num: number) => S) {
        super(trails, effectors, physics);
        this.add_p = add_p;
    }

    /**
     * Add a new player to the Simulation, using the method given on construction.
     * @param id id of new player
     * @param time time of addition
     */
    add_player(id: string, time: number) {
        this.push_update(id, this.add_p(this.get_num_players()), time);
    }
}
