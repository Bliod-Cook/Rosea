import "./update.css"
import {useEffect, useState} from "react";
import {check} from "@tauri-apps/plugin-updater";
import {getCurrentWindow} from "@tauri-apps/api/window";
export default function Update() {
    const [isStart, setIsStart] = useState(false)
    const [contentLength, setContentLength] = useState(0)
    const [downloaded, setDownloaded] = useState(0)

    useEffect(() => {
        try {
            check().then(async (update) => {
                if (update) {
                    await getCurrentWindow().show()
                    await update.downloadAndInstall((event) => {
                        switch (event.event) {
                            case "Started":
                                if (event.data.contentLength) {
                                    setIsStart(true)
                                    setContentLength(event.data.contentLength)
                                }
                                break;
                            case "Progress":
                                setDownloaded(downloaded + event.data.chunkLength)
                                break;
                            case "Finished":
                                break;
                        }
                    })
                }
            })
        } catch (e) {}
        getCurrentWindow().close().then()
    }, []);

    return <div className={"root-div"}>
        <h1 className="app-m-0">{isStart ? ((downloaded/contentLength)*100 + "%") : "wait"}</h1>
        <div className="app-progress-container">
            <div className="app-progress-content">
                <div className="app-progress-bar">
                    <span
                        role="progressbar"
                        style={{
                            width: isStart ? ((downloaded/contentLength)*200) : 200
                        }}
                        className={isStart ? "" : "indeterminate"}
                    ></span>
                </div>
            </div>
        </div>
    </div>
}