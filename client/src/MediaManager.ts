import { Conference } from "../../common/src/Conference";
import { CallIDEmitter } from "../../common/src/protocol";
import { DirectVideoRsrcs } from "./DirectVideoRsrcs";
import { JitsiConference } from "./JitsiConference";

export class MediaManager {
    //TODO generalize this class to a list of ressource mappers
    //     - define interface MediaManagerI<RsrcsMap>
    //     - make this class is then a collection of MediaManagers - but with different types
    private j_conf: JitsiConference;
    private direct_vid: DirectVideoRsrcs;
    private user_id: string;

    constructor(conf: Conference, user_id: string, carrier: CallIDEmitter) {
        this.j_conf = new JitsiConference(conf, user_id, carrier);
        this.user_id = user_id;
    }

    /**
     * Get the HTMLVideoElement corresponding to this id, if any. Undefined otherwise.
     * @param id of the requested video
     * @returns the video corresponding to `id`
     */
    get_video(id: string) : HTMLVideoElement {
        const jitsi_vid = this.j_conf.get_video(id);
        return jitsi_vid ? jitsi_vid : this.direct_vid.get_video(id);
    }

    /**
     * Get the audio MediaStream corresponding to this id, if any. Undefined otherwise.
     * @param id of the requested audio
     * @returns the audio MediaStream corresponding to `id`
     */
    get_audio(id: string) : MediaStream {
        const jitsi_audio = this.j_conf.get_audio(id);
        return jitsi_audio ? jitsi_audio : this.direct_vid.get_audio(id);
    }

    /**
     * Update the conference.
     * @param conf the updated conference
     */
    incorporate_update(conf: Conference) {
        this.j_conf.incorporate_update(conf);
    }
}
