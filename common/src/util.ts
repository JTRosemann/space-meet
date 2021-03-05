/*  Copyright 2012-2016 Sven "underscorediscovery" Bergström
    Copyright 2020 Julian Rosemann

    MIT Licensed.
*/

//Now the main game class. This gets created on
//both server and client. Server creates one for
//each game that is hosted, and client creates one
//for itself to play the game.


// fixed(4.22208334636) will return fixed point value to n places, default n = 3
export function fixed(x:number) : number {
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
