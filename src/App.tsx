import {useEffect, useState} from "react";
import "./App.scss"
import {getCurrentWindow} from "@tauri-apps/api/window";
import {click_through as gClickThrough, moveable as gMoveable} from "./init/tray.ts";
import {moveWindow, Position} from "@tauri-apps/plugin-positioner";

export default function App() {
    const [time, setTime] = useState((new Date()).toLocaleTimeString())
    setInterval(() => {
        setTime((new Date()).toLocaleTimeString())
    }, 1000)

    const [moveable, setMoveable] = useState(false)
    const [canClickThrough, setCanClickThrough] = useState(false)

    function changeMoveable() {
        setMoveable(gMoveable);
    }

    function changeClickThrough() {
        setCanClickThrough(gClickThrough)
    }

    function moveToTopLeft() {
        moveWindow(Position.TopLeft).then()
    }

    useEffect(() => {
        const window = getCurrentWindow();
        window.listen("change_moveable", () => {
            changeMoveable()
        }).then()
        window.listen("change_click_through", () => {
            if (gClickThrough) {
                getCurrentWindow().setIgnoreCursorEvents(true).then();
            } else {
                getCurrentWindow().setIgnoreCursorEvents(false).then();
            }
            changeClickThrough()
        }).then()
        window.listen("move-top-left", moveToTopLeft).then()
    });

    return (
        <>
            <div id={"main-div"}
                 className={`${moveable?"tauri-drag":undefined} ${canClickThrough ? "enabled" : undefined}`}
                 draggable={false}
                 onContextMenu={(e)=>{e.preventDefault()}}
            >
                <span>{time}</span>
            </div>
        </>
    )
}