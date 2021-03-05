import { Controller } from "./Controller";
import { Game } from "./Game";
import { State } from "./State";
import { IdController } from "./IdController";
import { InputPlayer } from "./InputPlayer";

/**
 * The Simulator runs on both client and server:
 * It creates a physics update loop as well as a timer loop
 * and calls every controller to update its controllee.
 */
export class Simulator {
    // the length of the physics loop
    static physics_loop = 15;//ms
    //static physics_loop = 150;//ms DEBUG
    static timer_loop = 4;//ms
    game: Game;
    bots: Controller[] = [];
    players: Record<string,IdController> = {};
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
     * Adds a player for updating.
     * @param player the player to push
     */
    put_player(player: IdController, start_state: State) {
        this.players[player.id] = player;
        this.game.push_item({id: player.id, state: start_state, rad: InputPlayer.std_rad});
    }

    /**
     * Adds a controller for updating.
     * @param controller the controller to add
     */
    push_bot(controller: Controller) {
        this.bots.push(controller);
    }

    /**
     * Remove a player by its id.
     * @param id the id of the player to remove
     */
    rm_player(id:string) {
        delete this.players[id];
        this.game.rm_item(id);
    }
    
    /**
     * Return all players as an array.
     */
    get_players() {
        return Object.values(this.players);
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
        for (const c of this.bots) {
            c.update(this.physics_delta, this.local_time);
        }
        for (const c of Object.values(this.players)) {
            c.update(this.physics_delta, this.local_time);//controller updates its controllee
        }
    }

}
