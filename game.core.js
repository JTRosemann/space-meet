/*  Copyright 2012-2016 Sven "underscorediscovery" Bergström
    Copyright 2020 Julian Rosemann
    
    written by : http://underscorediscovery.ca
    written for : http://buildnewgames.com/real-time-multiplayer/
    
    MIT Licensed.
*/

//The main update loop runs on requestAnimationFrame,
//Which falls back to a setTimeout loop on the server
//Code below is from Three.js, and sourced from links below

// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
// http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating

// requestAnimationFrame polyfill by Erik Möller
// fixes from Paul Irish and Tino Zijdel

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
        window.requestAnimationFrame = function ( callback, element ) {
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

//Now the main game class. This gets created on
//both server and client. Server creates one for
//each game that is hosted, and client creates one
//for itself to play the game.


const vec = function(x, y) {
    this.x = x;
    this.y = y;
};

vec.prototype.add_mut = function(other) {
    this.x += other.x;
    this.y += other.y;
};

vec.prototype.add = function(other) {
    return new vec(this.x + other.x, this.y + other.y);
};

vec.prototype.sub = function(other) {
    return new vec(this.x - other.x, this.y - other.y);
};

vec.prototype.abs = function() {
    return Math.sqrt(this.x*this.x + this.y*this.y);
};

vec.prototype.angle = function() {
    return Math.atan2(this.y,this.x);
};

vec.prototype.polar = function () {
    return {r: abs, phi: angle};
};

vec.prototype.clone = function() {
    return new vec(this.x, this.y);
};

// (4.22208334636).fixed(n) will return fixed point value to n places, default n = 3
Number.prototype.fixed = function(n) {
    n = n || 3;
    return parseFloat(this.toFixed(n));
};
//Simple linear interpolation
const lerp = function(p, n, t) {
    let _t = Number(t);
    _t = (Math.max(0, Math.min(1, _t))).fixed();
    return (p + _t * (n - p)).fixed();
};
//Simple linear interpolation between 2 vectors
vec.prototype.v_lerp = function(tv,t) {
    return new vec(lerp(this.x, tv.x, t),
		   lerp(this.y, tv.y, t));
};

/** 
    The game_core class 
*/

const game_core = function(game_instance) {
    //Store the instance, if any
    this.instance = game_instance;
    //Store a flag if we are the server
    this.server = this.instance !== undefined;
    //Used in collision etc.
    this.world = {
        width : 720,
        height : 480
    };
    this.host_state = {pos: new vec( 200, 300), dir: 0};
    this.join_state = {pos: new vec( 250, 200), dir: 5*Math.PI/4};
    this.players = [];

    //The speed at which the clients move.
    this.player_mv_speed  = 120; // 
    this.player_trn_speed = 3;

    // the length of the physics loop
    this.physics_loop = 15;//ms

    //Set up some physics integration values
    this._pdt = 0.0001;                 //The physics update delta time
    this._pdte = new Date().getTime();  //The physics update last delta time
    //A local timer for precision on server and client
    this.local_time = 0.016;            //The local timer
    this._dt = new Date().getTime();    //The local timer delta
    this._dte = new Date().getTime();   //The local timer last frame time
    if (this.server) {
        this.server_time = 0;
        this.laststate = {};
    } else {
	//Client specific initialisation
        //Create a keyboard handler
        this.keyboard = new THREEx.KeyboardState();
	this.audio_ctx = null;
	this.listener = null;
	this.panner = null;
	this.jitsi_connect = null;
	this.user_id = '';
    }
    //Start a physics loop, this is separate to the rendering
    //as this happens at a fixed frequency
    this.create_physics_simulation();

    //Start a fast paced timer for measuring time easier
    this.create_timer();
};

game_core.prototype.get_player_ids = function() {
    let res = []
    for (const p of this.players) {
	res.push(p.id);
    }
    return res;
};

game_core.prototype.get_game_state = function() {
    let p_s = [];
    for (const p of this.players) {
	p_s.push({
	    id: p.id,
	    call_id: p.call_id,
	    state: p.state
	});
    };
    return {players: p_s};
};

/*
{
  "players": [{
    "id": uindtruina,
    "call_id": turndutir,
    "state": {pos: {x: 10, y: 11}, dir: 0}
    }]
  }
*/

game_core.prototype.push_player = function(player) {
    this.players.push(player);
    this.players.sort(function (a,b) {
	return a.id.localeCompare(b.id);
    });
};

game_core.prototype.rm_player = function(id) {
    //FIXME
    return;
};

game_core.prototype.push_client = function(client, r_id) {
    r_id = r_id || 1;
    const start_state = {pos: new vec( r_id * 40, 50 ), dir: 0};
    const p = new game_player( this, start_state, client.userid, '' /* call_id */, client);//Beware: id != userid
    this.push_player(p);
}; // push_client

const format_state = function(state) {
    return {pos: new vec(state.pos.x, state.pos.y), dir: state.dir};
};

game_core.prototype.set_game = function(game_data) {
    for (const p of game_data.players) {
	//	if (!game_data.players.hasOwnProperty(p_id)) continue;
	const socket = p.socket || '';//no socket info for the client
	this.players.push(new game_player(this, format_state(p.state), p.id, p.call_id, socket));
    }
}; //set_game
    
game_core.prototype.get_self = function() {
    if (!this.self) {
	for (const p of this.players) {
	    if (p.id == this.user_id) {
		this.self = p;
		return this.self
	    }
	}
	console.warn('Cannot find myself');
    }
    return this.self;
};
// initializer methods have to be public, otw. "this" is not handled well
    

game_core.prototype.server_on_update_cid = function(data) {
    for (const p of this.players) {
	if (p.id == data.id) {
	    p.call_id = data.call_id;
	} else {
	    p.instance.emit(data);
	}
    }
};

game_core.prototype.client_on_update_cid = function(data) {
    for (const p of this.players) {
	if (p.id == data.id) {
	    p.call_id = data.call_id;
	}
    }
};

game_core.prototype.onConnectionFailed = function() {
    console.warn('onConnectionFailed');
};

//server side we set the 'game_core' class to a global type, so that it can use it anywhere.
if( 'undefined' != typeof global ) {
    module.exports = global.game_core = game_core;
}

/*
  Helper functions for the game code

  Here we have some common maths and game related code to make working with 2d vectors easy,
  as well as some helpers for rounding numbers to fixed point.

*/

//copies a 2d vector like object from one to another
game_core.prototype.cp_pos = function(a) { return {x:a.x,y:a.y}; };
//copis the state of the player
game_core.prototype.cp_state = function(a) {
    return {
	pos: a.pos.clone(),
	dir:a.dir
    };
};
//Add a 2d vector with another one and return the resulting vector
game_core.prototype.v_add = function(a,b) { return { x:(a.x+b.x).fixed(), y:(a.y+b.y).fixed() }; };
//move the player & update the direction
game_core.prototype.apply_mvmnt = function (state, mvmnt) {
    return { pos: state.pos.add(mvmnt.pos),
	     dir: mvmnt.dir 
	   }
};
//Subtract a 2d vector with another one and return the resulting vector
game_core.prototype.v_sub = function(a,b) { return { x:(a.x-b.x).fixed(),y:(a.y-b.y).fixed() }; };
//Multiply a 2d vector with a scalar value and return the resulting vector
game_core.prototype.v_mul_scalar = function(a,b) { return {x: (a.x*b).fixed() , y:(a.y*b).fixed() }; };
//For the server, we need to cancel the setTimeout that the polyfill creates
game_core.prototype.stop_update = function() {  window.cancelAnimationFrame( this.updateid );  };
//lerp for states
game_core.prototype.s_lerp = function(s,ts,t) {
    return {
	pos: s.pos.v_lerp(ts.pos, t),
	dir: lerp(s.dir, ts.dir, t)
    };
};

/*
  The player class

  A simple class to maintain state of a player on screen,
  as well as to draw that state when required.
*/

// the game_instance & start_state are required
const game_player = function( game_instance, start_state, id , call_id, socket) {
    //store the instance
    this.instance = socket || '';
    this.game = game_instance;//FIXME: this is actually a design flaw...

    //Set up initial values for our state information
    // FIXME: angles should be normalized
    this.state = this.game.cp_state(start_state);
    this.size = 32;
    this.hsize = this.size / 2;
    this.info = 'no-name';
    this.color = 'rgba(255,255,255,0.1)';
    this.info_color = 'rgba(255,255,255,0.1)';
    this.id = id;
    this.call_id = call_id || '';
    this.panner = null;

    //These are used in moving us around later
    this.cur_state = this.game.cp_state(this.state);//dest_ghost state
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

}; //game_player.constructor

game_player.prototype.draw_head = function(){

    const pos = this.state.pos.sub(this.game.get_self().state.pos);
    const abs_val = pos.abs();
    const dist_c = this.game.viewport.width/6;
    
    const sin_alpha
	  = this.game.get_self().hsize /
	  Math.max(this.size, abs_val);
    const rad = /*Math.min(*/sin_alpha * dist_c / (1 - sin_alpha)/*, dist_c)*/;
    const dist = dist_c + rad;
    const center_x = dist * pos.x / abs_val;//FIXME: divide by zero
    const center_y = dist * pos.y / abs_val;
    this.game.ctx.save();
    this.game.ctx.translate(center_x, center_y);
    this.game.ctx.rotate(this.game.get_self().state.dir + Math.PI/2); // rewind the rotation from outside

    this.game.ctx.beginPath();
    this.game.ctx.arc( 0, 0, rad, 0 /*start_angle*/, 2*Math.PI /*arc_angle*/);
    this.game.ctx.clip();
    if (this.game.show_video) {
	const vid = document.querySelector('video');
	if (vid) {
	    const w = vid.offsetWidth;
	    const h = vid.offsetHeight;
	    if (w > h) { //landscape video input
		const ratio = w / h;
		const h_scaled = 2 * rad;
		const w_scaled = ratio * h_scaled;
		const diff = w_scaled - h_scaled;
		this.game.ctx.drawImage(vid, - rad - diff / 2, -rad, w_scaled, h_scaled);
	    } else { //portrait video input
		const ratio = h / w;
		const w_scaled = 2 * rad;
		const h_scaled = ratio * w_scaled;
		const diff = h_scaled - w_scaled;
		this.game.ctx.drawImage(vid, - rad, - rad - diff / 2, w_scaled, h_scaled);
	    }
	}
    } else {
	this.game.ctx.moveTo(-10,10);
	this.game.ctx.lineTo(0,0);
	this.game.ctx.lineTo( 10,10);
    }
    this.game.ctx.strokeStyle = this.color;
    this.game.ctx.stroke();
    this.game.ctx.restore();
//    this.game.ctx.rotate(-this.game.get_self().state.dir - Math.PI/2);
//    this.game.ctx.translate(-center_x,-center_y);
}

game_player.prototype.draw_self = function(){

    //Set the color for this player
    this.game.ctx.fillStyle = this.color;
    
    if (game.show_support) {
	this.game.ctx.beginPath();
	this.game.ctx.arc(0,0,this.hsize,0,2*Math.PI);
	this.game.ctx.strokeStyle = "yellow";
	this.game.ctx.stroke();
    }
    this.game.ctx.beginPath();
    const rt2 = Math.sqrt(0.5);
    this.game.ctx.moveTo(                0,                 0);
    this.game.ctx.lineTo(rt2 * -this.hsize, rt2 *  this.hsize);
    this.game.ctx.lineTo(       this.hsize,                 0);
    this.game.ctx.lineTo(rt2 * -this.hsize, rt2 * -this.hsize);
    this.game.ctx.closePath();
    this.game.ctx.fill();

    //Draw a status update
    this.game.ctx.fillStyle = this.info_color;
    this.game.ctx.fillText(this.info, 10, 4);
    
}; //game_player.draw_self

game_player.prototype.draw = function() {
    this.game.ctx.save();
    this.game.ctx.translate(this.state.pos.x,this.state.pos.y);
    this.game.ctx.rotate(this.state.dir); // beware: the coordinate system is mirrored at y-axis
    
    this.draw_self();
    this.game.ctx.restore();

    //Draw a status update
    this.game.ctx.fillStyle = this.info_color;
    this.game.ctx.fillText(this.info, this.state.pos.x+10, this.state.pos.y + 4);
    
}; //game_player.draw

game_player.prototype.facing_vec = function() {
    return new vec(Math.cos(this.state.dir), Math.sin(this.state.dir));
}
game_player.prototype.add_audio_track = function(stream) {
    const gain_node = this.game.audio_ctx.createGain();
    const stereo_panner = new StereoPannerNode(audio_ctx, {pan: 0} /*stereo balance*/);
    const track = this.game.audio_ctx.createMediaStreamSource(stream);
    const panner_model = 'HRTF';
    //for now, we don't use cones for simulation of speaking direction. this may be added later on
    //cf. https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Web_audio_spatialization_basics
    const distance_model = 'linear'; // possible values are: 'linear', 'inverse' & 'exponential'
    const max_distance = 10000;
    const ref_distance = 1;
    const roll_off = 20;
    this.panner = new PannerNode(this.audio_ctx, {
	panningModel: panner_model,
	distanceModel: distance_model,
	refDistance: ref_distance,
	maxDistance: max_distance,
	rolloffFactor: roll_off
    });
    track.connect(gain_node).connect(stereo_panner).connect(this.panner).connect(this.audio_ctx.destination);
};

game_core.prototype.onConnectionSuccess = function() {
    const thisgame = this;//to be able to refer to 'this' in event handlers (they are called from somewhere else, i.e. in another 'this')
    return function on_connection_success() {
	console.log('onConnectionSuccess');
	const conf_opt = { openBridgeChannel: true };
	const jitsi_conf = thisgame.jitsi_connect.initJitsiConference('mau8goo6gaenguw7o', conf_opt);
	
	jitsi_conf.on(JitsiMeetJS.events.conference.TRACK_ADDED, track => {
	    for (const p of thisgame.players) {
		const p_id = track.getParticipantId();
		if (p.call_id == p_id) {
		    if (track.getType() == 'audio') {
			// if there is a player with a matching id, add the audio track
			// FIXME: what if this client retrieves the audio track before it sees the player ? we have to fire init audio also on push_player
			p.add_audio_track(track.stream);
			break;
		    } else if (track.getType() == 'video') {
			$('body').append(`<video autoplay='1' id='vid${p_id}' style='visibility:hidden;'/>`);
			const vid = document.getElementById('vid${p_id}');
			track.attach(vid);
		    }
		}
	    }
	});
	thisgame.get_self().call_id = jitsi_conf.myUserId();
	this.socket.emit('on_update_cid', this.get_self().call_id);
	jitsi_conf.join();
    };
}; // game_core.onConnectionSuccess

/*

  Common functions
  
  These functions are shared between client and server, and are generic
  for the game state. The client functions are client_* and server functions
  are server_* so these have no prefix.

*/

//Main update loop
game_core.prototype.update = function(t) {
    //console.log('update');
    //Work out the delta time
    this.dt = this.lastframetime ? ( (t - this.lastframetime)/1000.0).fixed() : 0.016;

    //Store the last frame time
    this.lastframetime = t;

    //Update the game specifics
    if(!this.server) {
        this.client_update();
    } else {
        this.server_update();
    }

    //schedule the next update
    this.updateid = window.requestAnimationFrame( this.update.bind(this), this.viewport );

}; //game_core.update


/*
  Shared between server and client.
  In this example, `item` is always of type game_player.
*/
game_core.prototype.check_collision = function( item ) {

    //Left wall.
    if(item.state.pos.x <= item.pos_limits.x_min) {
        item.state.pos.x = item.pos_limits.x_min;
    }

    //Right wall
    if(item.state.pos.x >= item.pos_limits.x_max ) {
        item.state.pos.x = item.pos_limits.x_max;
    }
    
    //Roof wall.
    if(item.state.pos.y <= item.pos_limits.y_min) {
        item.state.pos.y = item.pos_limits.y_min;
    }

    //Floor wall
    if(item.state.pos.y >= item.pos_limits.y_max ) {
        item.state.pos.y = item.pos_limits.y_max;
    }

    //Fixed point helps be more deterministic
    item.state.pos.x = item.state.pos.x.fixed(4);
    item.state.pos.y = item.state.pos.y.fixed(4);
    
}; //game_core.check_collision


game_core.prototype.process_input = function( player ) {

    //It's possible to have recieved multiple inputs by now,
    //so we process each one
    let r = 0;
    let phi = 0;
    let ic = player.inputs.length;
    if(ic) {
        for(let j = 0; j < ic; ++j) {
            //don't process ones we already have simulated locally
	    if(player.inputs[j].seq <= player.last_input_seq) continue;

	    const input = player.inputs[j].inputs;
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
    const base_phi = player.state.dir;
    const mvmnt = this.physics_movement_vector_from_direction( r, phi, base_phi );
    if(player.inputs.length) {
        //we can now clear the array since these have been processed

        player.last_input_time = player.inputs[ic-1].time;
        player.last_input_seq = player.inputs[ic-1].seq;
    }
    //console.log({x: mvmnt.pos.x, y: mvmnt.pos.y, dir: mvmnt.dir, r: r});
    //give it back
    return mvmnt;

}; //game_core.process_input

game_core.prototype.physics_movement_vector_from_direction = function(r,phi,base_phi) {

    //Must be fixed step, at physics sync speed.
    const r_s   =   r * (this.player_mv_speed  * (this.physics_loop / 1000));
    const phi_s = phi * (this.player_trn_speed * (this.physics_loop / 1000)) + base_phi;
    return {
        pos: new vec((r_s * Math.cos(phi_s)).fixed(3),
		     (r_s * Math.sin(phi_s)).fixed(3)),
	dir : phi_s
    };

}; //game_core.physics_movement_vector_from_direction

game_core.prototype.update_physics = function() {

    if(this.server) {
        this.server_update_physics();
    } else {
        this.client_update_physics();
    }

}; //game_core.prototype.update_physics

/*

  Server side functions
  
  These functions below are specific to the server side only,
  and usually start with server_* to make things clearer.

*/

//Updated at 15ms , simulates the world state
game_core.prototype.server_update_physics = function() {
    for (const p of this.players) {

	const mvmnt = this.process_input(p);
	p.state = this.apply_mvmnt( p.state, mvmnt );
	
	//Keep the physics position in the world
	this.check_collision( p );
	p.inputs = []; //we have cleared the input buffer, so remove this
    }
}; //game_core.server_update_physics

game_player.prototype.get_input_obj = function() {
    return {
	state: this.state,
	lis: this.last_input_seq
    };
};
//Makes sure things run smoothly and notifies clients of changes
//on the server side
game_core.prototype.server_update = function(){

    //Update the state of our local clock to match the timer
    this.server_time = this.local_time;

    //Make a snapshot of the current state, for updating the clients
    let p_s = {};
    for (const p of this.players) {
	p_s[p.id] = p.get_input_obj();
    }	
    this.laststate = {
	players: p_s,
        t: this.server_time                      // our current local time on the server
    };

    //Send the snapshot to the 'host' player
    for (const p of this.players) {
	p.instance.emit( 'onserverupdate', this.laststate );
    }
}; //game_core.server_update

game_core.prototype.unpack_server_data = function(data) {
    let p_s = {};
    for (const pid in data.players) {
	if (!data.players.hasOwnProperty(pid)) continue;
	const p = data.players[pid];
	p_s[pid] = {
	    state: {
		pos: new vec(p.state.pos.x, p.state.pos.y),
		dir: p.state.dir
	    },
	    lis: p.lis
	};
    }
    return {
	players: p_s,
	t: data.t
    };
};

game_core.prototype.handle_server_input = function(client, input, input_time, input_seq) {
    for (const p of this.players) {
	if (client.userid == p.id) {
	    //Store the input on the player instance for processing in the physics loop
	    p.inputs.push({inputs:input, time:input_time, seq:input_seq});
	    return;
	}
    }
}; //game_core.handle_server_input


/*

  Client side functions

  These functions below are specific to the client side only,
  and usually start with client_* to make things clearer.

*/

game_core.prototype.client_handle_input = function(){

    //if(this.lit > this.local_time) return;
    //this.lit = this.local_time+0.5; //one second delay

    //This takes input from the client and keeps a record,
    //It also sends the input information to the server immediately
    //as it is pressed. It also tags each input with a sequence number.

    let r = 0; //this represents movement relative to the current position & direction
    let phi = 0;
    const base_phi = this.get_self().state.dir; //start with the current player direction
    const input = [];
    this.client_has_input = false;

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
	    inputs : input,
	    time : this.local_time.fixed(3),
	    seq : this.input_seq
        });

        //Send the packet of information to the server.
        //The input packets are labelled with an 'i' in front.
        let server_packet = 'i.';
        server_packet += input.join('-') + '.';
        server_packet += this.local_time.toFixed(3).replace('.','-') + '.';
        server_packet += this.input_seq;

        //Go
        this.socket.send(  server_packet  );

        //Return the direction if needed
        return this.physics_movement_vector_from_direction( r, phi , base_phi );

    } else {

        return {x:0,y:0};

    }

}; //game_core.client_handle_input

game_core.prototype.client_process_net_prediction_correction = function() {

    //No updates...
    if(!this.server_updates.length) return;

    //The most recent server update
    const lsd_raw = this.server_updates[this.server_updates.length-1];
    const latest_server_data = this.unpack_server_data(lsd_raw);

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
            this.get_self().cur_state = this.cp_state(my_server_state);
            this.get_self().last_input_seq = lastinputseq_index;
            //Now we reapply all the inputs that we have locally that
            //the server hasn't yet confirmed. This will 'keep' our position the same,
            //but also confirm the server position at the same time.
	    
	    // DEBUGGING CODE

	    //	const before = this.get_self().cur_state.dir;
            this.client_update_physics();
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

game_core.prototype.client_process_net_updates = function() {

    //No updates...
    if(!this.server_updates.length) return;

    //First : Find the position in the updates, on the timeline
    //We call this current_time, then we find the past_pos and the target_pos using this,
    //searching throught the server_updates array for current_time in between 2 other times.
    // Then :  other player position = lerp ( past_pos, target_pos, current_time );

    //Find the position in the timeline of updates we stored.
    let current_time = this.client_time;
    let count = this.server_updates.length-1;
    let target = null;
    let previous = null;

    //We look from the 'oldest' updates, since the newest ones
    //are at the end (list.length-1 for example). This will be expensive
    //only when our time is not found on the timeline, since it will run all
    //samples. Usually this iterates very little before breaking out with a target.
    for(let i = 0; i < count; ++i) {

        const point_raw = this.server_updates[i];
	let point = this.unpack_server_data(point_raw);
        const next_point_raw = this.server_updates[i+1];
	let next_point = this.unpack_server_data(next_point_raw);

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
	const lsd_raw = this.server_updates[0];
	const lsd = this.unpack_server_data(lsd_raw);
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
        const max_difference = (target.t - previous.t).fixed(3);
        let time_point = (difference/max_difference).fixed(3);

        //Because we use the same target and previous in extreme cases
        //It is possible to get incorrect values due to division by 0 difference
        //and such. This is a safe guard and should probably not be here. lol.
        if( isNaN(time_point) ) time_point = 0;
        if(time_point == -Infinity) time_point = 0;
        if(time_point == Infinity) time_point = 0;

        //The most recent server update
	const lsd_raw = this.server_updates[ this.server_updates.length-1 ];
        const latest_server_data = this.unpack_server_data(lsd_raw);

        //These are the exact server positions from this tick, but only for the ghost

	for (const p of this.players) {
	    if (p.id == this.user_id) continue;//skip yourself
	    const other_data = latest_server_data.players[p.id];
            const other_server_state = other_data.state;

            //The other players positions in this timeline, behind us and in front of us
            const other_target_state = target.players[p.id].state;
            const other_past_state = previous.players[p.id].state;
	    
            //update the dest block, this is a simple lerp
            //to the target from the previous point in the server_updates buffer
//            this.ghosts.server_pos_other.state = this.cp_state(other_server_state);
	    //          this.ghosts.pos_other.state = this.s_lerp(other_past_state, other_target_state, time_point);
	    const ghost_pos_other = this.s_lerp(other_past_state, other_target_state, time_point);
            if(this.client_smoothing) {
		p.state = this.s_lerp( p.state, ghost_pos_other, this._pdt*this.client_smooth);
            } else { 
		p.state = this.cp_state(ghost_pos_other);
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
	    //	    this.ghosts.server_pos_self.pos = this.cp_state(my_server_state);
	    const local_target  = this.s_lerp(my_past_state, my_target_state, time_point);

            //Smoothly follow the destination position
	    if(this.client_smoothing) {
                this.get_self().state = this.s_lerp( this.get_self().state, local_target, this._pdt*this.client_smooth);
	    } else {
                this.get_self().state = this.cp_state( local_target );
	    }
        }

    } //if target && previous

}; //game_core.client_process_net_updates

game_core.prototype.client_onserverupdate_recieved = function(raw_data){

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
	    p.state = this.cp_state(data.players[p.id].state);
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

game_core.prototype.client_update_local_position = function(){

    if(this.client_predict) {
        //Make sure the visual position matches the states we have stored
	this.get_self().state = this.get_self().cur_state;
        
        //We handle collision on client if predicting.
        this.check_collision( this.get_self() );

    }  //if(this.client_predict)

}; //game_core.prototype.client_update_local_position

game_core.prototype.client_update_physics = function() {

    //Fetch the new direction from the input buffer,
    //and apply it to the state so we can smooth it in the visual state

    if(this.get_self() && this.client_predict) {
        const nd = this.process_input(this.get_self());
	this.get_self().cur_state = this.apply_mvmnt( this.get_self().cur_state, nd);
        this.get_self().state_time = this.local_time;
    }

}; //game_core.client_update_physics

game_core.prototype.client_update = function() {
    //Clear the screen area
    if (!this.traces) {
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
		this.listener.setPosition(listener_pos.x, 0, listener_pos.y);
		this.listener.setOrientation(listener_facing.x, 0, listener_facing.y, 0, 1, 0);
	    } else if (p.panner) {
		//set emitter position
		p.panner.positionX.value = p.state.pos.x;
		p.panner.positionZ.value = p.state.pos.y;//z is the new y
	    }
	}
    }

    //Now they should have updated, we can draw the entity    
    if (this.rel_pos) {

	this.ctx.save();
	const mid_x = this.viewport.width/2;
	const mid_y = this.viewport.height/2;
	this.ctx.translate(mid_x, mid_y);
	this.ctx.rotate(-Math.PI/2);	
	
	this.get_self().draw_self();
	this.ctx.rotate(-this.get_self().state.dir);
	for (const p of this.players) {
	    if (p.id == this.user_id) continue;
	    p.draw_head();
	}
	if (this.show_support) {
	    for (const p of this.players) {
		this.ctx.beginPath()
		if (p.id == this.user_id) continue;
		const other_sub_self = p.state.pos.sub(this.get_self().state.pos);
		const alpha = Math.asin(this.get_self().hsize / other_sub_self.abs());
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
	//draw circle
	this.ctx.beginPath();
	this.ctx.arc(0,0, this.viewport.width/6, 0, 2*Math.PI);
	this.ctx.strokeStyle = "black";
	this.ctx.stroke();
	if (this.clip) {
	    this.ctx.clip();
	}
	//	this.ctx.fillStyle = "#FF0000";
	//	this.ctx.fillRect(-10, -10, 20, 20);// rotation point

	this.ctx.translate(-this.get_self().state.pos.x, -this.get_self().state.pos.y);	
	//	this.ctx.fillStyle = "#FF8800";
	//	this.ctx.fillRect(-10, -10, 20, 20);// (0,0)
	this.ctx.strokeStyle = "red";
	this.ctx.strokeRect(0,0,this.world.width,this.world.height);
	for (const p of this.players) {
	    if (p.id == this.user_id) continue;
	    p.draw();
	}

	//	this.ctx.translate(this.get_self().state.pos.x, this.get_self().state.pos.y);
	//	this.ctx.rotate(this.get_self().state.dir);

	//	this.ctx.rotate(Math.PI/2);
	//	this.ctx.translate(-mid_x, -mid_y);
	this.ctx.restore(); // restore removes the need to reset the translations & rotations one by one
    } else {
	//FIXME: absolute positions are not supported anymore
	p.draw();
	this.get_self().draw();
        //and these
	if(this.show_dest_pos && !this.naive_approach) {
	    this.ghosts.pos_other.draw();
	}

        //and lastly draw these
	if(this.show_server_pos && !this.naive_approach) {
	    this.ghosts.server_pos_self.draw();
	    this.ghosts.server_pos_other.draw();
	}
    }
    //Work out the fps average
    this.client_refresh_fps();

}; //game_core.update_client

game_core.prototype.create_timer = function(){
    setInterval(function(){
        this._dt = new Date().getTime() - this._dte;
        this._dte = new Date().getTime();
        this.local_time += this._dt/1000.0;
    }.bind(this), 4);
}

game_core.prototype.create_physics_simulation = function() {
    
    setInterval(function(){
        this._pdt = (new Date().getTime() - this._pdte)/1000.0;
        this._pdte = new Date().getTime();
        this.update_physics();
    }.bind(this), this.physics_loop);

}; //game_core.client_create_physics_simulation


game_core.prototype.client_create_ping_timer = function() {

    //Set a ping timer to 1 second, to maintain the ping/latency between
    //client and server and calculated roughly how our connection is doing

    setInterval(function(){

        this.last_ping_time = new Date().getTime() - this.fake_lag;
        this.socket.send('p.' + (this.last_ping_time) );

    }.bind(this), 1000);
    
}; //game_core.client_create_ping_timer


game_core.prototype.client_create_configuration = function() {
    
    this.rel_pos = true;                //use relative position to player self or absolute positions
    this.traces = false;                 //whether to show traces of drawn items (i.e. don't clear)
    this.clip = true;                   //whether to clip everything around the map circle
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

game_core.prototype.client_create_debug_gui = function() {

    this.gui = new dat.GUI();

    const _playersettings = this.gui.addFolder('Your settings');

//    this.colorcontrol = _playersettings.addColor(this, 'color');

    //We want to know when we change our color so we can tell
    //the server to tell the other clients for us
/*    this.colorcontrol.onChange(function(value) {
        this.get_self().color = value;
        localStorage.setItem('color', value);
        this.socket.send('c.' + value);
    }.bind(this));
*/
    _playersettings.open();

    const _drawsettings = this.gui.addFolder('Drawing');
    _drawsettings.add(this, 'rel_pos').listen();
    _drawsettings.add(this, 'traces').listen();
    _drawsettings.add(this, 'clip').listen();
    _drawsettings.add(this, 'show_support').listen();
    _drawsettings.add(this, 'show_video').listen();

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

    _debugsettings.open();

    const _consettings = this.gui.addFolder('Connection');
    _consettings.add(this, 'net_latency').step(0.001).listen();
    _consettings.add(this, 'net_ping').step(0.001).listen();

    //When adding fake lag, we need to tell the server about it.
    const lag_control = _consettings.add(this, 'fake_lag').step(0.001).listen();
    lag_control.onChange(function(value){
        this.socket.send('l.' + value);
    }.bind(this));

    _consettings.open();

    const _netsettings = this.gui.addFolder('Networking');
    
    _netsettings.add(this, 'net_offset').min(0.01).step(0.001).listen();
    _netsettings.add(this, 'server_time').step(0.001).listen();
    _netsettings.add(this, 'client_time').step(0.001).listen();
    //_netsettings.add(this, 'oldest_tick').step(0.001).listen();

    _netsettings.open();

}; //game_core.client_create_debug_gui

game_core.prototype.client_reset_positions = function() {

    console.log("reset positions");
//UNUSED
    //Make sure the local player physics is updated
    this.get_self().state = this.cp_state(this.get_self().host ? this.cp_state(this.host_state) : this.cp_state(this.join_state));
    this.get_self().cur_state = this.cp_state(this.get_self().state);

    //Position all debug view items to their owners position
    this.ghosts.server_pos_self.state = this.cp_state(this.get_self().state);

    this.ghosts.server_pos_other.state = this.cp_state(this.players.other.state);
    this.ghosts.pos_other.state = this.cp_state(this.players.other.state);

}; //game_core.client_reset_positions

game_core.prototype.client_onping = function(data) {

    this.net_ping = new Date().getTime() - parseFloat( data );
    this.net_latency = this.net_ping/2;

}; //client_onping

game_core.prototype.client_onnetmessage = function(data) {//FIXME: replace every send with emit & remove this

    const commands = data.split('.');
    const command = commands[0];
    const subcommand = commands[1] || null;
    const commanddata = commands[2] || null;

    switch(command) {
    case 's': //server message

        switch(subcommand) {

        case 'h' : //host a game requested
            this.client_onhostgame(commanddata); break;

        case 'j' : //join a game requested
            this.client_onjoingame(commanddata); break;

        case 'r' : //ready a game requested
            this.client_onreadygame(commanddata); break;

        case 'e' : //end game requested
            this.client_ondisconnect(commanddata); break;

        case 'p' : //server ping
            this.client_onping(commanddata); break;

        case 'c' : //other player changed colors
            this.client_on_otherclientcolorchange(commanddata); break;

        } //subcommand

        break; //'s'
    } //command
    
}; //client_onnetmessage


game_core.prototype.client_refresh_fps = function() {

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


game_core.prototype.client_draw_info = function() {

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
    if(this.get_self().host) {

        this.ctx.fillStyle = 'rgba(255,255,255,0.7)';
        this.ctx.fillText('You are the host', 10 , this.viewport.height - 10);

    } //if we are the host


    //Reset the style back to full white.
    this.ctx.fillStyle = 'rgba(255,255,255,1)';

}; //game_core.client_draw_help
