import "./menu.scss"
import {useEffect, useMemo, useState} from "react";
import { getCurrentWindow, LogicalSize, PhysicalPosition } from "@tauri-apps/api/window";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { visibility as default_visibility, moveable as default_moveAbility } from "../init/tray.ts";
import {emit, emitTo} from "@tauri-apps/api/event";
import PenSettings from "./components/pen/pen.tsx";
import EraserSettings from "./components/eraser/earser.tsx";
import DefaultIcon from "../assets/icon.svg"
import { exists, BaseDirectory, readFile } from '@tauri-apps/plugin-fs';
import { Buffer } from 'buffer'
import { Box } from "@mui/material";

export default function Menu() {
    const sizeDefault = useMemo(()=> new LogicalSize(40, 40), [])
    const sizeFirst = useMemo(() => new LogicalSize(275, 40), [])
    const sizeSecond = useMemo(() => new LogicalSize(275, 160), [])

    const [open, setOpen] = useState(false)
    const [secondOpen, setSecondOpen] = useState(false)

    const [randomPageOpened, setRandomPageOpened] = useState(false)
    const [moveAbility, setMoveAbility] = useState(default_moveAbility)
    const [visibility, setVisibility] = useState(default_visibility)
    const [writeMode, setWriteMode] = useState(1);

    const [ctTimeoutId, setCtTimeoutId] = useState<NodeJS.Timeout | null>(null);

    const [lineWidth, setLineWidth] = useState(3)

    const [menuIcon, setMenuIcon] = useState(DefaultIcon)
    const [customizedMenuIcon, setCustomizedMenuIcon] = useState(false)

    useEffect(() => {
        exists('menu.png', {baseDir: BaseDirectory.AppLocalData})
            .then(async (e)=>{
                if (e) {
                    const customizedMenuIcon = await readFile('menu.png', {baseDir: BaseDirectory.AppLocalData})
                    setMenuIcon(`data:image/jpg;base64,${Buffer.from(customizedMenuIcon).toString('base64')}`)
                    setCustomizedMenuIcon(true)
                }
            })
    }, []);

    useEffect(() => {
        const window = getCurrentWindow();

        window.setPosition(new PhysicalPosition(100, 100)).then()
        window.show().then()

        window.listen("change://clock/move-ability", (event) => {
            setMoveAbility(event.payload as boolean)
        }).then()

        window.listen("change://clock/visibility", (event) => {
            setVisibility(event.payload as boolean)
        }).then()
    }, []);

    useEffect(() => {
        return () => {
            getCurrentWindow().setSize(sizeDefault).then()
        }
    }, [sizeDefault]);

    useEffect(() => {
        return () => {
            if (ctTimeoutId) {
                clearTimeout(ctTimeoutId);
            }
        };
    }, [ctTimeoutId]);

    async function changeOpen() {
        const window = getCurrentWindow();
        if (!open) {
            await window.setSize(sizeSecond)
            setOpen(!open)
        } else {
            setOpen(!open)
            setSecondOpen(false)
            setTimeout(async ()=>{await window.setSize(sizeDefault)}, 500)
        }
    }

    async function closeSecondLayer() {
        const window = getCurrentWindow();
        setSecondOpen(false)
        setTimeout(async () => {await window.setSize(sizeFirst)}, 500)
    }

    async function openSecondLayer() {
        const window = getCurrentWindow();
        await window.setSize(sizeSecond)
        setSecondOpen(true)
    }


    return <div className={`main ${open ? "opened": ""} ${secondOpen ? "second-opened": ""}`}
                onContextMenu={(e)=>{e.preventDefault()}}
    >
        <div className={"top-bar"}>
            <Box>
                <div
                    className={`menu-icon ${open ? "enabled" : "disabled"} ${customizedMenuIcon ? "customizedMenuIcon" : ""}`}
                    onClick={changeOpen}
                    style={{
                        content: `url(${menuIcon})`,
                    }}
                ></div>
            </Box>
            <div className={"icons-bar"}>
                <div className={`cursor-icon ${writeMode === 1 ? "enabled" : "disabled"}`} onClick={() => {
                    if ((writeMode === 2) || (writeMode === 3)) {
                        closeSecondLayer().then()
                    }
                    emitTo("canvas", "change://canvas/mode", 1).then(() => {
                        setWriteMode(1)
                    })
                }}></div>
                <div className={`write-icon ${writeMode === 2 ? "enabled" : "disabled"}`} onClick={() => {
                    if (writeMode === 2) {
                        if (secondOpen) {
                            closeSecondLayer().then()
                        } else {
                            openSecondLayer().then()
                        }
                    } else {
                        emitTo("canvas", "change://canvas/mode", 2).then(() => {
                            setWriteMode(2)
                        })
                    }
                }}
                ></div>
                <div className={`eraser-icon ${writeMode === 3 ? "enabled" : "disabled"}`} onClick={() => {
                    if (writeMode === 3) {
                        if (secondOpen) {
                            closeSecondLayer().then()
                        } else {
                            openSecondLayer().then()
                        }
                    } else {
                        emitTo("canvas", "change://canvas/mode", 3).then(() => {
                            setWriteMode(3)
                        })
                    }
                }}
                     onContextMenu={()=>{emitTo("canvas","reset://canvas/draw").then()}}
                ></div>
                <div className={`random-icon ${randomPageOpened ? "enabled" : "disabled"}`} onClick={async () => {
                    const window = await WebviewWindow.getByLabel("random")
                    if (window) {
                        if (await window.isVisible()) {
                            window.hide().then(() => {
                                setRandomPageOpened(false)
                            })
                        } else {
                            window.show().then(() => {
                                setRandomPageOpened(true)
                            })

                        }
                    }
                }}></div>
                <div className={`lock-icon ${moveAbility ? "enabled" : "disabled"}`} onClick={() => {
                    emit("change://clock/move-ability", !moveAbility).then(() => {})
                }}
                     onContextMenu={(e) => {e.preventDefault(); emitTo("main","reset://clock/position").then()}}
                ></div>
                <div className={`click-through-icon ${!visibility ? "enabled" : "disabled"}`} onClick={() => {
                    // Clear current timer
                    if (ctTimeoutId) {
                        clearTimeout(ctTimeoutId);
                        setCtTimeoutId(null);
                    }
                    emit("change://clock/visibility", !visibility).then(() => {
                        setVisibility(!visibility);
                        // If on, set timer
                        if (visibility) {
                            const timeoutId = setTimeout(() => {
                                emit("change://clock/visibility", visibility).then(() => {
                                    setVisibility(true);
                                    setCtTimeoutId(null);
                                });
                            }, 60000);
                            setCtTimeoutId(timeoutId);
                        }
                    });
                }}></div>
            </div>
        </div>
        <div>
            {
                writeMode === 2 ?
                    <PenSettings lineWidth={lineWidth} setLineWidth={setLineWidth}/> :
                writeMode === 3 ?
                    <EraserSettings/> : undefined
            }
        </div>
    </div>
}