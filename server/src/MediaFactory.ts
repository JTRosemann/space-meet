import { Conference } from "../../common/src/Conference";
import { YtVideoMap } from "./YtVideoMap";

export class MediaFactory {

    static create_std_media(conf_id: string) : YtVideoMap {
        const conf = new Conference(conf_id);
        const res = new YtVideoMap(conf, {});
        res.set_vid('dogs', 'https://upload.wikimedia.org/wikipedia/commons/transcoded/0/08/Alaskan_Huskies_-_Sled_Dogs_-_Ivalo_2013.ogv/Alaskan_Huskies_-_Sled_Dogs_-_Ivalo_2013.ogv.480p.vp9.webm');
        res.set_vid('goats', 'https://upload.wikimedia.org/wikipedia/commons/transcoded/d/dd/Goats_in_Sunnyvale.webm/Goats_in_Sunnyvale.webm.480p.webm');
        res.set_vid('lynxen', 'https://upload.wikimedia.org/wikipedia/commons/8/8a/Rustende_lynxen_in_bos-Stichting_Natuurbeelden-172347.webm');
        res.set_vid('fire', 'https://www.youtube.com/watch?v=L_LUpnjgPso');
        res.set_vid('lofi', 'https://www.youtube.com/watch?v=5qap5aO4i9A');
        //res.set_yt_audio('codepen', 'https://youtube.com/get_video_info?video_id=CMNry4PE93Y');
        return res;
    }

}
