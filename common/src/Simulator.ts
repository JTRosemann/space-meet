import { GameState } from "./protocol";
import { Player, fixed, InputProcessor } from "./game.core";
import { Controller } from "./Controller";
import { Game } from "./Game";

/**
 * The Simulator runs on both client and server:
 * It creates a physics update loop as well as a timer loop
 * and calls every controller to update its controllee.
 */
export class Simulator {
    // the length of the physics loop
    static physics_loop = 15;//ms
    static timer_loop = 4;//ms
    game: Game;
    controllers: Controller[] = [];
    input_procs: Record<string,InputProcessor> = {};
    //Set up some physics integration values
    physics_delta: number = Simulator.physics_loop;//The physics update delta time in ms
    physics_prev: number = new Date().getTime(); //The physics update last delta time;
    start_time = new Date().getTime();
    local_time = Simulator.timer_loop; //The local timer

    /**
     * Initialize the Simulator and start the physics loop as well as the timer loop.
     * @param game Game to simulate
     */
    constructor(game: Game) {
        this.game = game;
        //Start a physics loop, this is separate to the rendering
        //as this happens at a fixed frequency
        this.create_physics_simulation();

        //Start a fast paced timer for measuring time easier
        this.create_timer();
    }

    /**
     * Start the timer loop.
     */
    create_timer() {
        setInterval(function () {
            this.local_time = new Date().getTime() - this.start_time;
        }.bind(this), Simulator.timer_loop);
    }

    /**
     * Start the physics simulation loop.
     */
    create_physics_simulation() {
        setInterval(function () {
            this.physics_delta = new Date().getTime() - this.physics_prev;
            this.physics_prev = new Date().getTime();
            this.update_physics();
        }.bind(this), Simulator.physics_loop);

    }

    /**
     * Update the physics: Every controller updates its controllee,
     * then the Game has the final say to guarantee everything stays in bounds.
     */
    update_physics() {
        for (const c of this.controllers) {
            c.update(this.physics_delta, this.local_time);//controller updates its controllee
            this.game.world.confine(c.controllee);//make sure we stay in bounds
        }
    }

}
