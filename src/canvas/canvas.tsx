import {useEffect} from "react";
import {currentMonitor, getCurrentWindow, PhysicalSize} from "@tauri-apps/api/window";
import "./canvas.scss"
import {moveWindow, Position} from "@tauri-apps/plugin-positioner";
import { write as gWrite } from "../init/tray.ts";
import Konva from "konva";

export default function Canvas({screenSize}: {screenSize: PhysicalSize}) {
    useEffect(() => {
        const window = getCurrentWindow();
        window.setIgnoreCursorEvents(true).then();
        currentMonitor().then((monitor)=>{
            if (monitor) {
                moveWindow(Position.TopLeft).then();
                window.setSize(monitor.size).then(()=>{});
            }
        })
    });

    useEffect(() => {
        let lineWidth = 3;
        let color = "#d32f2f"
        let eraserSize = 60;

        let isErasing = false;


        let isPaint = false;
        let lastLine: Konva.Line;


        const window = getCurrentWindow()

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

        let layer = new Konva.Layer();

        stage.add(layer)

        window.listen("clear-eraserSize", ()=>{
            layer.destroy()
            layer = new Konva.Layer
            stage.add(layer)
        }).then()

        stage.on("mousedown touchstart", () => {
            isPaint = true;
            const pos = stage.getPointerPosition();
            if (pos) {
                lastLine = new Konva.Line({
                    stroke: color,
                    strokeWidth: !isErasing ? lineWidth : eraserSize,
                    globalCompositeOperation: !isErasing ? 'source-over' : 'destination-out',
                    lineCap: 'round',
                    lineJoin: 'round',
                    points: [pos.x, pos.y, pos.x, pos.y],
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
        <div id={"container"}></div>
    </>
}