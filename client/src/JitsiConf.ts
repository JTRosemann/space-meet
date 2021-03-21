import { createSecureContext } from "tls";
import { Conference } from "../../common/src/Conference";
import { CarrierClient } from "../../common/src/protocol";

declare const JitsiMeetJS : any;

type Track = { 
    isLocal: () => any; 
    getParticipantId: () => any; 
    getType: () => string;
    track: MediaStreamTrack;
    stream: MediaStream; 
    attach: (arg0: HTMLElement) => void; 
    dispose: () => any;
};
export class JitsiConf {
    user_id: string;
    conf: Conference;
    jitsi_connect: any;
    carrier: CarrierClient;
    loc_tracks: any[];
    joined_jitsi: any;
    jitsi_conf: any;
    panners: Record<string,PannerNode>;
    audio_ctx: AudioContext;
    listener: AudioListener;
    jitsi_conf_desk: any;
    jitsi_desk: any;
    loc_tracks_desk: Track[];
    private vid_num: number = 0;

    constructor(conf: Conference, carrier: CarrierClient, user_id: string, audio_ctx: AudioContext) {
        this.conf = conf;
        this.carrier = carrier;
        this.user_id = user_id;
        // Set up audio
        const AudioContext = window.AudioContext;
        this.audio_ctx = audio_ctx;
        this.listener = this.audio_ctx.listener;
        this.panners = this.conf.init_panners(this.audio_ctx);
    }

    get_listener() {
        return this.listener;
    }

    get_panners() : Record<string, PannerNode> {
        return this.panners;
    }

    get_conference() {
        return this.conf;
    }

    init_meeting() {
        const init_opt = {};
        const connect_opt = {
        hosts: {
            domain: 'meet.jit.si',
            muc: 'conference.meet.jit.si'
        },//TODO change to game id
            serviceUrl: '//meet.jit.si/http-bind?room=mau8goo6gaenguw7o',
            // The name of client node advertised in XEP-0115 'c' stanza
            clientNode: 'meet.jit.si'
        };

        JitsiMeetJS.init(init_opt);
        JitsiMeetJS.setLogLevel(JitsiMeetJS.logLevels.ERROR);
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
        JitsiMeetJS.createLocalTracks(loc_tracks_opt).then(this.onLocalTracks.bind(this)).catch((error: Error) => console.log(error)); // 'desktop' for screensharing
    }

    share_screen () {
        //Jitsi only allows one video per participant, thus we need a new participant
        //TODO remove code duplication
        const connect_opt = {
        hosts: {
            domain: 'meet.jit.si',
            muc: 'conference.meet.jit.si'
        },//TODO change to game id
            serviceUrl: '//meet.jit.si/http-bind?room=mau8goo6gaenguw7o',
            // The name of client node advertised in XEP-0115 'c' stanza
            clientNode: 'meet.jit.si'
        };

        this.jitsi_desk = new JitsiMeetJS.JitsiConnection(null, null, connect_opt);
        this.jitsi_desk.addEventListener(
            JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED,
            this.onConnectionSuccessDesk.bind(this));
        this.jitsi_desk.addEventListener(
            JitsiMeetJS.events.connection.CONNECTION_FAILED,
            this.onConnectionFailed);
        this.jitsi_desk.connect();

        this.loc_tracks_desk = [];
        JitsiMeetJS.createLocalTracks({devices: ['desktop']}).then(this.onLocalTracksDesk.bind(this)).catch((error: Error) => console.log(error));
    }

    stop_screenshare() {
        this.loc_tracks_desk.forEach((track: Track) => track.track.stop());
        this.jitsi_conf_desk.leave();
        this.jitsi_desk.disconnect();
        //this.jitsi_conf_desk.removeTrack(track); // this is needed to enable muting/camera off
    }

    set_cid(id: string, cid: string) {
        this.conf.call_ids[id] = cid;
    }

    rm_player(data: string) {
        delete this.conf.call_ids[data];
        delete this.panners[data];
    }

    private set_gallery_columns() {
        const num = Math.ceil(Math.sqrt(this.vid_num));
        let res = '';
        for (let i=1; i <= num; i++) {
            res += ' auto';
        }
        document.getElementById('gallery').style.gridTemplateColumns = res;
    }

    onRemoteTrack(track: Track) {
        if (track.isLocal()) {
            return;
        }
        const p_id = track.getParticipantId();
        const sid = this.conf.get_sid_from_cid(p_id);
        if (track.getType() == 'audio') {
            // if there is a player with a matching id, add the audio track
            // FIXME: what if this client retrieves the audio track before it sees the player ? we have to fire init audio also on push_player
            this.add_audio_track(track.stream, this.audio_ctx, sid);
        } else if (track.getType() == 'video') {
            if (sid == undefined) {//TODO this is not a stable solution AT ALL
                $('#screenshare').children().remove();// remove other screenshares
                const scr = $(`<video autoplay='1' id='scr${p_id}' style='width:100%; height:100%;' />`);
                $('#screenshare').append(scr);
                track.attach(scr[0]);
            } else {
                const vid  = $(`<video autoplay='1' id='vid${p_id}' style='position:absolute; left:0; top:0;' />`);
                const vidG = $(`<video autoplay='1' id='vidG${p_id}' style='width:100%; height:100%;' />`);
                $('#hide').append(vid);
                $('#gallery').append(vidG);
        //        $('body').append(`<video autoplay='1' id='vid${p_id}' style='visibility:hidden;' onclick='Window:game.remote_video["${p_id}"].attach(this)'/>`);
        //        this.remote_video[`${p_id}`] = track;//do I need this?
        //        setTimeout(function () { // timeout not needed
                //const vid = document.getElementById(`vid${p_id}`);
                track.attach(vid[0]);
                //const vidG = document.getElementById(`vidG${p_id}`);
                track.attach(vidG[0]);
                this.vid_num++;
                this.set_gallery_columns();
            }
//        }, 500);
        }
    };

    onUserLeft(id: string) {
        const left_vid = $(`#vid${id}`);
        const left_vidG = $(`#vidG${id}`);
        const left_scr = $(`#scr${id}`);
        if (left_vid) {
            left_vid.remove();
        }
        if (left_vidG) {
            left_vidG.remove();
            this.vid_num--;
            this.set_gallery_columns();
        }
        if (left_scr) {
            left_scr.remove();
        }
    }

    add_all_loc_tracks() {
        if (this.joined_jitsi) {
            for (const track of this.loc_tracks) {
                this.jitsi_conf.addTrack(track);
            }
        }
    };

    onLocalTracks(tracks: Track[]) {
        this.loc_tracks = tracks;
        this.add_all_loc_tracks();
    };

    add_all_loc_tracksDesk() {
        if (this.joined_jitsi) {
            for (const track of this.loc_tracks_desk) {
                this.jitsi_conf_desk.addTrack(track);
            }
        }
    };

    onLocalTracksDesk(tracks: Track[]) {
        this.loc_tracks_desk = tracks;
        this.add_all_loc_tracksDesk();
    };

    onConferenceJoined() {
        this.joined_jitsi = true;
        this.add_all_loc_tracks();
    };

    onConnectionSuccess() {
        console.log('onConnectionSuccess');
        const conf_opt = { openBridgeChannel: true };
        this.jitsi_conf = this.jitsi_connect.initJitsiConference('mau8goo6gaenguw7o', conf_opt);

        //this.remote_video = {};//do i neet this?
        this.jitsi_conf.on(JitsiMeetJS.events.conference.TRACK_ADDED, this.onRemoteTrack.bind(this));
        this.jitsi_conf.on(JitsiMeetJS.events.conference.CONFERENCE_JOINED, this.onConferenceJoined.bind(this));
        this.jitsi_conf.on(JitsiMeetJS.events.conference.USER_LEFT, this.onUserLeft.bind(this));
        const cid = this.jitsi_conf.myUserId();
        this.conf.call_ids[this.user_id] = cid;
        this.carrier.emit_call_id(cid);

        this.jitsi_conf.join();
    }; // game_core.onConnectionSuccess

    onConnectionSuccessDesk() { // TODO fight code duplication
        console.log('onConnectionSuccess');
        const conf_opt = { openBridgeChannel: true };
        this.jitsi_conf_desk = this.jitsi_desk.initJitsiConference('mau8goo6gaenguw7o', conf_opt);

        this.jitsi_conf_desk.join();
    }; // game_core.onConnectionSuccess

    onConnectionFailed = function() {
        console.warn('onConnectionFailed');
    }

    get_Panner(id: string) {
        if (this.panners[id]) {
            return this.panners[id];
        } else {
            this.panners[id] = this.create_Panner(id);
            return this.panners[id];
        }
    }

    create_Panner(id: string) {
        const panner_model = 'HRTF';
        //for now, we don't use cones for simulation of speaking direction. this may be added later on
        //cf. https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Web_audio_spatialization_basics
        const distance_model = 'linear'; // possible values are: 'linear', 'inverse' & 'exponential'
        const max_distance = 10000;
        const ref_distance = 16;
        const roll_off = 8;
        const panner =  new PannerNode(this.audio_ctx, {
            panningModel: panner_model,
            distanceModel: distance_model,
            refDistance: ref_distance,
            maxDistance: max_distance,
            rolloffFactor: roll_off
        });
        return panner;
    }

    add_audio_track(stream: MediaStream, audio_ctx: AudioContext, id: string) {
        const gain_node = audio_ctx.createGain();
        const stereo_panner = new StereoPannerNode(audio_ctx, { pan: 0 } /*stereo balance*/);
        const track = audio_ctx.createMediaStreamSource(stream);
        const panner = this.get_Panner(id);
        track.connect(gain_node)
            .connect(stereo_panner)
            .connect(panner)
            .connect(audio_ctx.destination);
        this.panners[id] = panner;
    }
}
