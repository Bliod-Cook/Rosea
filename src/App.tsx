import {useEffect, useState} from "react";
import "./App.scss"
import {getCurrentWindow} from "@tauri-apps/api/window";
import {moveable as gMoveable, click_through as gClickThrough} from "./init/tray.ts";

export default function App() {
    const [time, setTime] = useState((new Date()).toLocaleTimeString())
    setInterval(() => {
        setTime((new Date()).toLocaleTimeString())
    }, 1000)

    const [moveable, setMoveable] = useState(false)

    function changeMoveable() {
        setMoveable(gMoveable);
    }

    useEffect(() => {
        getCurrentWindow().listen("change_moveable", () => {
            changeMoveable()
        }).then()
        getCurrentWindow().listen("change_click_through", () => {
            gClickThrough ? getCurrentWindow().setIgnoreCursorEvents(true) : getCurrentWindow().setIgnoreCursorEvents(false)
        }).then()
    });

    return (
        <>
            <div id={"main-div"}
                 className={`${moveable?"tauri-drag":undefined}`}
                 draggable={false}>
                {time}
            </div>
        </>
    )
}