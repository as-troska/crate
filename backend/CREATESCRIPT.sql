-- SQLite
DROP TABLE app;

CREATE TABLE app (
    id INTEGER PRIMARY KEY,
    requestToken TEXT,
    requestTokenSecret TEXT,
    requestTokenExpires INTEGER,
    oauthToken TEXT,
    oauthTokenSecret TEXT,
    lastfmAuthToken TEXT,
    lastfmSessionKey TEXT,
    lastfmSignature TEXT
);