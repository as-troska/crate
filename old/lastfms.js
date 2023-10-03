const mongos = require("./mongo")
const axios = require("axios");
const md5 = require("md5")
const url = require("url")



////////////////////////////////////////////////////////
//         FUNKSJONER FOR Å SKRIVE TIL APIET         //
//////////////////////////////////////////////////////



async function scrobble(req, res) {
    const scrobbleURL = "http://ws.audioscrobbler.com/2.0/";
    const tid = getTimeStamp();
    let sk = await mongos.hentToken("oauth", "lastfm")
    sk = sk.token

    const artist = req.query.artist;
    const track = req.query.track;
    const album = req.query.album;

    const signature = md5("album" + album + "api_key" + lastFmApiKey + "artist" + artist + "methodtrack.scrobble" + "sk" + sk + "timestamp" + tid + "track" + track + lastFmSecret);

    let body = {
        method: "track.scrobble",
        artist: artist,
        track: track,
        timestamp: tid,
        album: album,
        api_key: lastFmApiKey,
        api_sig: signature,
        sk: sk,
    }

    const params = new url.URLSearchParams(body)

    axios({
        method: "POST",
        url: scrobbleURL,
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        data: params.toString(),
    }).then((response) => {
        console.log(response)
    }).catch((error) => {
        console.log(error)
    })

}





////////////////////////////////////////////////////////
//         FUNKSJONER FOR AUTORISERING               //
//////////////////////////////////////////////////////

async function authorize(req, res) {
    const lastFmtoken = req.query.token;

    let hashedSignature = md5("api_key" + lastFmApiKey + "methodauth.getSession" + "token" + lastFmtoken + lastFmSecret);
    let urlString = "http://ws.audioscrobbler.com/2.0/" + "?method=auth.getSession&token=" + lastFmtoken + "&api_key=" + lastFmApiKey + "&api_sig=" + hashedSignature;

    await axios({
        method: "GET",
        url: urlString
    }).then((response) => {
        let dataArray = response.data.split("<key>");
        dataArray = dataArray[1].split("</key>")
        let key = dataArray[0]

        let lagring = {
            "api": "lastfm",
            "token": key
        }

        mongos.skrivToken("oauth", "lastfm", lagring);

        res.redirect("/index.html?SUKSESS")

    }).catch((error) => {
        console.log(error)
    })
};

////////////////////////////////////////////////////////
//             HJELPEFUNKSJONER                      //
//////////////////////////////////////////////////////

/**
 * Hjelpefunksjon for å lage eit timestamp for tida her og no
 * @returns {Number} Timestamp
 */
function getTimeStamp() {
    return Math.floor(new Date().getTime() / 1000);
};

////////////////////////////////////////////////////////
//             EKSPORTER                             //
//////////////////////////////////////////////////////

exports.authorize = authorize;
exports.scrobble = scrobble;