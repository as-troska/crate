//mongoDb
const {MongoClient} = require("mongodb");
const uri = "mongodb://****/?maxPoolSize=20&w=majority";
const client = new MongoClient(uri)

const database = "oauth";


async function sjekkKobling() {
    try {
        await client.connect();
        await client.db(database).command({ping: 1
        });
        console.log("Kopla opp mot mongoDB: " + database);
    } finally {
        await client.close();
    }
}

async function skrivToken(database, api, token) {
    try {
        await client.connect();
        const svar = await client.db(database).collection(api).insertOne(token);
        console.log("Lagt til i databasen med følgande ID:" + svar.insertedId);
    } catch(error) {
        console.log(error)
    } finally {
        await client.close()
    }
}

async function hentToken(database, api) {
    try {
        await client.connect();
        const svar = await client.db(database).collection(api).findOne();
        if (svar.token != null) {
            return svar
        } else {
            console.log("Token finst ikkje i databasen")
        }        
    } catch(error) {
        console.log(error)
    } finally {
        await client.close()
    }
}

////////////////////////////////////////////////////////
//             EKSPORTER                             //
//////////////////////////////////////////////////////

exports.sjekkKobling = sjekkKobling;
exports.skrivToken = skrivToken;
exports.hentToken = hentToken;

