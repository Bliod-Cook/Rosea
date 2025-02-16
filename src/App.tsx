import {useEffect, useState} from "react";
import "./App.scss"
import {getCurrentWindow} from "@tauri-apps/api/window";
import {click_through as gClickThrough, moveable as gMoveable} from "./init/tray.ts";
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

    function changeMoveable() {
        setMoveable(gMoveable);
        getCurrentWindow().setIgnoreCursorEvents(!gMoveable).then()
    }

    function moveToTopLeft() {
        moveWindow(Position.TopLeft).then()
    }

    useEffect(() => {
        const window = getCurrentWindow();
        window.listen("change_moveable", () => {
            changeMoveable()
        }).then()
        window.listen("change-clickThrough", () => {
            if (gClickThrough) {
                window.hide().then();
            } else {
                window.show().then()
            }
        }).then()
        window.listen("move-top-left", moveToTopLeft).then()
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