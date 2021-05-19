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

    static create_many_media(conf_id: string) : YtVideoMap {
        const vids = [
            'https://upload.wikimedia.org/wikipedia/commons/transcoded/6/6c/Feuer2007-10-16.ogv/Feuer2007-10-16.ogv.480p.vp9.webm',
            'https://upload.wikimedia.org/wikipedia/commons/transcoded/7/75/Bach-Minuet-F-Major.ogv/Bach-Minuet-F-Major.ogv.360p.vp9.webm',
            'https://upload.wikimedia.org/wikipedia/commons/transcoded/7/73/Obama_senate_10_01_08.ogv/Obama_senate_10_01_08.ogv.240p.vp9.webm',
            'https://upload.wikimedia.org/wikipedia/commons/transcoded/e/e7/President_Obama_calls_the_ISS.ogv/President_Obama_calls_the_ISS.ogv.360p.vp9.webm',
            'https://upload.wikimedia.org/wikipedia/commons/transcoded/b/b8/President_Obama_%26_NASA_Astronaut_Scott_Kelly.webm/President_Obama_%26_NASA_Astronaut_Scott_Kelly.webm.360p.vp9.webm',
            'https://upload.wikimedia.org/wikipedia/commons/transcoded/0/06/President_Barack_Obama%27s_first_Oval_Office_address.ogv/President_Barack_Obama%27s_first_Oval_Office_address.ogv.360p.vp9.webm',
            'https://upload.wikimedia.org/wikipedia/commons/transcoded/1/12/President_Obama_on_Death_of_Osama_bin_Laden.ogv/President_Obama_on_Death_of_Osama_bin_Laden.ogv.360p.vp9.webm',
            'https://upload.wikimedia.org/wikipedia/commons/transcoded/7/7d/President_Obama%27s_Bilateral_Meeting_with_President_Sebasti%C3%A1n_Pi%C3%B1era_of_Chile.webm/President_Obama%27s_Bilateral_Meeting_with_President_Sebasti%C3%A1n_Pi%C3%B1era_of_Chile.webm.360p.vp9.webm',
            'https://upload.wikimedia.org/wikipedia/commons/transcoded/5/5e/President_Obama_Meets_With_President-Elect_Trump.webm/President_Obama_Meets_With_President-Elect_Trump.webm.360p.vp9.webm',
            'https://upload.wikimedia.org/wikipedia/commons/transcoded/c/c2/President_Obama_Addresses_the_UN_General_Assembly.webm/President_Obama_Addresses_the_UN_General_Assembly.webm.360p.vp9.webm',
            'https://upload.wikimedia.org/wikipedia/commons/transcoded/d/d6/Safeguarding_Our_Planet.webm/Safeguarding_Our_Planet.webm.360p.vp9.webm',
            'https://upload.wikimedia.org/wikipedia/commons/transcoded/a/a9/Wird_Th%C3%BCringen_unregierbar_-_YouTube.webm/Wird_Th%C3%BCringen_unregierbar_-_YouTube.webm.360p.vp9.webm',
            'https://upload.wikimedia.org/wikipedia/commons/transcoded/4/46/Katja_Kipping_%28Vorsitzende_von_Die_Linke%29_-_Jung_%26_Naiv_Folge_87_-_YouTube.webm/Katja_Kipping_%28Vorsitzende_von_Die_Linke%29_-_Jung_%26_Naiv_Folge_87_-_YouTube.webm.360p.vp9.webm'
        ];
        const res = new YtVideoMap(new Conference(conf_id), {});
        for (let i=0; i < vids.length; i++) {
            res.set_vid('num' + i, vids[i]);
        }
        return res;
    }

}
