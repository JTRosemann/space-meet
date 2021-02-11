/*  Copyright 2012-2016 Sven "underscorediscovery" Bergström
    Copyright 2020 Julian Rosemann

    MIT Licensed.
*/


import {
    Game,
    PlayerClient,
    Ctx,
    THREExKeyboard,
    JitsiConnection,
    AllInputObj,
    apply_mvmnt,
    format_state,
    InputObj,
    physics_movement_vector_from_direction,
    State,
    s_lerp,
    vec,
    fixed,
} from '../../common/src/game.core';

import { ConnectedData, GameJoinData, ResponderClient, PingData, ServerUpdateData, CarrierClient} from '../../common/src/protocol';

import * as dat from 'dat.gui';
import { THREEx } from '../lib/keyboard.js';
import * as sio from 'socket.io-client';

//The main update loop runs on requestAnimationFrame,
//Which falls back to a setTimeout loop on the server
//Code below is from Three.js, and sourced from links below

// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
// http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating

// requestAnimationFrame polyfill by Erik Möller
// fixes from Paul Irish and Tino Zijdel


// BEWARE: these imports result in 'lib' & 'libs' being transpiled into 'built'
//         breaking my directory structure
//import * as THREEx from '../lib/keyboard';

//import dat = require('../lib/dat.gui.min');
//import JitsiMeetJS = require('../libs/lib-jitsi-meet.min.js');

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


//A window global for our game root variable.
var game : GameClient;


class GameClient extends Game implements ResponderClient {
    players: PlayerClient[] = [];
    self: PlayerClient;
    //Create a keyboard handler
    // import THREEx = require('../lib/keyboard'); // <- this solution doesn't work, solution: decoupling client&server code
    keyboard: THREExKeyboard = new THREEx.KeyboardState();
    audio_ctx: AudioContext;
    listener: AudioListener;
    panner: PannerNode;
    jitsi_connect: JitsiConnection;
    user_id: string;
    input_seq: number;
    carrier: CarrierClient;
    server_updates: AllInputObj[];
    client_time: any;
    target_time: number;
    client_smoothing: any;
    client_predict: any;
    naive_approach: any;
    client_smooth: number;
    server_time: number;
    net_offset: number;
    oldest_tick: number;
    buffer_size: number;
    traces: any;
    ctx: Ctx;
    viewport: any;
    pos_audio: any;
    show_support: any;
    clip: boolean;
    show_video: boolean;
    show_help: boolean;
    show_server_pos: boolean;
    show_dest_pos: boolean;
    net_latency: number;
    net_ping: number;
    last_ping_time: number;
    fake_lag: number;
    fake_lag_time: number;
    fps: number;
    fps_avg_count: number;
    fps_avg: number;
    fps_avg_acc: number;
    lit: number;
    llt: number;
    remote_video: any;
    joined_jitsi: any;
    loc_tracks: any;
    jitsi_conf: any;

    draw_icon(ctx : Ctx, player : PlayerClient) {
        ctx.save();
        ctx.translate(player.state.pos.x, player.state.pos.y);
        ctx.rotate(player.state.dir); // beware: the coordinate system is mirrored at y-axis

        player.draw_icon(ctx);
        ctx.restore();
    }

    draw_projection(ctx : Ctx, player : PlayerClient, projector_rad : number, max_projection_rad : number) { // projector_rad = this.game.viewport.width/6
        const pos = player.state.pos.sub(this.self.state.pos);
        const abs_val = pos.abs();

        const eps = 1;
        // use intercept theorem: (projector_rad + rad) / (abs_val) = (rad / player.rad) and solve it
        // prevent non-positive values in the divisor using Math.max(eps, ..)
        const divisor = Math.max(eps,abs_val - player.rad);
        // bound the maximum size of the radius
        const rad = Math.min(player.rad * projector_rad / divisor, max_projection_rad);
        const dist = projector_rad + rad;
        const center_x = dist * pos.x / abs_val;//FIXME: divide by zero
        const center_y = dist * pos.y / abs_val;
        ctx.save();
        ctx.translate(center_x, center_y);
        ctx.rotate(this.self.state.dir + Math.PI/2); // rewind the rotation from outside

        player.draw_projection(ctx, rad);

        ctx.restore();
        //FIXME for some reason it is glitchy, but only on the screen that does move <-- but this was also the case before re-implementing
        // the reason may be: the rotation (of this.self) is not smooth
    }
    // update

    //FIXME: should I also remove other data?
    client_on_rm_player(data) {
        this.players = this.players.filter(p => p.id !== data);
    }

    client_on_push_player(data) {
        const player = new PlayerClient(format_state(data.state), data.id, data.call_id);
        this.push_player(player);
    }

    set_game(game_data) {
        for (const p of game_data.players) {
            //    if (!game_data.players.hasOwnProperty(p_id)) continue;
            const player = new PlayerClient(format_state(p.state), p.id, p.call_id);
            this.push_player(player);
        }
    } //set_game

    get_self() {
        if (!this.self) {
            for (const p of this.players) {
                if (p.id == this.user_id) {
                    this.self = p;// FIXME p is not a PlayerClientSelf!
                    return this.self
                }
            }
            console.warn('Cannot find myself');
        }
        return this.self;
    }

    client_on_update_cid = function(data) {
        console.log('update cid client');
        for (const p of this.players) {
            if (p.id == data.id) {
                p.call_id = data.call_id;
            }
        }
    }

    onConnectionFailed = function() {
        console.warn('onConnectionFailed');
    }

    unpack_server_data(data: ServerUpdateData) : AllInputObj {
        let p_s : Record<string,InputObj> = {};
        for (const pid in data.players) {
            if (!data.players.hasOwnProperty(pid)) continue;
            const p = data.players[pid];
            p_s[pid] = {
                state: new State(new vec(p.x, p.y), p.d),
                lis: p.l
            };
        }
        return {
            players: p_s,
            t: data.t
        };
    }

    client_handle_input() : State {

        //if(this.lit > this.local_time) return;
        //this.lit = this.local_time+0.5; //one second delay

        //This takes input from the client and keeps a record,
        //It also sends the input information to the server immediately
        //as it is pressed. It also tags each input with a sequence number.

        let r = 0; //this represents movement relative to the current position & direction
        let phi = 0;
        const base_phi = this.get_self().state.dir; //start with the current player direction
        const input : string[] = [];

        if( this.keyboard.pressed('A') ||
            this.keyboard.pressed('left')) {

            phi = -1;
            input.push('l');

        } //left

        if( this.keyboard.pressed('D') ||
            this.keyboard.pressed('right')) {

            phi = 1;
            input.push('r');

        } //right

        if( this.keyboard.pressed('S') ||
            this.keyboard.pressed('down')) {

            r = -1;
            input.push('d');

        } //down

        if( this.keyboard.pressed('W') ||
            this.keyboard.pressed('up')) {

            r = 1;
            input.push('u');

        } //up

        if(input.length) {

            //Update what sequence we are on now
            this.input_seq += 1;

            //Store the input state as a snapshot of what happened.
            this.get_self().inputs.push({
                keys : input,
                time : fixed(this.local_time),
                seq : this.input_seq
            });

            //Send the packet of information to the server.
            //The input packets are labelled with an 'i' in front.
            let server_packet = 'i.';
            server_packet += input.join('-') + '.';
            server_packet += this.local_time.toFixed(3).replace('.','-') + '.';
            server_packet += this.input_seq;

            //Go
            this.carrier.emit_input(server_packet);

            //Return the direction if needed
            return physics_movement_vector_from_direction( r, phi , base_phi );

        } else {

            return new State (new vec(0, 0), base_phi);

        }

    } //game_core.client_handle_input


   client_process_net_prediction_correction() : void {

        //No updates...
        if(!this.server_updates.length) return;

        //The most recent server update
        const latest_server_data = this.server_updates[this.server_updates.length-1];
        //Our latest server position
        const my_data = latest_server_data.players[this.user_id];
        const my_server_state = my_data.state;

        //Update the debug server position block
    //    this.ghosts.server_pos_self.state = this.cp_state(my_server_state);

        //here we handle our local input prediction ,
        //by correcting it with the server and reconciling its differences

        const my_last_input_on_server = my_data.lis;
        if(my_last_input_on_server) {
            //The last input sequence index in my local input list
            let lastinputseq_index = -1;
            //Find this input in the list, and store the index
            for(let i = 0; i < this.get_self().inputs.length; ++i) {
                if(this.get_self().inputs[i].seq == my_last_input_on_server) {
                    lastinputseq_index = i;
                    break;
                }
            }

            //Now we can crop the list of any updates we have already processed
            if(lastinputseq_index != -1) {
                //so we have now gotten an acknowledgement from the server that our inputs here have been accepted
                //and that we can predict from this known position instead

                //remove the rest of the inputs we have confirmed on the server
                const number_to_clear = Math.abs(lastinputseq_index - (-1));
                this.get_self().inputs.splice(0, number_to_clear);
                //The player is now located at the new server position, authoritive server
                this.get_self().cur_state = my_server_state.clone();
                this.get_self().last_input_seq = lastinputseq_index;
                //Now we reapply all the inputs that we have locally that
                //the server hasn't yet confirmed. This will 'keep' our position the same,
                //but also confirm the server position at the same time.

            // DEBUGGING CODE

            //    const before = this.get_self().cur_state.dir;
                this.update_physics();
                this.client_update_local_position();
            /*
                const after = this.get_self().cur_state.dir;
                if (before != after) {
                console.log("before");
                console.log(before);
                console.log("after");
                console.log(my_server_state.dir);
                console.log(after);
                }*/
            // WHY is the direction with the approach from above not set back, while the pos is ?
            // anyway, this fixes it:
            // the playback  of inputs is imprecise,
            // thus finally force the direction of the player to be the same as the server one
            this.get_self().state.dir = my_server_state.dir;

            } // if(lastinputseq_index != -1)
        } //if my_last_input_on_server

}; //game_core.client_process_net_prediction_correction

    client_process_net_updates() : void {

        //No updates...
        if(!this.server_updates.length) return;

        //First : Find the position in the updates, on the timeline
        //We call this current_time, then we find the past_pos and the target_pos using this,
        //searching throught the server_updates array for current_time in between 2 other times.
        // Then :  other player position = lerp ( past_pos, target_pos, current_time );

        //Find the position in the timeline of updates we stored.
        let current_time = this.client_time;
        let count = this.server_updates.length-1;
        let target : AllInputObj;
        let previous : AllInputObj;

        //We look from the 'oldest' updates, since the newest ones
        //are at the end (list.length-1 for example). This will be expensive
        //only when our time is not found on the timeline, since it will run all
        //samples. Usually this iterates very little before breaking out with a target.
        for(let i = 0; i < count; ++i) {

            const point = this.server_updates[i];
            const next_point = this.server_updates[i+1];

            //Compare our point in time with the server times we have
            if(current_time > point.t && current_time < next_point.t) {
                target = next_point;
                previous = point;
                break;
            }
        }

        //With no target we store the last known
        //server position and move to that instead
        if(!target) {
        const lsd = this.server_updates[0];
            target = lsd;
            previous = lsd;
        }

        //Now that we have a target and a previous destination,
        //We can interpolate between then based on 'how far in between' we are.
        //This is simple percentage maths, value/target = [0,1] range of numbers.
        //lerp requires the 0,1 value to lerp to? thats the one.

        if(target && previous) {

            this.target_time = target.t;

            const difference = this.target_time - current_time;
            const max_difference = fixed(target.t - previous.t);
            let time_point = fixed(difference/max_difference);

            //Because we use the same target and previous in extreme cases
            //It is possible to get incorrect values due to division by 0 difference
            //and such. This is a safe guard and should probably not be here. lol.
            if( isNaN(time_point) ) time_point = 0;
            if(time_point == -Infinity) time_point = 0;
            if(time_point == Infinity) time_point = 0;

            //The most recent server update
            const latest_server_data = this.server_updates[ this.server_updates.length-1 ];

            //These are the exact server positions from this tick, but only for the ghost

        /*this.foreach_player = function(f) {
            for (const p of this.players) {
            if (p.id == this.user_id) continue;
            if (
            f(p);
            }
        };*/

            for (const p of this.players) {
                if (p.id == this.user_id) continue;//skip yourself
                const other_data = latest_server_data.players[p.id];
                const target_data = target.players[p.id];
                const past_data = previous.players[p.id];
                //maybe we don't have an update from a new player yet
                if (!other_data || !target_data || !past_data) continue;
                const other_server_state = other_data.state;

                //The other players positions in this timeline, behind us and in front of us
                const other_target_state = target_data.state;
                const other_past_state = past_data.state;

                //update the dest block, this is a simple lerp
                //to the target from the previous point in the server_updates buffer
        //            this.ghosts.server_pos_other.state = this.cp_state(other_server_state);
                //          this.ghosts.pos_other.state = this.s_lerp(other_past_state, other_target_state, time_point);
                const ghost_pos_other = s_lerp(other_past_state, other_target_state, time_point);
                if(this.client_smoothing) {
                    p.state = s_lerp( p.state, ghost_pos_other, this._pdt*this.client_smooth);
                } else {
                    p.state = ghost_pos_other.clone();
                }
        }
            //Now, if not predicting client movement , we will maintain the local player position
            //using the same method, smoothing the players information from the past.
            if(!this.client_predict && !this.naive_approach) {
                const my_data = latest_server_data.players[this.user_id];
                    //These are the exact server positions from this tick, but only for the ghost
                const my_server_state = my_data.state;

                    //The other players positions in this timeline, behind us and in front of us
                const my_target_state = target.players[this.user_id].state;

                const my_past_state = previous.players[this.user_id].state;

                    //Snap the ghost to the new server position
                //        this.ghosts.server_pos_self.pos = this.cp_state(my_server_state);
                const local_target  = s_lerp(my_past_state, my_target_state, time_point);

                    //Smoothly follow the destination position
                if(this.client_smoothing) {
                        this.get_self().state = s_lerp( this.get_self().state, local_target, this._pdt*this.client_smooth);
                } else {
                        this.get_self().state = local_target.clone();
                }
            }

        } //if target && previous

    }; //game_core.client_process_net_updates

    client_onserverupdate_recieved(raw_data : ServerUpdateData) {

        const data = this.unpack_server_data(raw_data);
        //Lets clarify the information we have locally. One of the players is 'hosting' and
        //the other is a joined in client, so we name these host and client for making sure
        //the positions we get from the server are mapped onto the correct local sprites

        //Store the server time (this is offset by the latency in the network, by the time we get it)
        this.server_time = data.t;
        //Update our local offset time from the last server update
        this.client_time = this.server_time - (this.net_offset/1000);

        //One approach is to set the position directly as the server tells you.
        //This is a common mistake and causes somewhat playable results on a local LAN, for example,
        //but causes terrible lag when any ping/latency is introduced. The player can not deduce any
        //information to interpolate with so it misses positions, and packet loss destroys this approach
        //even more so. See 'the bouncing ball problem' on Wikipedia.

        if(this.naive_approach) {
            for (const p of this.players) {
                const p_data = data.players[p.id];
                if (!p_data) continue;
                p.state = p_data.state.clone();
            }
        } else {

            //Cache the data from the server,
            //and then play the timeline
            //back to the player with a small delay (net_offset), allowing
            //interpolation between the points.
            this.server_updates.push(data);

            //we limit the buffer in seconds worth of updates
            //60fps*buffer seconds = number of samples
            if(this.server_updates.length >= ( 60*this.buffer_size )) {
                this.server_updates.splice(0,1);
            }

            //We can see when the last tick we know of happened.
            //If client_time gets behind this due to latency, a snap occurs
            //to the last tick. Unavoidable, and a reallly bad connection here.
            //If that happens it might be best to drop the game after a period of time.
            this.oldest_tick = this.server_updates[0].t;

            //Handle the latest positions from the server
            //and make sure to correct our local predictions, making the server have final say.
            this.client_process_net_prediction_correction();

        } //non naive

    }; //game_core.client_onserverupdate_recieved

    client_on_ping(data: PingData) {

    }

    client_update_local_position(){

        if(this.client_predict) {
            //Make sure the visual position matches the states we have stored
            this.get_self().state = this.get_self().cur_state;

            //We handle collision on client if predicting.
            this.get_self().state = this.world.confine(this.get_self());
            //this.check_collision( this.get_self() );

        }  //if(this.client_predict)

    }; //client_update_local_position

    update_physics() {

        //Fetch the new direction from the input buffer,
        //and apply it to the state so we can smooth it in the visual state

        if(this.get_self() && this.client_predict) {
            const nd = this.get_self().process_inputs();
            this.get_self().cur_state = apply_mvmnt( this.get_self().cur_state, nd);
            this.get_self().state_time = this.local_time;
        }

    }; //game_core.client_update_physics

    do_update() {
        //Clear the screen area
        if (!this.traces && this.ctx) {
            this.ctx.clearRect(0,0,this.viewport.width,this.viewport.height);
        }

        //draw help/information if required
        this.client_draw_info();

        //Capture inputs from the player
        this.client_handle_input();

        //Network player just gets drawn normally, with interpolation from
        //the server updates, smoothing out the positions from the past.
        //Note that if we don't have prediction enabled - this will also
        //update the actual local client position on screen as well.
        if( !this.naive_approach ) {
            this.client_process_net_updates();
        }

        //When we are doing client side prediction, we smooth out our position
        //across frames using local input states we have stored.
        this.client_update_local_position();

        if (this.pos_audio) {
        //audio update
            for (const p of this.players) {
                if (p.id == this.user_id) {
                //set listener position
                    const listener_pos = this.get_self().state.pos;
                    const listener_facing = this.get_self().facing_vec();
                    if (isFinite(listener_pos.x) && isFinite(listener_pos.y)) {
                        this.listener.setPosition(listener_pos.x, 0, listener_pos.y);
                        this.listener.setOrientation(listener_facing.x, 0, listener_facing.y, 0, 1, 0);
                    } else {
                        console.log('x: ' + console.log(listener_pos.x) + '\n');
                        console.log('y: ' + console.log(listener_pos.y) + '\n');
                    }
                } else if (p.panner) {
                    //set emitter position
                    p.panner.positionX.value = p.state.pos.x;
                    p.panner.positionZ.value = p.state.pos.y;//z is the new y
                }
            }
        }

        //Now they should have updated, we can draw the entity
        if (this.ctx) {
            this.ctx.save();
            const mid_x = this.viewport.width/2;
            const mid_y = this.viewport.height/2;
            this.ctx.translate(mid_x, mid_y);
            this.ctx.rotate(-Math.PI/2);

            this.get_self().draw_icon(this.ctx, this.show_support);
            this.ctx.rotate(-this.get_self().state.dir);
            if (this.show_support) {
                for (const p of this.players) {
                    this.ctx.beginPath()
                    if (p.id == this.user_id) continue;
                    const other_sub_self = p.state.pos.sub(this.get_self().state.pos);
                    const alpha = Math.asin(this.get_self().rad / other_sub_self.abs());
                    this.ctx.rotate(alpha);
                    this.ctx.moveTo(0,0);
                    this.ctx.lineTo((other_sub_self.x)*10,
                            (other_sub_self.y)*10);
                    this.ctx.rotate(-alpha);
                    this.ctx.rotate(-alpha);
                    this.ctx.moveTo(0,0);
                    this.ctx.lineTo((other_sub_self.x)*10,
                            (other_sub_self.y)*10);
                    this.ctx.strokeStyle = "yellow";
                    this.ctx.stroke();
                    this.ctx.rotate(alpha);
                }
            }
            for (const p of this.players) {
                if (p.id == this.user_id) continue;

                const pos = p.state.pos.sub(this.get_self().state.pos);
                const abs_val = pos.abs();
                const dist_c = this.viewport.width/6;

                const eps = 1;
                const max_rad = dist_c;
                const rad = Math.min(p.rad * dist_c / Math.max(eps,abs_val - p.rad), max_rad);
                const dist = dist_c + rad;
                const center_x = dist * pos.x / abs_val;//FIXME: divide by zero
                const center_y = dist * pos.y / abs_val;
                this.ctx.save();
                this.ctx.translate(center_x, center_y);
                this.ctx.rotate(this.get_self().state.dir + Math.PI/2); // rewind the rotation from outside

                p.draw_projection(this.ctx, rad);

                this.ctx.restore();
            }
            //draw circle
            this.ctx.beginPath();
            this.ctx.arc(0,0, this.viewport.width/6, 0, 2*Math.PI);
            this.ctx.strokeStyle = "black";
            this.ctx.stroke();
            if (this.clip) {
                this.ctx.clip();
            }
            //    this.ctx.fillStyle = "#FF0000";
            //    this.ctx.fillRect(-10, -10, 20, 20);// rotation point

            this.ctx.translate(-this.get_self().state.pos.x, -this.get_self().state.pos.y);
            //    this.ctx.fillStyle = "#FF8800";
            //    this.ctx.fillRect(-10, -10, 20, 20);// (0,0)
            this.ctx.strokeStyle = "red";
            this.ctx.strokeRect(0,0,this.world.width,this.world.height);
            for (const p of this.players) {
                if (p.id == this.user_id) continue;
                this.ctx.save();
                this.ctx.translate(p.state.pos.x,p.state.pos.y);
                this.ctx.rotate(p.state.dir); // beware: the coordinate system is mirrored at y-axis

                p.draw_icon(this.ctx, this.show_support);
                this.ctx.restore();
            }

            //    this.ctx.translate(this.get_self().state.pos.x, this.get_self().state.pos.y);
            //    this.ctx.rotate(this.get_self().state.dir);

            //    this.ctx.rotate(Math.PI/2);
            //    this.ctx.translate(-mid_x, -mid_y);
            this.ctx.restore(); // restore removes the need to reset the translations & rotations one by one
        }
        //Work out the fps average
        this.client_refresh_fps();


        //schedule the next update
        this.updateid = window.requestAnimationFrame( this.update.bind(this));//, this.viewport );

    }; //game_core.update_client



    client_create_ping_timer() {

        //Set a ping timer to 1 second, to maintain the ping/latency between
        //client and server and calculated roughly how our connection is doing

        setInterval(function(){

            this.last_ping_time = new Date().getTime() - this.fake_lag;
            this.socket.send('p.' + (this.last_ping_time) );

        }.bind(this), 1000);

    }; //game_core.client_create_ping_timer


    client_create_configuration() {

        this.traces = false;                 //whether to show traces of drawn items (i.e. don't clear)
        this.clip = false;                   //whether to clip everything around the map circle
        this.show_support = false;          //whether to show support lines
        this.show_video = true;             //whether to draw the video in the head

        this.show_help = false;             //Whether or not to draw the help text
        this.naive_approach = false;        //Whether or not to use the naive approach
        this.show_server_pos = false;       //Whether or not to show the server position
        this.show_dest_pos = false;         //Whether or not to show the interpolation goal
        this.client_predict = true;         //Whether or not the client is predicting input
        this.input_seq = 0;                 //When predicting client inputs, we store the last input as a sequence number
        this.client_smoothing = true;       //Whether or not the client side prediction tries to smooth things out
        this.client_smooth = 25;            //amount of smoothing to apply to client update dest
        this.pos_audio = true;             //whether to enable positional audio

        this.net_latency = 0.001;           //the latency between the client and the server (ping/2)
        this.net_ping = 0.001;              //The round trip time from here to the server,and back
        this.last_ping_time = 0.001;        //The time we last sent a ping
        this.fake_lag = 0;                //If we are simulating lag, this applies only to the input client (not others)
        this.fake_lag_time = 0;

        this.net_offset = 100;              //100 ms latency between server and client interpolation for other clients
        this.buffer_size = 2;               //The size of the server history to keep for rewinding/interpolating.
        this.target_time = 0.01;            //the time where we want to be in the server timeline
        this.oldest_tick = 0.01;            //the last time tick we have available in the buffer

        this.client_time = 0.01;            //Our local 'clock' based on server time - client interpolation(net_offset).
        this.server_time = 0.01;            //The time the server reported it was at, last we heard from it

        this.dt = 0.016;                    //The time that the last frame took to run
        this.fps = 0;                       //The current instantaneous fps (1/this.dt)
        this.fps_avg_count = 0;             //The number of samples we have taken for fps_avg
        this.fps_avg = 0;                   //The current average fps displayed in the debug UI
        this.fps_avg_acc = 0;               //The accumulation of the last avgcount fps samples

        this.lit = 0;
        this.llt = new Date().getTime();

    };//game_core.client_create_configuration

    client_create_debug_gui = function() {

        this.gui = new dat.GUI();// <- see THREEx.keyboard issue

    //    const _playersettings = this.gui.addFolder('Your settings');

    //    this.colorcontrol = _playersettings.addColor(this, 'color');

        //We want to know when we change our color so we can tell
        //the server to tell the other clients for us
    /*    this.colorcontrol.onChange(function(value) {
            this.get_self().color = value;
            localStorage.setItem('color', value);
            this.socket.send('c.' + value);
        }.bind(this));
    */
    //    _playersettings.open();

        const _drawsettings = this.gui.addFolder('Drawing');
        _drawsettings.add(this, 'traces').listen();
        _drawsettings.add(this, 'clip').listen();
        _drawsettings.add(this, 'show_support').listen();
        _drawsettings.add(this, 'show_video').listen();

        _drawsettings.open();

        const _othersettings = this.gui.addFolder('Methods');

        _othersettings.add(this, 'naive_approach').listen();
        _othersettings.add(this, 'client_smoothing').listen();
        _othersettings.add(this, 'client_smooth').listen();
        _othersettings.add(this, 'client_predict').listen();
        _othersettings.add(this, 'pos_audio').listen();

        const _debugsettings = this.gui.addFolder('Debug view');

        _debugsettings.add(this, 'show_help').listen();
        _debugsettings.add(this, 'fps_avg').listen();
        _debugsettings.add(this, 'show_server_pos').listen();
        _debugsettings.add(this, 'show_dest_pos').listen();
        _debugsettings.add(this, 'local_time').listen();

        const _consettings = this.gui.addFolder('Connection');
        _consettings.add(this, 'net_latency').step(0.001).listen();
        _consettings.add(this, 'net_ping').step(0.001).listen();

        //When adding fake lag, we need to tell the server about it.
        const lag_control = _consettings.add(this, 'fake_lag').step(0.001).listen();
        lag_control.onChange(function(value){
            this.socket.send('l.' + value);
        }.bind(this));

        const _netsettings = this.gui.addFolder('Networking');

        _netsettings.add(this, 'net_offset').min(0.01).step(0.001).listen();
        _netsettings.add(this, 'server_time').step(0.001).listen();
        _netsettings.add(this, 'client_time').step(0.001).listen();
        //_netsettings.add(this, 'oldest_tick').step(0.001).listen();

    }; //game_core.client_create_debug_gui

    client_onping(data: string) {

        this.net_ping = new Date().getTime() - parseFloat( data );
        this.net_latency = this.net_ping/2;

    }; //client_onping

    client_onnetmessage(data: string) {//FIXME: replace every send with emit & remove this
        const commands = data.split('.');
        const command = commands[0];
        const subcommand = commands[1] || null;
        console.log('DEPRECATED MESSAGE FORMAT RECEIVED!' + subcommand);
        const commanddata = commands[2] || null;

        switch(command) {
        case 's': //server message

            switch(subcommand) {

            //case 'h' : //host a game requested
            //    this.client_onhostgame(commanddata); break;

            //case 'j' : //join a game requested
            //    this.client_onjoingame(commanddata); break;

            //case 'r' : //ready a game requested
            //    this.client_onreadygame(commanddata); break;

            case 'e' : //end game requested
                this.client_ondisconnect(commanddata); break;

            case 'p' : //server ping
                this.client_onping(commanddata); break;

            //case 'c' : //other player changed colors
            //    this.client_on_otherclientcolorchange(commanddata); break;

            } //subcommand

            break; //'s'
        } //command

    }; //client_onnetmessage


    client_refresh_fps() : void {

        //We store the fps for 10 frames, by adding it to this accumulator
        this.fps = 1/this.dt;
        this.fps_avg_acc += this.fps;
        this.fps_avg_count++;

        //When we reach 10 frames we work out the average fps
        if(this.fps_avg_count >= 10) {

            this.fps_avg = this.fps_avg_acc/10;
            this.fps_avg_count = 1;
            this.fps_avg_acc = this.fps;

        } //reached 10 frames

    }; //game_core.client_refresh_fps


    client_draw_info() : void {

        if (!this.ctx) return;
        //We don't want this to be too distracting
        this.ctx.fillStyle = 'rgba(255,255,255,0.3)';

        //They can hide the help with the debug GUI
        if(this.show_help) {

            this.ctx.fillText('net_offset : local offset of others players and their server updates. Players are net_offset "in the past" so we can smoothly draw them interpolated.', 10 , 30);
            this.ctx.fillText('server_time : last known game time on server', 10 , 70);
            this.ctx.fillText('client_time : delayed game time on client for other players only (includes the net_offset)', 10 , 90);
            this.ctx.fillText('net_latency : Time from you to the server. ', 10 , 130);
            this.ctx.fillText('net_ping : Time from you to the server and back. ', 10 , 150);
            this.ctx.fillText('fake_lag : Add fake ping/lag for testing, applies only to your inputs (watch server_pos block!). ', 10 , 170);
            this.ctx.fillText('client_smoothing/client_smooth : When updating players information from the server, it can smooth them out.', 10 , 210);
            this.ctx.fillText(' This only applies to other clients when prediction is enabled, and applies to local player with no prediction.', 170 , 230);

        } //if this.show_help

        //Draw some information for the host
       /* if(this.get_self().host) {

            this.ctx.fillStyle = 'rgba(255,255,255,0.7)';
            this.ctx.fillText('You are the host', 10 , this.viewport.height - 10);

        } //if we are the host*/


        //Reset the style back to full white.
        this.ctx.fillStyle = 'rgba(255,255,255,1)';

    }; //game_core.client_draw_help

    client_onjoingame(data: GameJoinData) {
        console.log('onjoin');
        this.local_time = data.time + this.net_latency;
        console.log('server time is about ' + this.local_time);
        this.set_game(data.game);
        //this.init_meeting(); //TODO enable & fix "Cross-Origin Request Blocked"
        this.init_audio();
        //Finally, start the loop
        this.update( new Date().getTime() );
    }; //client_onjoingame

    client_onconnected(data: ConnectedData) {
        console.log('onconnected');
        //The server responded that we are now in a game,
        //this lets us store our id
        this.user_id = data.id;
    }; //client_onconnected

    onRemoteTrack(track) {
        if (track.isLocal()) {
        return;
        }
        for (const p of this.players) {
        const p_id = track.getParticipantId();
        if (p.call_id == p_id) {
            if (track.getType() == 'audio') {
            // if there is a player with a matching id, add the audio track
            // FIXME: what if this client retrieves the audio track before it sees the player ? we have to fire init audio also on push_player
                p.add_audio_track(track.stream, this.audio_ctx);
                break;
                } else if (track.getType() == 'video') {
                    $('body').append(`<video autoplay='1' id='vid${p_id}' style='visibility:hidden;' />`);
            //        $('body').append(`<video autoplay='1' id='vid${p_id}' style='visibility:hidden;' onclick='Window:game.remote_video["${p_id}"].attach(this)'/>`);
                    this.remote_video[`${p_id}`] = track;
            //        setTimeout(function () { // timeout not needed
                    const vid = document.getElementById(`vid${p_id}`);
                    track.attach(vid);
        //        }, 500);
                }
            }
        }
    };

    add_all_loc_tracks() {
        if (this.joined_jitsi) {
            for (const track of this.loc_tracks) {
                this.jitsi_conf.addTrack(track);
            }
        }
    };

    onLocalTracks(tracks) {
        this.loc_tracks = tracks;
        this.add_all_loc_tracks();
    };

    onConferenceJoined() {
        this.joined_jitsi = true;
        this.add_all_loc_tracks();
    };

    onConnectionSuccess() {
        console.log('onConnectionSuccess');
        const conf_opt = { openBridgeChannel: true };
        this.jitsi_conf = this.jitsi_connect.initJitsiConference('mau8goo6gaenguw7o', conf_opt);

        this.remote_video = {};
        this.jitsi_conf.on(JitsiMeetJS.events.conference.TRACK_ADDED, this.onRemoteTrack.bind(this));
        this.jitsi_conf.on(JitsiMeetJS.events.conference.CONFERENCE_JOINED, this.onConferenceJoined.bind(this));
        this.get_self().call_id = this.jitsi_conf.myUserId();
        this.carrier.emit_call_id(this.get_self().call_id);

        this.jitsi_conf.join();
    }; // game_core.onConnectionSuccess

    client_ondisconnect(data) {

        //When we disconnect, we don't know if the other player is
        //connected or not, and since we aren't, everything goes to offline
        //FIXME

    }; //client_ondisconnect

    client_connect_to_server() {

        //Store a local reference to our connection to the server
        this.carrier = new CarrierClient(sio.connect(), this);



    }; //game_core.client_connect_to_server

    init_ui() {
        //Create the default configuration settings
        this.client_create_configuration();

        //A list of recent server updates we interpolate across
        //This is the buffer that is the driving factor for our networking
        this.server_updates = [];

        //Connect to the socket.io server!
        this.client_connect_to_server();

        //We start pinging the server to determine latency
        this.client_create_ping_timer();

        //Set their colors from the storage or locally
    //    this.color = localStorage.getItem('color') || '#cc8822' ;
    //    localStorage.setItem('color', this.color);
    //    this.get_self().color = this.color;

        //Make this only if requested
        if(String(window.location).indexOf('debug') != -1) {
            this.client_create_debug_gui();
        }

        //Fetch the viewport
        game.viewport = document.getElementById('viewport');

        //Adjust their size
        game.viewport.width = game.viewport.offsetWidth;
        game.viewport.height = game.viewport.offsetHeight;

        //Fetch the rendering contexts
        game.ctx = game.viewport.getContext('2d');

        //Set the draw style for the font
        game.ctx.font = '11px "Helvetica"';
        console.log('ui initialised');
    };

    init_audio() {
        // Set up audio
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.audio_ctx = new AudioContext();
        this.listener = this.audio_ctx.listener; // keep the standard values for position, facing & up
        this.listener.setPosition(this.get_self().state.pos.x, 0, this.get_self().state.pos.y);
    };

    init_meeting() {
        const init_opt = {};
        const connect_opt = {
        hosts: {
            domain: 'beta.meet.jit.si',
            muc: 'conference.beta.meet.jit.si'
        },
        serviceUrl: '//beta.meet.jit.si/http-bind?room=mau8goo6gaenguw7o',

        // The name of client node advertised in XEP-0115 'c' stanza
        clientNode: 'beta.meet.jit.si'
        };

        JitsiMeetJS.init(init_opt);
        this.jitsi_connect = new JitsiMeetJS.JitsiConnection(null, null, connect_opt);
        this.jitsi_connect.addEventListener(
        JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED,
        this.onConnectionSuccess.bind(this));
        this.jitsi_connect.addEventListener(
        JitsiMeetJS.events.connection.CONNECTION_FAILED,
        this.onConnectionFailed);
        this.jitsi_connect.connect();

        this.loc_tracks = [];
        const loc_tracks_opt = {devices: [ 'audio', 'video' ] };
        //FIXME: uncaught exception: Object -> in chrome it's device not found -- but chrome also fails to open cam & mic on jitsit, so probably unrelated
        JitsiMeetJS.createLocalTracks(loc_tracks_opt).then(this.onLocalTracks.bind(this)).catch(error => console.log(error)); // 'desktop' for screensharing
    };

}
//When loading, we store references to our
//drawing canvases, and initiate a game instance.
console.log('before onload');
window.onload = function(){
    console.log('onload');
    //Create our game client instance.
    game = new GameClient();

    game.init_ui();

}; //window.onload
