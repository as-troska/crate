import React from "react";

export default function Privacy({ onClose }) {
    return (
        <div className="privacy-overlay" onClick={onClose}>
            <div className="privacy-modal" onClick={e => e.stopPropagation()}>
                <button className="privacy-close btn-ghost" onClick={onClose}>✕</button>
                <h2>Personvern og datalagring</h2>
                <p className="privacy-intro">
                    Crate er eit personleg verktøy — ikkje ein kommersiell teneste.
                    Vi samlar inn så lite som mogleg, og brukar ingenting til anna enn at appen skal fungere.
                </p>

                <h3>Kva vi lagrar</h3>
                <ul>
                    <li><strong>Brukarnamn og passord</strong> — passord lagrast som ein einvegskryptert hash (scrypt). Vi kan ikkje lese passordet ditt.</li>
                    <li><strong>OAuth-token for Discogs</strong> — for å hente samlinga di. Lagrast lokalt i databasen på din eigen maskin.</li>
                    <li><strong>Sesjonsnøkkel for Last.fm</strong> — for å skrobble spor. Same lagring.</li>
                    <li><strong>Platesamlinga di</strong> — tittlar, artistar, omslagsbilete og sporsettlistar henta frå Discogs og mellomlagra lokalt.</li>
                    <li><strong>Omslagsbilete</strong> — henta frå Discogs sitt CDN og lagra på disk, slik at dei ikkje vert lasta ned fleire gonger.</li>
                </ul>

                <h3>Kva vi <em>ikkje</em> gjer</h3>
                <ul>
                    <li>Vi sender ingen data til tredjepart (anna enn det som er naudsynt for Discogs- og Last.fm-integrasjonen).</li>
                    <li>Vi brukar ingen analyseverktøy, sporingspikslar eller informasjonskapslar utover sesjonstoken.</li>
                    <li>Vi sel, deler eller analyserer ikkje dine data.</li>
                </ul>

                <h3>Dataen din er lokal</h3>
                <p>
                    All data lagrast i ein SQLite-database på din eigen maskin. Ingen ekstern server er involvert.
                    Du har full kontroll.
                </p>

                <h3>Retten til sletting (GDPR art. 17)</h3>
                <p>
                    Du kan slette kontoen din og alle tilhøyrande data frå innstillingane i appen.
                    Dette fjernar brukarnamn, passord-hash, OAuth-token, sesjonar og heile samlinga frå databasen.
                    Bilete i den lokale biletemappa vert ikkje automatisk sletta (du kan gjere det manuelt frå <code>backend/imgcache/</code>).
                </p>

                <h3>Kontakt</h3>
                <p>Spørsmål? Ta kontakt med den som driftar denne instansen av Crate.</p>
            </div>
        </div>
    );
}
