/*  Copyright 2012-2016 Sven "underscorediscovery" Bergström
    Copyright 2020 Julian Rosemann

    MIT Licensed.
*/

import { Simulator } from "./Simulator";
import { vec } from "./vec";
import { World } from "./World";

//Now the main game class. This gets created on
//both server and client. Server creates one for
//each game that is hosted, and client creates one
//for itself to play the game.


// fixed(4.22208334636) will return fixed point value to n places, default n = 3
export function fixed(x:number) : number {
    const n = 3;
    //return parseFloat(x.toFixed(n)); // FIXME
    return x;
}
//import {lerp, vec, fixed } from './vec';
//Simple linear interpolation
export function lerp(p: number, n: number, t: number) {
    let _t = Number(t);
    _t = fixed(Math.max(0, Math.min(1, _t)));
    return fixed(p + _t * (n - p));
};

export function rgba(r:number, g:number, b:number, a:number) : string {
    return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
}

export class State {
    public static clone(raw: { x: number; y: number; d: number; })
            : {x: number, y: number, d: number} {
        return  {x: raw.x, y: raw.y, d: raw.d};
    }
    public static establish(state: { x: number; y: number; d: number; }): State {
        return new this(new vec(state.x,state.y),state.d);
    }
    pos : vec;
    dir : number;

    constructor(pos: vec, dir: number) {
        this.pos = pos;
        this.dir = dir;
    }
    
    downsize(): { x: number; y: number; d: number; } {
        return {x: this.pos.x, y: this.pos.y, d: this.dir};
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
    get_input_obj() : InputObj;
    process_inputs() : Mvmnt;
}

export interface InputObj {
    state: {x: number, y: number, d: number};
    lis: number;
}
/*
export class InputObj {
    state: State;
    lis: number;
    downsize() {
        return {state: this.state.downsize(), lis: this.lis};
    }
    static establish(raw: InputObjRaw) {
        return new this(State.establish(raw.state), raw.lis);
    }
    constructor(state: State, lis: number) {
        this.state = state;
        this.lis = lis;
    }
}
*/
export interface AllInputObj {
    players: Record<string,InputObj>;
    t: number;
}

export function get_input_obj(state: State, last_input_seq: number) : InputObj {
    return {state: state.downsize(), lis: last_input_seq};
}

export type Mvmnt = State;

//move the player & update the direction
export function apply_mvmnt(state: State, mvmnt: Mvmnt) : State {
    return new State(state.pos.add(mvmnt.pos), mvmnt.dir);
}

// TODO move at a fitting point
export function physics_movement_vector_from_direction(r: number, phi: number, base_phi: number) : Mvmnt {
    //Must be fixed step, at physics sync speed.
    const r_s   =   r * (Player.mv_speed  * (Simulator.physics_loop / 1000));
    const phi_s = phi * (Player.trn_speed * (Simulator.physics_loop / 1000)) + base_phi;
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


export type THREExKeyboard = any;
export type JitsiConnection = any;

//lerp for states
export function s_lerp(s: State, ts: State, t: number) : State {
    return new State(s.pos.v_lerp(ts.pos, t), lerp(s.dir, ts.dir, t));
}
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
