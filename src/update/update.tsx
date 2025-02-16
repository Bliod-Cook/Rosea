import "./update.scss"
import {useEffect, useState} from "react";
import {check} from "@tauri-apps/plugin-updater";
import {getCurrentWindow} from "@tauri-apps/api/window";
import {moveWindow, Position} from '@tauri-apps/plugin-positioner';
import {emit} from "@tauri-apps/api/event";
import {Box, LinearProgress} from "@mui/material";

export default function Update() {
    const [isStart, setIsStart] = useState(false)
    const [contentLength, setContentLength] = useState(0)
    const [downloaded, setDownloaded] = useState(0)

    useEffect(() => {
        moveWindow(Position.Center).then()
    }, []);

    useEffect(() => {
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
    }, [])

    return <Box className={"root-div"} display={"flex"} flexDirection={"column"}>
        <Box marginX={"auto"}><h1>{isStart ? (((downloaded / contentLength) * 100).toFixed(1) + "%") : "wait"}</h1></Box>
        <Box marginX={"auto"} width={"250px"}><LinearProgress value={isStart ? (downloaded/contentLength) : undefined} variant={isStart ? "determinate" : undefined}></LinearProgress></Box>
    </Box>
}