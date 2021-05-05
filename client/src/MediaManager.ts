import { Conference, ConferenceData } from "../../common/src/Conference";
import { CarrierClient, FullUpdateData } from "../../common/src/protocol";

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
export class MediaManager {

    //TODO initialize fields
    private conf: Conference;
    private jitsi_connect: any;
    private jitsi_conf: any;
    private joined_jitsi: boolean = false;
    private loc_tracks: Track[];
    private user_id: string;
    private carrier: any;//CarrierClient<S>
    private audio_ctx: AudioContext;

    incorporate_update(conf: Conference) {
        this.conf = conf;
    }
    
    constructor(conf: Conference) {
        this.conf = conf;
    }

    get_video(id: string) : HTMLVideoElement {
        return document.getElementById('vid' + this.conf.get_cid(id)) as HTMLVideoElement;
    }

    get_audio(id: string) {

    }

    init_jitsi() {
        const init_opt = {};
        const connect_opt = {
        hosts: {
            domain: 'meet.jit.si',
            muc: 'conference.meet.jit.si'
        },//TODO change to game id
            serviceUrl: '//meet.jit.si/http-bind?room=' + this.conf.get_conf_id(),
            // The name of client node advertised in XEP-0115 'c' stanza
            clientNode: 'meet.jit.si'
        };

        // init JitsiMeetJS
        JitsiMeetJS.init(init_opt);
        // Disable non-Error messages in log
        JitsiMeetJS.setLogLevel(JitsiMeetJS.logLevels.ERROR);
        // create a new "connection"
        this.jitsi_connect = new JitsiMeetJS.JitsiConnection(null, null, connect_opt);
        // add listener for handling successful connection
        this.jitsi_connect.addEventListener(
            JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED,
            this.on_connection_success.bind(this));
        // add listener for handling failed connection
        this.jitsi_connect.addEventListener(
            JitsiMeetJS.events.connection.CONNECTION_FAILED,
            this.on_connection_failed.bind(this));
        // connect using the connection
        this.jitsi_connect.connect();
        // reset local tracks (if any)
        this.loc_tracks = [];
        // connect to audio & video local tracks
        const loc_tracks_opt = {devices: [ 'audio', 'video' ] };
        JitsiMeetJS.createLocalTracks(loc_tracks_opt).then(this.on_local_tracks.bind(this))
            .catch((error: Error) => console.log(error)); // 'desktop' for screensharing
    }

    on_connection_success() {
        console.log('onConnectionSuccess');
        const conf_opt = { openBridgeChannel: true };
        // initialize the conference
        this.jitsi_conf
         = this.jitsi_connect.initJitsiConference(this.conf.get_conf_id(), conf_opt);
        // add more listeners
        this.jitsi_conf.on(JitsiMeetJS.events.conference.TRACK_ADDED,
                            this.on_remote_track.bind(this));
        this.jitsi_conf.on(JitsiMeetJS.events.conference.CONFERENCE_JOINED,
                            this.on_conference_joined.bind(this));
        this.jitsi_conf.on(JitsiMeetJS.events.conference.USER_LEFT,
                            this.on_user_left.bind(this));
        const cid = this.jitsi_conf.myUserId();
        this.conf.set_cid(this.user_id, cid);
        this.carrier.emit_call_id(cid);

        this.jitsi_conf.join();
    }

    on_remote_track(track: Track) {
        if (track.isLocal()) {
            return;
        }
        const p_id = track.getParticipantId();
        const sid = this.conf.get_sid(p_id);
        if (track.getType() == 'audio') {
            // if there is a player with a matching id, add the audio track
            // FIXME: what if this client retrieves the audio track before it sees the player ? we have to fire init audio also on push_player
            //this.audio_tracks.push(track.stream, this.audio_ctx, sid);
            this.add_audio_track(track.stream, this.audio_ctx, sid);
        } else if (track.getType() == 'video') {
            if (sid != undefined) {
                const vid  = $(`<video autoplay='1' id='vid${p_id}' style='position:absolute; left:0; top:0;' />`);
                $('#hide').append(vid);
                track.attach(vid[0]);
            }
        }
    }

    on_user_left(id: string) {
        const left_vid = $(`#vid${id}`);
        if (left_vid) {
            left_vid.remove();
        }
    }

    on_connection_failed = function() {
        console.warn('onConnectionFailed');
    }

    on_conference_joined() {
        this.joined_jitsi = true;
        this.add_all_loc_tracks();
    }

    add_all_loc_tracks() {
        if (this.joined_jitsi) {
            for (const track of this.loc_tracks) {
                this.jitsi_conf.addTrack(track);
            }
        }
    }
    
    on_local_tracks(tracks: Track[]) {
        this.loc_tracks = tracks;
        this.add_all_loc_tracks();
    }

    add_audio_track(stream: MediaStream, audio_ctx: AudioContext, id: string) {
        
    }
}
