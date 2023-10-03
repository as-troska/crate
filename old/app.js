const express = require("express");
const axios = require("axios");
const mongos = require("./mongo");
const discogs = require("./discogs")
const lastfm = require("./lastfm")

const app = express();
const port = 8080;

////////////////////////////////////////////////////////
//                      RUTER                        //
//////////////////////////////////////////////////////

app.get("/oauth/authorize", discogs.authorize)
app.get("/discogs/identity", discogs.getIdentity);
app.get("/discogs/getCollection", discogs.getCollection);
app.get("/discogs/getRecord", discogs.getRecord);
app.get("/oauth/redirect", discogs.getTokens);
app.get("/lastfm", lastfm.authorize);
app.get("/scrobble", lastfm.scrobble);

app.use(express.static(__dirname + "/public"));

////////////////////////////////////////////////////////
//                     KØYR                          //
//////////////////////////////////////////////////////

app.listen(port);
console.log("Sørveren køyrer på localhost port " + port)

mongos.sjekkKobling().catch(console.dir);





