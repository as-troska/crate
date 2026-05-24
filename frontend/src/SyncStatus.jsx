import { API } from "./api";
import React, { useState, useEffect } from "react";

export default function SyncStatus({ token }) {
    const [status, setStatus] = useState(null);

    useEffect(() => {
        let timer;

        async function poll() {
            try {
                const res = await fetch(API + "/syncStatus", {
                    headers: { "Authorization": "Bearer " + token }
                });
                const data = await res.json();
                setStatus(data);
                if (data.running || data.queued > 0) {
                    timer = setTimeout(poll, 3000);
                }
            } catch {
                // silently ignore
            }
        }

        poll();
        return () => clearTimeout(timer);
    }, [token]);

    if (!status || (!status.running && status.queued === 0 && status.total === 0)) return null;

    const percent = status.total > 0 ? Math.round((status.done / status.total) * 100) : 0;

    return (
        <div className="sync-banner">
            {status.running || status.queued > 0 ? (
                <>
                    <span className="sync-spinner" />
                    <span>Syncing collection… {status.done}/{status.total}</span>
                    <div className="sync-bar">
                        <div className="sync-bar-fill" style={{ width: percent + "%" }} />
                    </div>
                </>
            ) : (
                <span>Collection synced ({status.done} releases)</span>
            )}
        </div>
    );
}
