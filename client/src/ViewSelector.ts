import { ClientSimulation } from "./ClientSimulation";
import { Snap } from "../../common/src/Snap";
import { State } from "../../common/src/State";
import { ParsedInput } from "../../common/src/protocol";
import { Trail, TrailFactory } from "../../common/src/Trail";
import { Queue } from "../../common/src/Queue";

/**
 * This class is responsible for producing the snapshot of the simulation,
 * that is to be rendered.
 * This includes interpolating the correct position at a given time for all players
 * and predicting the position of the cllient-controlled player according to the inputs,
 * as well as emitting the inputs to the server using the input processor.
 * Here only geometric information is handled - not the respective media.
 */
export class ViewSelector<S extends State> {
    private simulation: ClientSimulation<S>;
    private viewer_id: string;
    private client_inputs: Queue<ParsedInput>;

    constructor(simulation: ClientSimulation<S>, viewer_id: string) {
        this.simulation = simulation;
        this.viewer_id = viewer_id;
        this.client_inputs = new Queue();
    }

    //Q: (A) apply inputs in simulation on client. 
    //       advantage: don't have to apply inputs several times
    //       NOT possible: for representation we only fetch the most recent data from self, relative inputs on wrong assumed state would stick on top and be used for further inputs
    //or (B) keep input queue and apply all inputs newer than most recent server update. advantage: no clash between server_updates & inputs
    //A: B is the way to go

    /**
     * Register inputs for client prediction.
     * @param input to register for client prediction
     */
    register_input(input: ParsedInput, server_time: number) : void {
        return;
        const new_state = this.simulation.interpret_input(this.viewer_id, input);
        const end_time = input.start + input.duration;
        this.client_inputs.enqueue(input);
    }

    /**
     * Replay inputs that are more recent than the given snap.
     * @param snap snap to replay inputs on
     * @returns the resulting state
     */
    private replay_inputs(snap: Snap<S>, time_base: number, time_self: number) : void {
        while (this.client_inputs.inhabited() && this.client_inputs.peek().start <= time_base) {
            this.client_inputs.dequeue();
        }
        if (this.client_inputs.inhabited()) {
            const inps = this.client_inputs.peek_all();
            for (let i = 0; i < inps.length; i++) {
                const end_time = inps[i].start + inps[i].duration;
                if (end_time <= time_self) {
                    snap.interpret_input(this.viewer_id, inps[i], 1);
                } else {
                    const diff_bef = time_self - inps[i].start;// >= 0
                    const diff_aft = end_time - time_self;// > 0
                    const frac = diff_bef / (diff_bef + diff_aft);// >= 0 & < 1
                    snap.interpret_input(this.viewer_id, inps[i], frac);
                    break;
                }
            }
        }
    }

    /**
     * Select a view of the simulation:
     * For all other players the position they had at now - tbuf is interpolated,
     * using the server data.
     * For the controlling player the last server update is used.
     * All inputs that are newer than that update are played upon it.
     * @param time_others the time difference in ms between now and the view to be rendered
     * @returns the smoothened & client-predicted snap
     */
    select_view(time_others: number, time_self: number): Snap<S> {
        console.warn("client prediction disabled");
        // make a snap at `time_others` in the past
        const snap = this.simulation.interpolate_snap(time_others);
        // clear all older data
        this.simulation.clear_all_before(time_others);
        // MAYDO it would be better to first overwrite self position with most recent position from server
        //        - and only apply inputs after that
        // for now: apply all inputs between `time_others` and `time_self`
        //this.replay_inputs(snap, time_others, time_self);
        // return smoothened & predicted snap
        return snap;
    }
}
