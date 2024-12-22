import {useEffect, useState} from "react";
import {currentMonitor, getCurrentWindow, PhysicalSize} from "@tauri-apps/api/window";
import "./canvas.scss"
import {moveWindow, Position} from "@tauri-apps/plugin-positioner";
import { write as gWrite } from "../init/tray.ts";

export default function Canvas({screenSize}: {screenSize: PhysicalSize}) {
    const [isErasing, setIsErasing] = useState(false)

    const [lineWidth, setLineWidth] = useState(1)
    const [color, setColor] = useState("")
    const [eraserSize, setEraserSize] = useState([60, 120])

    useEffect(() => {
        const window = getCurrentWindow()
        window.setIgnoreCursorEvents(true).then();
        currentMonitor().then((monitor)=>{
            if (monitor) {
                moveWindow(Position.TopLeft).then();
                window.setSize(monitor.size).then(()=>{});
            }
        })

        window.listen("fresh-write-mode", ()=>{
            window.setIgnoreCursorEvents((gWrite === 1)).then()
            if (gWrite===3) {
                setIsErasing(true)
            } else {
                setIsErasing(false)
            }
        }).then()

        window.listen("change-lineWidth", (e)=>{
            setLineWidth(e.payload as number)
        }).then()

        window.listen("change-penColor", (e)=> {
            setColor(e.payload as string)
        }).then()

        window.listen("change-eraserSize", (e)=>{
            setEraserSize(e.payload as number[])
        }).then()
    }, []);

    return <>
        <canvas id={"canvas"} onMouseMove={(e) => {
            if (e.buttons) {
                const {screenX, screenY} = e;
                const {movementX, movementY} = e;
                const ctx = e.currentTarget.getContext("2d")

                if (ctx) {
                    if (isErasing) {
                        ctx.fillStyle = "rgb(255,255,255)"
                        ctx.fillRect(screenX-eraserSize[0]/2, screenY-eraserSize[1]/2, eraserSize[0], eraserSize[1])
                        setTimeout(()=>{ctx.clearRect(screenX-eraserSize[0]/2, screenY-eraserSize[1]/2, eraserSize[0], eraserSize[1]); ctx.restore()}, 50)
                    } else {
                        ctx.lineWidth = lineWidth;
                        ctx.strokeStyle = color
                        console.log(ctx.fillStyle)
                        // ctx.fillRect(screenX, screenY, 4, 4)
                        ctx.beginPath()
                        ctx.moveTo(screenX-movementX, screenY-movementY)
                        ctx.lineTo(screenX, screenY)
                        ctx.stroke()
                    }
                }
            }
        }}
                width={screenSize.width}
                height={screenSize.height}
        ></canvas>
    </>
}