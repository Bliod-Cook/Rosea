import {useEffect, useState} from "react";
import "./App.scss"
import {getCurrentWindow} from "@tauri-apps/api/window";
import {visibility as gClickThrough} from "./init/tray.ts";
import {moveWindow, Position} from "@tauri-apps/plugin-positioner";
import {Box} from "@mui/material";

export default function App() {
    const [time, setTime] = useState((new Date()).toLocaleTimeString())

    useEffect(() => {
        setInterval(() => {
            setTime((new Date()).toLocaleTimeString())
        }, 1000)
    }, []);

    const [moveable, setMoveable] = useState(false)

    function moveToTopLeft() {
        moveWindow(Position.TopLeft).then()
    }

    useEffect(() => {
        const window = getCurrentWindow();
        window.listen("change://clock/move-ability", (event) => {
            setMoveable(event.payload as boolean)
        }).then()

        window.listen("change://clock/visibility", (event) => {
            if (event.payload as boolean) {
                window.show().then()
            } else {
                window.hide().then()
            }
        }).then()

        window.listen("reset://clock/position", moveToTopLeft).then()
    }, []);

    return (
        <>
            <div id={"main-div"}
                 className={`${moveable?"tauri-drag":undefined}`}
                 draggable={false}
                 onContextMenu={(e)=>{e.preventDefault()}}
            >
                <Box
                    marginX={"auto"}
                    marginY={"auto"}
                ><span>{time}</span></Box>
            </div>
        </>
    )
}