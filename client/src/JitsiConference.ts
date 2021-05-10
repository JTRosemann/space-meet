import { Conference } from "../../common/src/Conference";
import { CallIDEmitter } from "../../common/src/protocol";
import { MediaManagerI } from "./MediaManagerI";

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
export class JitsiConference implements MediaManagerI<Conference> {

    private conf: Conference;
    private jitsi_connect: any;
    private jitsi_conf: any;
    private joined_jitsi: boolean = false;
    private loc_tracks: Track[];
    private user_id: string;
    private carrier: CallIDEmitter;
    private audio_streams: Record<string, MediaStream>;

    /**
     * Update the conference.
     * @param conf the updated conference
     */
    incorporate_update(conf: Conference) {
        this.conf = conf;
    }

    constructor(conf: Conference, user_id: string, carrier: CallIDEmitter) {
        this.conf = conf;
        this.user_id = user_id;
        this.carrier = carrier;
        this.audio_streams = {};
        this.init_jitsi();
    }

    /**
     * Get the HTMLVideoElement corresponding to this id, if any. Undefined otherwise.
     * @param id of the requested video
     * @returns the video corresponding to `id`
     */
    get_video(id: string): HTMLVideoElement {
        const call_id = this.conf.get_cid(id);
        if (call_id != undefined) {
            const vid_jQ = $(`#vid${call_id}`);
            if (vid_jQ != undefined) {
                return vid_jQ[0] as HTMLVideoElement;
            }
        }
        return undefined;
    }

    /**
     * Get the audio MediaStream corresponding to this id, if any. Undefined otherwise.
     * @param id of the requested audio
     * @returns the audio MediaStream corresponding to `id`
     */
    get_audio(id: string, audio_ctx: AudioContext) {
        const call_id = this.conf.get_cid(id);
        if (call_id == undefined) {
            return undefined;
        }
        const stream = this.audio_streams[call_id];
        if (stream == undefined) {
            return undefined;
        }
        return audio_ctx.createMediaStreamSource(stream);
    }

    /**
     * Initialize the Jitsi conference.
     * This starts the the process to join the conference given in `this.conf`.
     * The actual joining takes places two callbacks later.
     */
    init_jitsi() {
        const init_opt = {};
        const connect_opt = {
            hosts: {
                domain: 'meet.jit.si',
                muc: 'conference.meet.jit.si'
            },
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
        const loc_tracks_opt = { devices: ['audio', 'video'] };
        JitsiMeetJS.createLocalTracks(loc_tracks_opt).then(this.on_local_tracks.bind(this))
            .catch((error: Error) => console.log(error)); // 'desktop' for screensharing
    }

    /**
     * If a connection could successfully established we can join a conference.
     */
    private on_connection_success() {
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
        this.conf.set_call_id(this.user_id, cid);
        this.carrier.emit_call_id(cid);

        this.jitsi_conf.join();
    }

    /**
     * Handle a newly surfacing remote track.
     * @param track the new remote track
     */
    private on_remote_track(track: Track) {
        if (track.isLocal()) {
            return;
        }
        const call_id = track.getParticipantId();
        // we add audio & indexed by call_id, because sio_id may not be available it the time
        if (track.getType() == 'audio') {
            this.audio_streams[call_id] = track.stream;
        } else if (track.getType() == 'video') {
            const vid = $(`<video autoplay='1' id='vid${call_id}' style='position:absolute; left:0; top:0;' />`);
            $('#hide').append(vid);
            track.attach(vid[0]);
        }
    }

    private on_user_left(id: string) {
        const left_vid = $(`#vid${id}`);
        if (left_vid) {
            left_vid.remove();
        }
    }

    private on_connection_failed() {
        console.warn('onConnectionFailed');
    }

    private on_conference_joined() {
        this.joined_jitsi = true;
        this.add_all_loc_tracks();
    }

    private add_all_loc_tracks() {
        if (this.joined_jitsi) {
            for (const track of this.loc_tracks) {
                this.jitsi_conf.addTrack(track);
            }
        }
    }

    private on_local_tracks(tracks: Track[]) {
        this.loc_tracks = tracks;
        this.add_all_loc_tracks();
    }
}
