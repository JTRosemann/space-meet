import { Effector } from "./Effector";
import { EffectorData } from "./EffectorFactory";
import { Physics } from "./Physics";
import { PhysicsData } from "./PhysicsFactory";
import { ParsedInput } from "./protocol";
import { Snap } from "./Snap";
import { State } from "./State";
import { Trail, TrailData, TrailFactory } from "./Trail";

export interface SimulationData<S extends State> {
    trails: Record<string,TrailData<S>>,
    effectors: EffectorData[],
    physics: PhysicsData
}

export class Simulation<S extends State> {
    //TODO maybe a major refactoring is neccessary: 
    /* 
    - rename this into Game without Parameters
    - copy this into simulation & remove effectors & physics from it
    - copy this into EuclideanGame & replace trails with a simulation object
    - make Game in interface
    - EuclideanGame should implement Game using a Sim, transform all the sim methods into wrappers
    - Physics may vanish, methods could move over to Game (instance)
    - In the outside world the type parameter should be <G extends Game>
    - But what about the snap? what type would the snap have? it has to compatible with the sim
        - idea: hide the snap behind the game! i.e. make game a generic interface that works either with a simulation or with a snap
     */
    protected trails : Record<string,Trail<S>>;
    protected effectors : Effector<S>[];
    protected physics : Physics<S>;

    constructor(trails: Record<string,Trail<S>> = {}, 
            effectors : Effector<S>[] = [],  physics : Physics<S>) {
        this.trails = trails;
        this.effectors = effectors;
        this.physics = physics;
    }

    /**
     * Initiate a Simulation using a Snap object.
     * This overwrites any existing data in this Simulation.
     * @param snap state of this simulation at start
     * @param time start time
     */
    init_from_snap(snap: Snap<S>, time: number) {
        //init trails
        this.trails = {};//first, reset trails
        const states = snap.get_states();
        const factory = new TrailFactory<S>();
        for (const k of Object.keys(states)) {
            this.trails[k] = factory.create_singleton_trail(states[k], time);
        }
        //init effectors
        this.effectors = snap.get_effectors();
        this.physics = snap.get_physics();
    }

    /**
     * Freeze the last state before `time` of player `p_id` until `time` and return it.
     * @param p_id ID of the player to manipulate
     * @param time time before/until the freeze
     */
    freeze_last_player_state_before(p_id: string, time: number): S {
        return this.trails[p_id].get_last_state_leq(time);
    }

    /**
     * Remove the player `id` from the simulation.
     * @param id of player to be removed
     */
    rm_player(id: string): void {
        delete this.trails[id];
    }

    /**
     * Clear data strictly older than `time` in `id`s queque.
     * @param id ID of the player whose queque is to be cleared
     * @param time threshold before which everything is cleared on `id`s queue
     */
    clear_before(id: string, time: number): void {
        this.trails[id].clear_before(time);
    }
    
    /**
     * Clear all data strictly older than `time`.
     * @param time threshold before which everything is cleared on all queues
     */
    clear_all_before(time: number): void {
        for (const v of Object.values(this.trails)) {
            v.clear_before(time);
        }
    }

    /**
     * Clear the queue of player id.
     * @param id ID of the player whose queue is to be cleared.
     */
    clear(id: string): void {
        this.trails[id].clear();
    }

    /**
     * Clear all player queues, keeping only access to the most recent state.
     */
    clear_all(): void {
        for (const v of Object.values(this.trails)) {
            v.clear();
        }
    }

    /**
     * Push an update for a dedicated player in the simulation at a dedicated time.
     * @param id ID of player to update
     * @param state new state
     * @param time timestamp of the update
     */
    push_update(id: string, state: S, time: number): void {
        if (this.trails[id] == undefined) {
            const factory = new TrailFactory<S>();
            this.trails[id] = factory.create_singleton_trail(state, time);
        } else {
            this.trails[id].push_mark(state, time);
        }
    }

    to_data() : SimulationData<S> {
        const trail_data : Record<string,TrailData<S>> = {};
        for (const id of Object.keys(this.trails)) {
            trail_data[id] = this.trails[id].to_data();
        }
        return {
            trails: trail_data,
            effectors: this.effectors.map(e => e.to_data()),
            physics: this.physics.to_data()
        };
    }

    get_num_players() : number {
        return Object.keys(this.trails).length;
    }

    /**
     * Interpret the given `input` of player `id`.
     * @param id id of player
     * @param inp given input
     */
    interpret_input(id : string, inp : ParsedInput) {
        // To prevent over-reaching interpolation, we have to duplicate the old state before the move.
        const start_time = inp.start;
        const old_state = this.freeze_last_player_state_before(id, start_time);
        const new_state = this.physics.interpret_input(old_state, inp);
        const end_time = start_time + inp.duration;
        this.push_update(id, new_state, end_time);
    }

    /**
     * Getter for physics.
     * @returns this simulation's physics
     */
    get_physics() {
        return this.physics;
    }

    /**
     * Getter for effectors.
     * @returns this simulation's effectors
     */
    get_effectors() {
        return this.effectors;
    }
}
