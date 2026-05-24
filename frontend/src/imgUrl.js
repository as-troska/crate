import { API } from "./api";

export function imgUrl(url) {
    if (!url) return "";
    return API + "/img?u=" + encodeURIComponent(url);
}
