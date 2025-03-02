import {useEffect, useMemo} from "react";
import {currentMonitor, getCurrentWindow, PhysicalSize} from "@tauri-apps/api/window";
import "./canvas.scss"
import {moveWindow, Position} from "@tauri-apps/plugin-positioner";
import Konva from "konva";

export default function Canvas({screenSize}: {screenSize: PhysicalSize}) {
    const TauriWebviewWindow = useMemo(() => {
        return getCurrentWindow()
    }, []);

    useEffect(() => {
        TauriWebviewWindow.setIgnoreCursorEvents(true).then();
        currentMonitor().then((monitor)=>{
            if (monitor) {
                moveWindow(Position.TopLeft).then();
                TauriWebviewWindow.setSize(monitor.size).then(()=>{});
            }
        })
    }, []);

    useEffect(() => {
        let lineWidth = 3;
        let color = "#d32f2f";
        let eraserSize = 60;

        let isErasing = false;
        let isPaint = false;
        let lastLine: Konva.Line;

        TauriWebviewWindow.listen("change://canvas/mode", (event) => {
            TauriWebviewWindow.setIgnoreCursorEvents(event.payload == 1).then()
            isErasing = event.payload == 3
        }).then()

        TauriWebviewWindow.listen("change://canvas/lineWidth", (e)=>{
            lineWidth = e.payload as number
        }).then()
        TauriWebviewWindow.listen("change://canvas/penColor", (e)=> {
            color = e.payload as string
        }).then()
        TauriWebviewWindow.listen("change://canvas/eraserSize", (e)=>{
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

        TauriWebviewWindow.listen("reset://canvas/draw", ()=>{
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