import {useEffect, } from "react";
import {currentMonitor, getCurrentWindow, PhysicalSize} from "@tauri-apps/api/window";
import "./canvas.scss"
import {moveWindow, Position} from "@tauri-apps/plugin-positioner";
import { write as gWrite } from "../init/tray.ts";
import Konva from "konva";

export default function Canvas({screenSize}: {screenSize: PhysicalSize}) {
    useEffect(() => {
        let lineWidth = 1;
        let color = "#000"
        let eraserSize = 30;

        let isErasing = false;


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
            isErasing = gWrite === 3;
        }).then()

        window.listen("change-lineWidth", (e)=>{
            lineWidth = e.payload as number
        }).then()

        window.listen("change-penColor", (e)=> {
            color = e.payload as string
        }).then()

        window.listen("change-eraserSize", (e)=>{
            eraserSize = e.payload as number
        }).then()

        const width = screenSize.width;
        const height = screenSize.height;

        const stage = new Konva.Stage({
            container: "container",
            width: width,
            height: height,
        })

        const layer = new Konva.Layer();
        stage.add(layer)

        let isPaint = false;
        let lastLine: Konva.Line;

        stage.on("mousedown touchstart", () => {
            console.log(isErasing, color, lineWidth)
            let TColor = color;
            if (TColor === "") {
                TColor = "#000"
            }
            isPaint = true;
            const pos = stage.getPointerPosition();
            if (pos) {
                lastLine = new Konva.Line({
                    stroke: TColor,
                    strokeWidth: !isErasing ? lineWidth : eraserSize,
                    globalCompositeOperation: !isErasing ? 'source-over' : 'destination-out',
                    lineCap: 'round',
                    lineJoin: 'round',
                    points: [pos.x, pos.y, pos.x, pos.y]
                })
                layer.add(lastLine)
            }
        })

        stage.on('mouseup touchend', function () {
            isPaint = false;
        });

        stage.on('mousemove touchmove', (e) => {
            if (!isPaint) {
                return;
            }

            e.evt.preventDefault();

            const pos = stage.getPointerPosition();
            if (pos) {
                const newPoints = lastLine.points().concat([pos.x, pos.y])
                lastLine.points(newPoints);
            }
        })
    });

    return <>
        {/*<canvas id={"canvas"} onMouseMove={(e) => {*/}
        {/*    if (e.buttons) {*/}
        {/*        const {screenX, screenY} = e;*/}
        {/*        const {movementX, movementY} = e;*/}
        {/*        const ctx = e.currentTarget.getContext("2d")*/}

        {/*        if (ctx) {*/}
        {/*            if (isErasing) {*/}
        {/*                ctx.fillStyle = "rgb(255,255,255)"*/}
        {/*                ctx.fillRect(screenX-eraserSize[0]/2, screenY-eraserSize[1]/2, eraserSize[0], eraserSize[1])*/}
        {/*                setTimeout(()=>{ctx.clearRect(screenX-eraserSize[0]/2, screenY-eraserSize[1]/2, eraserSize[0], eraserSize[1]); ctx.restore()}, 50)*/}
        {/*            } else {*/}
        {/*                ctx.lineWidth = lineWidth;*/}
        {/*                ctx.strokeStyle = color*/}
        {/*                console.log(ctx.fillStyle)*/}
        {/*                // ctx.fillRect(screenX, screenY, 4, 4)*/}
        {/*                ctx.beginPath()*/}
        {/*                ctx.moveTo(screenX-movementX, screenY-movementY)*/}
        {/*                ctx.lineTo(screenX, screenY)*/}
        {/*                ctx.stroke()*/}
        {/*            }*/}
        {/*        }*/}
        {/*    }*/}
        {/*}}*/}
        {/*        width={screenSize.width}*/}
        {/*        height={screenSize.height}*/}
        {/*></canvas>*/}
        <div id={"container"}></div>
    </>
}