import {useEffect, useState} from "react";
import "./App.scss"
import {getCurrentWindow} from "@tauri-apps/api/window";
import {click_through as gClickThrough, moveable as gMoveable} from "./init/tray.ts";

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

    useEffect(() => {
        const window = getCurrentWindow();
        window.listen("change_moveable", () => {
            changeMoveable()
        }).then()
        window.listen("change_click_through", () => {
            gClickThrough ? getCurrentWindow().setIgnoreCursorEvents(true) : getCurrentWindow().setIgnoreCursorEvents(false);
            changeClickThrough()
        }).then()
    });

    return (
        <>
            <div id={"main-div"}
                 className={`${moveable?"tauri-drag":undefined} ${canClickThrough ? "enabled" : undefined}`}
                 draggable={false}
                 onContextMenu={(e)=>{e.preventDefault()}}
            >
                {time}
            </div>
        </>
    )
}