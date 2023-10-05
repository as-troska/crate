const express = require("express");
const db = require("better-sqlite3")("user.db");
const discogs = require("./discogs")
const lastfm = require("./lastfm")
const cors = require("cors")

const app = express();
const port = 3000;



app.use(cors())


app.get("/hasAppTokens", discogs.hasAppTokens)
app.get("/fetchAppTokens", discogs.getAppTokens)
app.get("/authorize", discogs.captureVerifier)
app.get("/getKey", lastfm.giveKey)
app.get("/authLastFM", lastfm.authorize)
app.get("/checkLastFMAuthorized", lastfm.checkLastFmAuthorized)
app.get("/getCollection", discogs.getCollection)
app.get("/getIdentity", discogs.getIdentity)


app.listen(port, () => {
    console.log("Backend running at: http://localhost:" + port)
})

