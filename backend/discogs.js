const db = require("better-sqlite3")("user.db");
require('dotenv').config()

const appid = process.env.DISCOGSAPPID;
const appSecret = process.env.DISCOGSAPPSECRET;

// Functions for getting data from Discogs API

async function getIdentity(req, res) {
    const currentTokens = db.prepare("SELECT * FROM app WHERE id = ?").get(1);
    const authString = `OAuth oauth_consumer_key="${appid}", oauth_nonce="${getNonce()}", oauth_token="${currentTokens.oauthToken}", oauth_signature="${appSecret}&${currentTokens.oauthTokenSecret}", oauth_signature_method="PLAINTEXT", oauth_timestamp="${getTimeStamp()}"`

    const response = await fetch("https://api.discogs.com/oauth/identity", {
        method: "GET",
        headers: {
            'Content-Type': "application/x-www-form-urlencoded",
            'Authorization': authString,
            'User_Agent': "Mozilla/5.0"
        }
    })
    const data = await response.json()
    
    const username = data.username;
    const userid = data.id;
    const profile = data.resource_url;

    return {
        username: username, 
        userid: userid, 
        profile: profile
    }
}

async function getCollection(req, res) {
    const identity = await getIdentity();    

    const currentTokens = db.prepare("SELECT * FROM app WHERE id = ?").get(1);
    const authString = `OAuth oauth_consumer_key="${appid}", oauth_nonce="${getNonce()}", oauth_token="${currentTokens.oauthToken}", oauth_signature="${appSecret}&${currentTokens.oauthTokenSecret}", oauth_signature_method="PLAINTEXT", oauth_timestamp="${getTimeStamp()}"`

    const response = await fetch("https://api.discogs.com/users/" + identity.username +"/collection/folders/0/releases?per_page=100", {
        method: "GET",
        headers: {
            'Content-Type': "application/x-www-form-urlencoded",
            'Authorization': authString,
            'User_Agent': "Mozilla/5.0"
        }
    })
    const data = await response.json()

    const collection = {
        username: identity.username,
        userid: identity.userid,
        releases: [],
        items: data.pagination.items,        
        pages: data.pagination.pages
    }
    
    for (let release of data.releases) { 
        collection.releases.push(release)
    }

    for (let page = 2; page <= data.pagination.pages; page++) {
        const response = await fetch("https://api.discogs.com/users/" + identity.username +"/collection/folders/0/releases?per_page=100&page=" + page, {
            method: "GET",
            headers: {
                'Content-Type': "application/x-www-form-urlencoded",
                'Authorization': authString,
                'User_Agent': "Mozilla/5.0"
            }
        })
        const data = await response.json()

        for (let release of data.releases) { 
            collection.releases.push(release)
        }
    }

    console.log(collection.releases.length)

    res.send(collection)
}


// Functions and routes for authentication with Discogs API

async function getAppTokens(req, res) {
    const response = await fetch("https://api.discogs.com/oauth/request_token", {
        method: "GET",
        headers: {
            'Content-Type': "application/x-www-form-urlencoded",
            "Authorization": `OAuth oauth_consumer_key="${appid}", oauth_nonce="${getNonce()}", oauth_signature="${appSecret}&", oauth_signature_method="PLAINTEXT", oauth_timestamp="${getTimeStamp()}", oauth_callback="http://localhost:3000/authorize"`,
            'User-agent': "Mozilla/5.0",
        }        
    })
    const data = await response.text()
    
    const stringArr = data.split("&");
    const token = stringArr[0].split("=")[1];
    const tokenSecret = stringArr[1].split("=")[1];
    const expires = getTimeStamp() + 900;

    if (token && tokenSecret) {
        const firstCheck = db.prepare("SELECT * FROM app WHERE id = ?").get(1)
        if (!firstCheck) {
            db.prepare("INSERT INTO app (id, requestToken, requestTokenSecret, requestTokenExpires) VALUES (?, ?, ?, ?)").run(1, token, tokenSecret, expires);
        } else {
            db.prepare("UPDATE app SET requestToken = ?, requestTokenSecret = ?, requestTokenExpires = ? WHERE id = ?").run(token, tokenSecret, expires, 1);    
        };        
    }
}

async function hasAppTokens(req, res) { 
    const checkForTokens = db.prepare("SELECT * FROM app WHERE id = ?").get(1)
    const currentTime = getTimeStamp();    

    if (checkForTokens.oauthToken) {
        res.send("authorized")
    } else if (checkForTokens && checkForTokens.requestTokenExpires > currentTime) {
        res.send(checkForTokens.requestToken)
    } else { 
        await getAppTokens()
        //const newTokens = db.prepare("SELECT * FROM app WHERE id = ?").get(1)
        res.send("requestable")
    }
}

async function captureVerifier(req, res) { 
    const currentTokens = db.prepare("SELECT * FROM app WHERE id = ?").get(1);

    const authString = `OAuth oauth_consumer_key="${appid}", oauth_nonce="${getNonce()}", oauth_token="${currentTokens.requestToken}", oauth_signature="${appSecret}&${currentTokens.requestTokenSecret}", oauth_signature_method="PLAINTEXT", oauth_timestamp="${getTimeStamp()}", oauth_verifier="${req.query.oauth_verifier}"`
    
    const oauthTokens = await fetch("https://api.discogs.com/oauth/access_token", {
        method: "POST",
        headers: {
            'Content-Type': "application/x-www-form-urlencoded",
            'Authorization': authString,
            'User_Agent': "Mozilla/5.0"
        }
    })
    const data = await oauthTokens.text()

    let stringArr = data.split("&");
    let oauthToken = stringArr[0].split("=")[1];
    let oauthTokenSecret = stringArr[1].split("=")[1];

    const dbUpdate = db.prepare("UPDATE app SET oauthToken = ?, oauthTokenSecret = ? WHERE id = ?").run(oauthToken, oauthTokenSecret, 1)

    res.redirect("http://localhost:5173/")
}


/**
 * Hjelpefunksjon for å generere ein tilfeldig string
 * @returns {string} Tifelding string - 32 teikn
 */
function getNonce() {
    var word_characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    var result = '';

    for (var i = 0; i < 32; i++) {
        result += word_characters[parseInt(Math.random() * word_characters.length, 10)];
    }

    return result;
}

/**
 * Hjelpefunksjon for å lage eit timestamp for tida her og no
 * @returns {Number} Timestamp
 */
function getTimeStamp() {
    return parseInt(new Date().getTime() / 1000, 10);
};

getAppTokens()

exports.getAppTokens = getAppTokens;
exports.hasAppTokens = hasAppTokens;
exports.captureVerifier = captureVerifier;
exports.getCollection = getCollection;
exports.getIdentity = getIdentity;
