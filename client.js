/*  Copyright 2012-2016 Sven "underscorediscovery" Bergström
    Copyright 2020 Julian Rosemann

    written by : http://underscorediscovery.ca
    written for : http://buildnewgames.com/real-time-multiplayer/

    MIT Licensed.
*/

//A window global for our game root variable.
var game = {};


game_core.prototype.client_onjoingame = function(data) {
    console.log('onjoin');
    this.local_time = data.time + this.net_latency;
    console.log('server time is about ' + this.local_time);
    this.set_game(data.game);
    this.init_meeting();
    this.init_audio();
    //Finally, start the loop
    this.update( new Date().getTime() );
}; //client_onjoingame

game_core.prototype.client_onconnected = function(data) {
    console.log('onconnected');
    //The server responded that we are now in a game,
    //this lets us store our id
    this.user_id = data.id;
}; //client_onconnected

game_core.prototype.onRemoteTrack = function(track) {
    if (track.isLocal()) {
	return;
    }
    for (const p of this.players) {
	const p_id = track.getParticipantId();
	if (p.call_id == p_id) {
	    if (track.getType() == 'audio') {
		// if there is a player with a matching id, add the audio track
		// FIXME: what if this client retrieves the audio track before it sees the player ? we have to fire init audio also on push_player
		p.add_audio_track(track.stream);
		break;
	    } else if (track.getType() == 'video') {
		$('body').append(`<video autoplay='1' id='vid${p_id}' style='visibility:hidden;' />`);
//		$('body').append(`<video autoplay='1' id='vid${p_id}' style='visibility:hidden;' onclick='Window:game.remote_video["${p_id}"].attach(this)'/>`);
		this.remote_video[`${p_id}`] = track;
//		setTimeout(function () { // timeout not needed
		    const vid = document.getElementById(`vid${p_id}`);
		    track.attach(vid);
//		}, 500);
	    }
	}
    }
};

game_core.prototype.add_all_loc_tracks = function() {
    if (this.joined_jitsi) {
	for (const track of this.loc_tracks) {
	    this.jitsi_conf.addTrack(track);
	}
    }
};

game_core.prototype.onLocalTracks = function(tracks) {
    this.loc_tracks = tracks;
    this.add_all_loc_tracks();
};

game_core.prototype.onConferenceJoined = function() {
    this.joined_jitsi = true;
    this.add_all_loc_tracks();
};

game_core.prototype.onConnectionSuccess = function() {
    console.log('onConnectionSuccess');
    const conf_opt = { openBridgeChannel: true };
    this.jitsi_conf = this.jitsi_connect.initJitsiConference('mau8goo6gaenguw7o', conf_opt);

    this.remote_video = {};
    this.jitsi_conf.on(JitsiMeetJS.events.conference.TRACK_ADDED, this.onRemoteTrack.bind(this));
    this.jitsi_conf.on(JitsiMeetJS.events.conference.CONFERENCE_JOINED, this.onConferenceJoined.bind(this));
    this.get_self().call_id = this.jitsi_conf.myUserId();
    this.socket.emit('on_update_cid', this.get_self().call_id);

    this.jitsi_conf.join();
}; // game_core.onConnectionSuccess

game_core.prototype.client_ondisconnect = function(data) {

    //When we disconnect, we don't know if the other player is
    //connected or not, and since we aren't, everything goes to offline
    //FIXME

}; //client_ondisconnect

game_core.prototype.client_connect_to_server = function() {

    //Store a local reference to our connection to the server
    this.socket = io.connect();

    //When we connect, we are not 'connected' until we have a server id
    //and are placed in a game by the server. The server sends us a message for that.
//    this.socket.on('connect', function(){
//        this.get_self().info = 'connecting';
//    }.bind(this));

    //Sent when we are disconnected (network, server down, etc)
    this.socket.on('disconnect', this.client_ondisconnect.bind(this));
    //Sent each tick of the server simulation. This is our authoritive update
    this.socket.on('onserverupdate', this.client_onserverupdate_recieved.bind(this));
    //Handle when we connect to the server, showing state and storing id's.
    this.socket.on('onconnected', this.client_onconnected.bind(this));
    //On error we just show that we are not connected for now. Can print the data.
    this.socket.on('error', this.client_ondisconnect.bind(this));
    //On message from the server, we parse the commands and send it to the handlers
    this.socket.on('message', this.client_onnetmessage.bind(this));

    this.socket.on('onjoingame', this.client_onjoingame.bind(this));

    this.socket.on('on_rm_player', this.client_on_rm_player.bind(this));

    this.socket.on('on_push_player', this.client_on_push_player.bind(this));

    this.socket.on('on_update_cid', this.client_on_update_cid.bind(this));

}; //game_core.client_connect_to_server

game_core.prototype.init_ui = function() {
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

game_core.prototype.init_audio = function() {
    // Set up audio
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.audio_ctx = new AudioContext();
    this.listener = this.audio_ctx.listener; // keep the standard values for position, facing & up
    this.listener.positionX = this.get_self().state.pos.x;
    this.listener.positionZ = this.get_self().state.pos.y;
};

game_core.prototype.init_meeting = function() {
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

//When loading, we store references to our
//drawing canvases, and initiate a game instance.
window.onload = function(){

    //Create our game client instance.
    game = new game_core();

    game.init_ui();

}; //window.onload
