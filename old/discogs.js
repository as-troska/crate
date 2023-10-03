const mongos = require("../old/mongo")
const axios = require("axios");

let tokenSecrets = "";

////////////////////////////////////////////////////////
//         FUNKSJONER FOR Å HENTE FRÅ APIET          //
//////////////////////////////////////////////////////

async function getRecord(req, res) {
    const record = req.query.record;
    const tokens = await mongos.hentToken("oauth", "discogs");
    axios({
        method: "GET",
        url: "https://api.discogs.com/releases/" + record,
        headers: {
            'Content-Type': "application/x-www-form-urlencoded",
            "Authorization": `OAuth oauth_consumer_key="${appId}", oauth_nonce="${getNonce()}", oauth_signature="${appSecret}&${tokens.tokenSecret}", oauth_signature_method="PLAINTEXT", oauth_timestamp="${getTimeStamp()}",oauth_token="${tokens.token}"`,
            'User-agent': "Mozilla/5.0",
        }
    }).then((response) => {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(response.data));

    }).catch((error) => {
        console.log(error)
    });
}

async function getCollection(req, res) {
    const number = req.query.results;
    let page = req.query.page;

    let url ="";

    page = 0
    const nextPage = ""

    

    if (number > 0) {
        url = "https://api.discogs.com/users/trondss/collection/folders/1/releases?per_page=" + number
    }
    else {
        url = "https://api.discogs.com/users/trondss/collection/folders/1/releases?per_page=500"
    }

    
    const tokens = await mongos.hentToken("oauth", "discogs");
    axios({
        method: "GET",
        url: url,
        headers: {
            'Content-Type': "application/x-www-form-urlencoded",
            "Authorization": `OAuth oauth_consumer_key="${appId}", oauth_nonce="${getNonce()}", oauth_signature="${appSecret}&${tokens.tokenSecret}", oauth_signature_method="PLAINTEXT", oauth_timestamp="${getTimeStamp()}",oauth_token="${tokens.token}"`,
            'User-agent': "Mozilla/5.0",
        }
    }).then((response) => {
        //let nextPage = response.pagination.next;
        //console.log(nextPage)
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(response.data));
    }).catch((error) => {
        console.log(error)
    });
}

async function getIdentity(req, res) {
    const tokens = await mongos.hentToken("oauth", "discogs");
    axios({
        method: "GET",
        url: "https://api.discogs.com/oauth/identity",
        headers: {
            'Content-Type': "application/x-www-form-urlencoded",
            "Authorization": `OAuth oauth_consumer_key="${appId}", oauth_nonce="${getNonce()}", oauth_signature="${appSecret}&${tokens.tokenSecret}", oauth_signature_method="PLAINTEXT", oauth_timestamp="${getTimeStamp()}",oauth_token="${tokens.token}"`,
            'User-agent': "Mozilla/5.0",
        }
    }).then((response) => {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(response.data));
    }).catch((error) => {
        console.log(error)
    });
};

////////////////////////////////////////////////////////
//         FUNKSJONER FOR AUTORISERING               //
//////////////////////////////////////////////////////

async function authorize(req, res) {
    axios({
        method: "GET",
        url: "https://api.discogs.com/oauth/request_token",
        headers: {
            'Content-Type': "application/x-www-form-urlencoded",
            "Authorization": `OAuth oauth_consumer_key="${appId}", oauth_nonce="${getNonce()}", oauth_signature="${appSecret}&", oauth_signature_method="PLAINTEXT", oauth_timestamp="${getTimeStamp()}", oauth_callback="http://localhost:8080/oauth/redirect/"`,
            'User-agent': "Mozilla/5.0",
        },
    }).then((response) => {
        let stringArr = response.data.split("&");
        let token = stringArr[0].split("=")[1];
        let tokenSecret = stringArr[1].split("=")[1];
        tokenSecrets = tokenSecret;

        res.redirect("https://discogs.com/oauth/authorize?oauth_token=" + token + "&oauth_token_secret=" + tokenSecret)
    }).catch((error) => {
        console.log(error.config.headers);
        console.log(error);
    })
}

async function getTokens(req, res) {
    const requestToken = req.query.oauth_token;
    const verifier = req.query.oauth_verifier;

    await axios({
        method: "POST",
        url: "https://api.discogs.com/oauth/access_token",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": `OAuth oauth_consumer_key=${appId}, oauth_nonce=${getNonce()}, oauth_token=${requestToken}, oauth_signature=${appSecret}&${tokenSecrets}, oauth_signature_method="PLAINTEXT", oauth_timestamp="${getTimeStamp()}", oauth_verifier=${verifier}`,
            "User-Agent": "Mozilla/5.0"
        },
    }).then((response) => {
        let stringArr = response.data.split("&");
        let token = stringArr[0].split("=")[1];
        let tokenSecret = stringArr[1].split("=")[1];

        let lagring = {
            "token": token,
            "tokenSecret": tokenSecret
        }

        mongos.skrivToken("oauth", "discogs", lagring);

        console.log("oauthToken:" + token)
        console.log("oauthTokenSecret:" + tokenSecret)
        res.redirect("/index.html?SUKSESS") 
    }).catch((error) => {
        console.log(error.config.headers)
        console.log(error)
    });
};

////////////////////////////////////////////////////////
//             HJELPEFUNKSJONER                      //
//////////////////////////////////////////////////////

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

////////////////////////////////////////////////////////
//             EKSPORTER                             //
//////////////////////////////////////////////////////

exports.getRecord = getRecord;
exports.getCollection = getCollection;
exports.authorize = authorize;
exports.getTokens = getTokens;
exports.getIdentity = getIdentity;


