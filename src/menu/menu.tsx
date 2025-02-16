import "./menu.scss"
import {useEffect, useState} from "react";
import {getCurrentWindow, LogicalSize, PhysicalPosition} from "@tauri-apps/api/window";
import {WebviewWindow} from "@tauri-apps/api/webviewWindow";
import {click_through, moveable, write as gWrite} from "../init/tray.ts";
import {emit, emitTo} from "@tauri-apps/api/event";
import PenSettings from "./components/pen/pen.tsx";
import EraserSettings from "./components/eraser/earser.tsx";
import DefaultIcon from "../assets/icon.svg"
import {exists, BaseDirectory, readFile} from '@tauri-apps/plugin-fs';
import { Buffer } from 'buffer'
import {Box} from "@mui/material";

export default function Menu() {
    const [sizeDefault] = useState(new LogicalSize(40, 40))
    const [sizeFirst] = useState(new LogicalSize(275, 40))
    const [sizeSecond] = useState(new LogicalSize(275, 160))

    const [open, setOpen] = useState(false)
    const [secondOpen, setSecondOpen] = useState(false)

    const [randomPageOpened, setRandomPageOpened] = useState(false)
    const [locked, setLocked] = useState(!moveable)
    const [canClickThrough, setCanClickThrough] = useState(click_through)
    const [write, setWrite] = useState(1);

    const [remainingTime, setRemainingTime] = useState(60);
    const [countdownIntervalId, setCountdownIntervalId] = useState<NodeJS.Timeout | null>(null);
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
        return () => {
            getCurrentWindow().setPosition(new PhysicalPosition(100, 100)).then()
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
                <div className={`cursor-icon ${write === 1 ? "enabled" : "disabled"}`} onClick={() => {
                    if ((write === 2) || (write === 3)) {
                        closeSecondLayer().then()
                    }
                    emit("change-write", 1).then(() => {
                        setWrite(gWrite)
                    })
                }}></div>
                <div className={`write-icon ${write === 2 ? "enabled" : "disabled"}`} onClick={() => {
                    if (write === 2) {
                        if (secondOpen) {
                            closeSecondLayer().then()
                        } else {
                            openSecondLayer().then()
                        }
                    } else {
                        emit("change-write", 2).then(() => {
                            setWrite(gWrite)
                        })
                    }
                }}
                ></div>
                <div className={`eraser-icon ${write === 3 ? "enabled" : "disabled"}`} onClick={() => {
                    if (write === 3) {
                        if (secondOpen) {
                            closeSecondLayer().then()
                        } else {
                            openSecondLayer().then()
                        }
                    } else {
                        emit("change-write", 3).then(() => {
                            setWrite(gWrite)
                        })
                    }
                }}
                     onContextMenu={()=>{emitTo("canvas","clear-eraserSize").then()}}
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
                <div className={`lock-icon ${!locked ? "enabled" : "disabled"}`} onClick={() => {
                    emit("change-lock").then(() => {
                        setLocked(!moveable)
                    })
                }}
                     onContextMenu={(e) => {e.preventDefault(); emitTo("main","move-top-left").then()}}
                ></div>
                <div className={`click-through-icon ${canClickThrough ? "enabled" : "disabled"}`} onClick={() => {
                    if (ctTimeoutId) {
                        clearTimeout(ctTimeoutId);
                        setCtTimeoutId(null);
                    }
                    if (countdownIntervalId) {
                        clearInterval(countdownIntervalId);
                        setCountdownIntervalId(null);
                    }

                    emit("change-click_through").then(() => {
                        const newState = !canClickThrough;
                        setCanClickThrough(newState);

                        if (newState) {
                            setRemainingTime(60);
                            const interval = setInterval(() => {
                                setRemainingTime(prev => Math.max(0, prev - 1));
                            }, 1000);
                            setCountdownIntervalId(interval);

                            const timeoutId = setTimeout(() => {
                                emit("change-click_through").then(() => {
                                    setCanClickThrough(false);
                                    setRemainingTime(0);
                                });
                                clearInterval(interval);
                                setCountdownIntervalId(null);
                            }, 60000);
                            setCtTimeoutId(timeoutId);
                        } else {
                            setRemainingTime(0);
                        }
                    });
                }}>
                    {canClickThrough && remainingTime > 0 && (
                        <span className="countdown-text">{remainingTime}</span>
                    )}
                </div>
            </div>
        </div>
        <div>
            {
                write === 2 ?
                    <PenSettings lineWidth={lineWidth} setLineWidth={setLineWidth}/> :
                write === 3 ?
                    <EraserSettings/> : undefined
            }
        </div>
    </div>
}