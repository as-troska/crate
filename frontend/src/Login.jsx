import React from "react";
import ReactDOM from "react-dom";
import {useEffect, useState} from "react";

export default () => (
    <>
       <Authorize /> 
    </>    
)

function Authorize() {
    const [tokenState, setTokenState] = useState("unauthorized");
    const [lastfmAuthUrl, setLastfmAuthUrl] = useState("null");
    const [lastFMState, setLastFMState] = useState("unauthorized");

    useEffect(() => {
        async function checkForSession() {
            const result = await fetch("http://localhost:3000/checkLastFMAuthorized");
            const data = await result.text();

            if (data === "authorized") {
                setLastFMState("authorized");
            } else {
                setLastFMState("unauthorized");
            }
        }
        checkForSession();
    }, []);

    useEffect(() => {
        async function getKey() {            
        const result = await fetch("http://localhost:3000/getKey")
        const data = await result.text();

        console.log(data)

        setLastfmAuthUrl("http://www.last.fm/api/auth/?api_key=" + data + "&cb=http://localhost:3000/authLastFM")
        }
        getKey();
    }, []);
    

    useEffect(() => {
        async function checkForTokens () {
            const result = await fetch("http://localhost:3000/hasAppTokens")
            const contentType = result.headers.get("Content-Type");

            let data;
            if (contentType && contentType.includes("application/json")) {
                data = await result.json();
            } else {
                data = await result.text();
            }

            console.log(data)
            console.log(data.length)
            if (data === "authorized") {
                setTokenState("authorized");
            } else if (data.length > 20) {
                setTokenState(data);
            } else {
                setTokenState("unauthorized");
            }
        }
        checkForTokens();
    }, []);

    return (        
        <main>          
            {console.log(tokenState)}
            {tokenState.length > 20 &&                
                <p><a href={`https://discogs.com/oauth/authorize?oauth_token=${tokenState}`}>Click here to get authorize this App with your Discogs-account</a></p>
            }

            {tokenState === "authorized" &&
                <p>Discogs Authorized!</p>
            }

            {tokenState === "unauthorized" &&
                <p><a href={`${lastfmAuthUrl}`}>Authorize Last.FM</a></p>
            }

            {lastFMState === "authorized" &&
                <p>Last.FM Authorized!</p>
            }
            


        </main>        
    )
}
