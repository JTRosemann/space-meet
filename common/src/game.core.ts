/*  Copyright 2012-2016 Sven "underscorediscovery" Bergström
    Copyright 2020 Julian Rosemann

    MIT Licensed.
*/

//Now the main game class. This gets created on
//both server and client. Server creates one for
//each game that is hosted, and client creates one
//for itself to play the game.


// fixed(4.22208334636) will return fixed point value to n places, default n = 3
export function fixed(x) {
    const n = 3;
    //return parseFloat(x.toFixed(n)); // FIXME
    return x;
}
//import {lerp, vec, fixed } from './vec';
//Simple linear interpolation
function lerp(p: number, n: number, t: number) {
    let _t = Number(t);
    _t = fixed(Math.max(0, Math.min(1, _t)));
    return fixed(p + _t * (n - p));
};

export class vec {
    x: number;
    y: number;
    constructor(x:number, y:number) {
        this.x = x;
        this.y = y;
    }

    add_mut(other:vec) {
        this.x += other.x;
        this.y += other.y;
    }

    add(other:vec) {
        return new vec(this.x + other.x, this.y + other.y);
    }

    sub(other:vec) {
        return new vec(this.x - other.x, this.y - other.y);
    }

    abs() {
        return Math.sqrt(this.x*this.x + this.y*this.y);
    };

    angle() {
        return Math.atan2(this.y,this.x);
    };

    polar() : {r: number, phi: number} {
        return {r: this.abs(), phi: this.angle()};
    };

    clone() {
        return new vec(this.x, this.y);
    };

    //Simple linear interpolation between 2 vectors
    v_lerp(tv: vec,t: number) {
        return new vec(lerp(this.x, tv.x, t),
               lerp(this.y, tv.y, t));
    };
}

function rgba(r:number, g:number, b:number, a:number) : string {
    return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
}

export class State {
    pos : vec;
    dir : number;
    constructor(pos: vec, dir: number) {
        this.pos = pos;
        this.dir = dir;
    }

    clone() {
        return new State(this.pos.clone(), this.dir);
    }
}

export interface Item {
    state : State;
    rad : number;
}

export type Ctx = any;

export interface Projectable extends Item {
    draw_icon(ctx : Ctx) : void;
    draw_projection(ctx : Ctx, rad : number) : void;
}

export interface MobileProjectable extends Projectable {
    cur_state: State;
}

export class Player implements Item {
    static mv_speed : number = 120;
    static trn_speed : number = 3;
    state: State;// possibly abstract?
    rad: number = 16;
    id: string;
    call_id: string;// TODO: move to some VideoEnv or something

    constructor(state: State, id: string, call_id: string) {
        this.state = state.clone();
        this.id = id;
        this.call_id = call_id;
    }
}

export interface Input {
    keys: string[];
    time: number;
    seq: number;
}

export interface InputProcessor {
    last_input_seq: number;
    last_input_time: number;
    inputs: Input[];
    get_input_obj() : {state: State, lis: number};
    process_inputs() : Mvmnt;
}

export interface InputObj {
    state: State; // <--- FIX this, this shan't be a class
    lis: number;
}

export function get_input_obj(state: State, last_input_seq: number) : InputObj {
    return {
        state: state,
        lis: last_input_seq
    };
}

export type Mvmnt = State;

//move the player & update the direction
export function apply_mvmnt(state: State, mvmnt: Mvmnt) : State {
    return new State(state.pos.add(mvmnt.pos), mvmnt.dir);
}

// TODO move at a fitting point
export function physics_movement_vector_from_direction(r: number, phi: number, base_phi: number) : Mvmnt {
    //Must be fixed step, at physics sync speed.
    const r_s   =   r * (Player.mv_speed  * (Game.physics_loop / 1000));
    const phi_s = phi * (Player.trn_speed * (Game.physics_loop / 1000)) + base_phi;
    return new State(new vec(fixed(r_s * Math.cos(phi_s)), fixed(r_s * Math.sin(phi_s))), phi_s);
}

export function process_inputs(player : InputProcessor, player_dir: number) : Mvmnt {
    //It's possible to have recieved multiple inputs by now,
    //so we process each one
    let r = 0;
    let phi = 0;
    let ic = player.inputs.length;
    if(ic) {
        for(let j = 0; j < ic; ++j) {
            //don't process ones we already have simulated locally
            //FIXME this does not seem to be performant
            if(player.inputs[j].seq <= player.last_input_seq) continue;

            const input = player.inputs[j].keys;
            let c = input.length;
            for(let i = 0; i < c; ++i) {
                    let key = input[i];
                    if(key == 'l') {
                        phi -= 1;
                    }
                    if(key == 'r') {
                        phi += 1;
                    }
                    if(key == 'd') {
                        r -= 1;
                    }
                    if(key == 'u') {
                        r += 1;
                    }
            } //for all input values

        } //for each input command
    } //if we have inputs

    //we have a direction vector now, so apply the same physics as the client
    const base_phi = player_dir;
    const mvmnt = physics_movement_vector_from_direction( r, phi, base_phi);
    if(player.inputs.length) {
        //we can now clear the array since these have been processed

        player.last_input_time = player.inputs[ic-1].time;
        player.last_input_seq = player.inputs[ic-1].seq;
    }
    //console.log({x: mvmnt.pos.x, y: mvmnt.pos.y, dir: mvmnt.dir, r: r});
    //give it back
    return mvmnt;
}

export type Socket = any;

export interface AllInputObj {
    players: Record<string,InputObj>;
    t: number;
}

export class PlayerClient extends Player implements MobileProjectable, InputProcessor { //TODO remove impl InputProcessor
    /*

    //These are used in moving us around later
    thils.cur_state = this.game.cp_state(this.state);//dest_ghost state
    this.state_time = new Date().getTime();

    //Our local history of inputs
    this.inputs = [];

    //The world bounds we are confined to
    this.pos_limits = {
        x_min: this.hsize,
        x_max: this.game.world.width - this.hsize,
        y_min: this.hsize,
        y_max: this.game.world.height - this.hsize
    };
    */
    cur_state: State;
    video_enabled : boolean = true;
    color: string = rgba(255,255,255,0.5);
    // audio
    panner : PannerNode = null;

    constructor(state: State, id: string, call_id: string) {
        super(state, id, call_id);
        this.cur_state = this.state.clone();
        this.inputs = [];
    }

    draw_icon(ctx : Ctx, support : boolean = false) : void {
        // the ctx should be appropriately rotated and translated
        //Set the color for this player
        ctx.fillStyle = this.color;

        if (support) {
            ctx.beginPath();
            ctx.arc(0,0,this.rad,0,2*Math.PI);
            ctx.strokeStyle = "yellow";
            ctx.stroke();
        }
        ctx.beginPath();
        const rt2 = Math.sqrt(0.5);
        ctx.moveTo(              0,               0);
        ctx.lineTo(rt2 * -this.rad, rt2 *  this.rad);
        ctx.lineTo(       this.rad,               0);
        ctx.lineTo(rt2 * -this.rad, rt2 * -this.rad);
        ctx.closePath();
        ctx.fill();
    }

    draw_projection(ctx : Ctx, rad : number, support : boolean = false) : void {
        // the ctx should be appropriately rotated and translated
        ctx.beginPath();
        ctx.arc( 0, 0, rad, 0 /*start_angle*/, 2*Math.PI /*arc_angle*/);
        ctx.clip();
        if (this.video_enabled) {
            const vid = document.getElementById('vid' + this.call_id);
            if (vid) {
                const w = vid.offsetWidth;
                const h = vid.offsetHeight;
                if (w > h) { //landscape video input
                    const ratio = w / h;
                    const h_scaled = 2 * rad;
                    const w_scaled = ratio * h_scaled;
                    const diff = w_scaled - h_scaled;
                    ctx.drawImage(vid, - rad - diff / 2, -rad, w_scaled, h_scaled);
                } else { //portrait video input
                    const ratio = h / w;
                    const w_scaled = 2 * rad;
                    const h_scaled = ratio * w_scaled;
                    const diff = h_scaled - w_scaled;
                    ctx.drawImage(vid, - rad, - rad - diff / 2, w_scaled, h_scaled);
                }
            }
        } else {
            ctx.moveTo(-10,10);
            ctx.lineTo(0,0);
            ctx.lineTo( 10,10);
        }
        ctx.strokeStyle = this.color;
        ctx.stroke();
    }

    facing_vec() {
        return new vec(Math.cos(this.state.dir), Math.sin(this.state.dir));
    }

    add_audio_track(stream: MediaStream, audio_ctx : AudioContext) {
        const gain_node = audio_ctx.createGain();
        const stereo_panner = new StereoPannerNode(audio_ctx, {pan: 0} /*stereo balance*/);
        const track = audio_ctx.createMediaStreamSource(stream);
        const panner_model = 'HRTF';
        //for now, we don't use cones for simulation of speaking direction. this may be added later on
        //cf. https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Web_audio_spatialization_basics
        const distance_model = 'linear'; // possible values are: 'linear', 'inverse' & 'exponential'
        const max_distance = 10000;
        const ref_distance = 1;
        const roll_off = 20;
        this.panner = new PannerNode(audio_ctx, {
            panningModel: panner_model,
            distanceModel: distance_model,
            refDistance: ref_distance,
            maxDistance: max_distance,
            rolloffFactor: roll_off
        });
        track.connect(gain_node).connect(stereo_panner).connect(this.panner).connect(audio_ctx.destination);
    }
    // TODO separate PlayerClient & PlayerClientSelf & remove below code in this class
    last_input_seq: number;
    last_input_time: number;
    inputs: Input[];
    state_time: number;

    get_input_obj() {
        return get_input_obj(this.state, this.last_input_seq);
    }

    process_inputs() : Mvmnt {
        return process_inputs(this, this.state.dir);
    }
}

export class PlayerClientSelf extends PlayerClient implements InputProcessor {
    last_input_seq: number;
    last_input_time: number;
    inputs: Input[];
    state_time: number;

    //FIXME how to construct PlayerClientSelf from PlayerClient?

    get_input_obj() {
        return get_input_obj(this.state, this.last_input_seq);
    }

    process_inputs() : Mvmnt {
        return process_inputs(this, this.state.dir);
    }
}

export interface World {
    confine(item: Item) : State;
}

export class RectangleWorld implements World {
    width: number;
    height: number;

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
    }

    confine(item: Item) : State {
        console.assert(2*item.rad <= this.width, 'Item too wide for this world!');
        console.assert(2*item.rad <= this.height, 'Item too tall for this world!');
        const pos_limit_x_min = item.rad;
        const pos_limit_y_min = item.rad;
        const pos_limit_x_max = this.width - item.rad;
        const pos_limit_y_max = this.height - item.rad;

        const conf_x_min = Math.max(item.state.pos.x, pos_limit_x_min);
        const conf_x_max = Math.min(conf_x_min, pos_limit_x_max);
        const conf_x = fixed(conf_x_max);

        const conf_y_min = Math.max(item.state.pos.y, pos_limit_y_min);
        const conf_y_max = Math.min(conf_y_min, pos_limit_y_max);
        const conf_y = fixed(conf_y_max);
        return new State (new vec(conf_x, conf_y), item.state.dir);
    }
}

/* TODO outsource the simulation
interface Simulation {

}
*/

/**
    The game_core class
*/
export abstract class Game {
    // the length of the physics loop
    static physics_loop = 15;
    id : string;
    world : RectangleWorld = new RectangleWorld(720, 480);
    players : Player[];
    //Set up some physics integration values
    _pdt: number = 0.0001;                 //The physics update delta time
    _pdte: number = new Date().getTime();  //The physics update last delta time;
    //A local timer for precision on server and client
    local_time = 0.016;            //The local timer
    _dt = new Date().getTime();    //The local timer delta
    _dte = new Date().getTime();   //The local timer last frame time
    dt: number;
    lastframetime: number;
    updateid: number;

    constructor() {
        //Start a physics loop, this is separate to the rendering
        //as this happens at a fixed frequency
        this.create_physics_simulation();

        //Start a fast paced timer for measuring time easier
        this.create_timer();
    }

    create_timer() {
        setInterval(function(){// TODO what's that ?
            this._dt = new Date().getTime() - this._dte;
            this._dte = new Date().getTime();
            this.local_time += this._dt/1000.0;
        }.bind(this), 4);
    }

    create_physics_simulation() {

        setInterval(function(){
            this._pdt = (new Date().getTime() - this._pdte)/1000.0;
            this._pdte = new Date().getTime();
            this.update_physics();
        }.bind(this), Game.physics_loop);

    } //game_core.client_create_physics_simulation

    get_player_ids() {
        let res = []
        for (const p of this.players) {
            res.push(p.id);
        }
        return res;
    }

    get_game_state() {
        let p_s = [];
        for (const p of this.players) {
            p_s.push({
                id: p.id,
                call_id: p.call_id,
                state: p.state
            });
        };
        return {players: p_s};
    }

    push_player(player: Player) {
        for (const p of this.players) {
            if (p.id == player.id) return;//don't add someone who is already there
        }
        this.players.push(player);
        this.players.sort(function (a: Player,b: Player) {
            return a.id.localeCompare(b.id);
        });
    }

    update(t: number) {
        //Work out the delta time
        this.dt = this.lastframetime ? (fixed((t - this.lastframetime)/1000.0)) : 0.016;

        //Store the last frame time
        this.lastframetime = t;

        //Update the game specifics
        this.do_update();


    }; //game_core.update

    abstract do_update() : void;

    abstract update_physics() : void;

}

export type THREExKeyboard = any;
export type JitsiConnection = any;

//lerp for states
export function s_lerp(s: State, ts: State, t: number) : State {
    return new State(s.pos.v_lerp(ts.pos, t), lerp(s.dir, ts.dir, t));
}

export function format_state(state) {
    return new State(new vec(state.pos.x, state.pos.y), state.dir);
};

//export {Game, State};
//server side we set the 'game_core' class to a global type, so that it can use it anywhere.
//if( 'undefined' != typeof global ) {
  //  module.exports = global.Game = Game;
    // only fixable with sensible game core class & reasonable exporting?
//}

/*
  Helper functions for the game code

  Here we have some common maths and game related code to make working with 2d vectors easy,
  as well as some helpers for rounding numbers to fixed point.

*/

//copies a 2d vector like object from one to another
/*
  The player class

  A simple class to maintain state of a player on screen,
  as well as to draw that state when required.
*/


/*

  Common functions

  These functions are shared between client and server, and are generic
  for the game state. The client functions are client_* and server functions
  are server_* so these have no prefix.

*/
