const db = require("better-sqlite3")("user.db");
const md5 = require("md5")

require('dotenv').config()

const lastFmApiKey = process.env.LASTFMAPIKEY;
const lastFmSecret = process.env.LASTFMSECRET;

async function giveKey(req, res) {
    res.send(lastFmApiKey)
}

async function checkAuthorized(req, res) {
    const checkForSessionKey = db.prepare("SELECT * FROM app WHERE id = ?").get(1);
    
    if (checkForSessionKey.lastfmSessionKey != null) { 
        res.send("authorized")
    } else {
        res.send("unauthorized")
    }
}

async function getSession(req, res) {
    const token = req.query.token;

    const hashedSignature = md5("api_key" + lastFmApiKey + "methodauth.getSession" + "token" + token + lastFmSecret);
    const urlString = "http://ws.audioscrobbler.com/2.0/" + "?method=auth.getSession&token=" + token + "&api_key=" + lastFmApiKey + "&api_sig=" + hashedSignature;
    
    const result = await fetch(urlString);
    const data = await result.text();

    const key = data.split("<key>")[1].split("</key>")[0]

    const save = db.prepare("UPDATE app SET lastfmSessionKey = ? WHERE id = ?").run(key, 1)

    res.redirect("http://localhost:5173/")
}


exports.giveKey = giveKey;
exports.authorize = getSession;
exports.checkLastFmAuthorized = checkAuthorized;