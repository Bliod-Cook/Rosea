import "./update.scss"
import {useEffect, useState} from "react";
import {check} from "@tauri-apps/plugin-updater";
import {getCurrentWindow} from "@tauri-apps/api/window";
import {moveWindow, Position} from '@tauri-apps/plugin-positioner';
import {emit} from "@tauri-apps/api/event";

export default function Update() {
    const [isStart, setIsStart] = useState(false)
    const [contentLength, setContentLength] = useState(0)
    const [downloaded, setDownloaded] = useState(0)

    useEffect(() => {
        moveWindow(Position.Center).then()
    }, []);

    useState(((): number => {
        let downloaded_length = 0;
        try {
            check().then(async (update) => {
                if (update) {
                    await update.downloadAndInstall((event) => {
                        switch (event.event) {
                            case "Started":
                                getCurrentWindow().show()
                                if (event.data.contentLength) {
                                    setIsStart(true)
                                    setContentLength(event.data.contentLength)
                                }
                                break;
                            case "Progress":
                                downloaded_length += event.data.chunkLength
                                setDownloaded(downloaded_length)
                                break;
                            case "Finished":
                                break;
                        }
                    })
                }
                await emit("newest-version")
                setTimeout(()=>{getCurrentWindow().close().then()}, 30000)
            })
        } catch (e) {console.log(e)}
        return 1
    })())

    return <div className={"root-div"}>
        <h1 className="app-m-0">{isStart ? (((downloaded/contentLength)*100).toFixed(1) + "%") : "wait"}</h1>
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