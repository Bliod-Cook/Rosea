import "./update.scss"
import {useEffect, useState} from "react";
import {check} from "@tauri-apps/plugin-updater";
import {getCurrentWindow} from "@tauri-apps/api/window";
import {moveWindow, Position} from '@tauri-apps/plugin-positioner';
import {emit} from "@tauri-apps/api/event";
import {Box, LinearProgress, Typography, Paper, CircularProgress} from "@mui/material";
import SystemUpdateAltIcon from '@mui/icons-material/SystemUpdateAlt';

export default function Update() {
    const [isStart, setIsStart] = useState(false)
    const [contentLength, setContentLength] = useState(0)
    const [downloaded, setDownloaded] = useState(0)
    const [updateStatus, setUpdateStatus] = useState("Checking for updates...")

    useEffect(() => {
        moveWindow(Position.Center).then()
    }, []);

    useEffect(() => {
        let downloaded_length = 0;
        try {
            check().then(async (update) => {
                if (update) {
                    setUpdateStatus("New version found, preparing download...")
                    await update.downloadAndInstall((event) => {
                        switch (event.event) {
                            case "Started":
                                getCurrentWindow().show()
                                if (event.data.contentLength) {
                                    setIsStart(true)
                                    setContentLength(event.data.contentLength)
                                    setUpdateStatus("Downloading update...")
                                }
                                break;
                            case "Progress":
                                downloaded_length += event.data.chunkLength
                                setDownloaded(downloaded_length)
                                break;
                            case "Finished":
                                setUpdateStatus("Download complete, preparing to install...")
                                break;
                        }
                    })
                } else {
                    setUpdateStatus("Already on the latest version")
                    const timeout = setTimeout(() => {
                        emit("notice://newest-version").then()
                        getCurrentWindow().close().then()
                    }, 1500)
                    return () => {clearTimeout(timeout)}
                }
            })
        } catch (e) {
            console.log(e)
            setUpdateStatus("Update check failed")
        }
    }, [])

    const progress = isStart ? (downloaded * 100 / contentLength) : 0
    
    return (
        <Box className={"root-div"} display={"flex"} flexDirection={"column"} 
             justifyContent={"flex-start"} alignItems={"center"} 
             height={"100vh"} padding={4} paddingTop={2}>
            <Paper elevation={3} sx={{ padding: 4, borderRadius: 2, maxWidth: "400px", width: "100%", marginTop: "20px" }}>
                <Box display={"flex"} flexDirection={"column"} alignItems={"center"} gap={3}>
                    {/* Update icon */}
                    <SystemUpdateAltIcon color="primary" sx={{ fontSize: 48 }} />
                    
                    {/* Status message */}
                    <Typography variant="h5" fontWeight="bold" color="primary">
                        {updateStatus}
                    </Typography>
                    
                    {isStart ? (
                        <>
                            <Box width="100%" display="flex" flexDirection="column" gap={1}>
                                {/* Progress information */}
                                <Box display="flex" justifyContent="space-between" width="100%">
                                    <Typography variant="body2" color="text.secondary">
                                        Download Progress
                                    </Typography>
                                    <Typography variant="body2" fontWeight="medium">
                                        {progress.toFixed(1)}%
                                    </Typography>
                                </Box>
                                {/* Progress bar */}
                                <LinearProgress 
                                    variant="determinate" 
                                    value={progress} 
                                    sx={{ height: 8, borderRadius: 4 }}
                                />
                                
                                {/* File size information */}
                                <Typography variant="caption" color="text.secondary" align="center" sx={{ mt: 1 }}>
                                    {(downloaded / (1024 * 1024)).toFixed(2)} MB / {(contentLength / (1024 * 1024)).toFixed(2)} MB
                                </Typography>
                            </Box>
                        </>
                    ) : (
                        // Loading spinner shown before download starts
                        <CircularProgress size={40} thickness={4} />
                    )}
                </Box>
            </Paper>
        </Box>
    )
}