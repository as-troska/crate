import React from "react";
import ReactDOM from "react-dom";
import {useEffect, useState} from "react";

export default () => (
    <>
        <Collection />
    </>

)


function Collection() {
    const [loading, setLoading] = useState(true);
    const [collection, setCollection] = useState([]);

    useEffect(() => {
        async function getCollection() {
            const result = await fetch("http://localhost:3000/getCollection");
            const data = await result.json();

            setCollection(data.releases);
            console.log(collection)
            setLoading(false);
        }
        getCollection();
    }, []);

    return (
        <main>
            <h1>Collection</h1>
            
            {loading &&
                <p>Loading collection...</p>
            }
            <section>

 
            {!loading && collection.map((release) => (
                 <Record release={release} key={release.id} />
            ))}


            </section>
        </main>
    )
}

function Record(release) {
    
    console.log(release)
    return (      

        <figure>
            <img src={release.release.basic_information.cover_image} alt={release.release.basic_information.title} />
            <figcaption>
            <p>{release.release.basic_information.artists[0].name} - {release.release.basic_information.title}</p>
            </figcaption>
        </figure>
    )
}
