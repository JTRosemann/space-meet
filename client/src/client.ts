import { Simulator } from "../../common/src/Simulator";
import { ClientUI } from "./ClientUI";
import { SimulatorClient } from "./SimulatorClient";

let frame_time = 60/1000; // run the local game at 16ms/ 60hz
if('undefined' != typeof(global)) frame_time = 45; //on server we run at 45ms, 22hz

( function () {

    let lastTime = 0;
    let vendors = [ 'ms', 'moz', 'webkit', 'o' ];

    for ( let x = 0; x < vendors.length && !window.requestAnimationFrame; ++ x ) {
        window.requestAnimationFrame = window[ vendors[ x ] + 'RequestAnimationFrame' ];
        window.cancelAnimationFrame = window[ vendors[ x ] + 'CancelAnimationFrame' ] || window[ vendors[ x ] + 'CancelRequestAnimationFrame' ];
    }

    if ( !window.requestAnimationFrame ) {
        window.requestAnimationFrame = function ( callback ) {
            let currTime = Date.now(), timeToCall = Math.max( 0, frame_time - ( currTime - lastTime ) );
            let id = window.setTimeout( function() { callback( currTime + timeToCall ); }, timeToCall );
            lastTime = currTime + timeToCall;
            return id;
        };
    }

    if ( !window.cancelAnimationFrame ) {
        window.cancelAnimationFrame = function ( id ) { clearTimeout( id ); };
    }

}() );

let client;

//When loading, we store references to our
//drawing canvases, and initiate a game instance.
console.log('before onload');
window.onload = function(){
    console.log('onload');
    //Create our game client instance.
    client = new ClientUI();

    client.init_ui();

}; //window.onload
