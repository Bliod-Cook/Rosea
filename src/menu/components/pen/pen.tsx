import {Badge, Box, Slider, Stack} from "@mui/material"
import {emit} from "@tauri-apps/api/event";
import { pink, blue, red, orange, cyan, brown, grey, common, green, indigo, purple, lime, blueGrey, yellow, teal } from '@mui/material/colors';
import {Circle} from "@mui/icons-material";
import {useState} from "react";
export default function PenSettings({lineWidth, setLineWidth}: {lineWidth: number, setLineWidth: (number: number) => void}) {

    const [colorList, setColorList] = useState((new Array(16)).fill(false))

    function enableColor(color: number) {
        const colorNumberList = ["#e91e63", "#2196f3", "#d32f2f", "#ff9800", "#00bcd4", "#795548", "#9e9e9e", "#000", "#fff", "#cddc39", "#9c27b0", "#3f51b5", "#66bb6a", "#607d8b", "#ffeb3b", "#009688"]
        const colorL = new Array(16).fill(false);
        colorL[color] = true
        setColorList(colorL)
        emit("change-penColor", colorNumberList[color]).then()
        console.log(colorNumberList[color])
    }

    function changeWidth(_event: Event, value: number | number[]) {
        if (typeof value == "number") {
            emit("change-lineWidth",value).then()
            setLineWidth(value)
        }
    }

    return <>
        <div className={"slide-bar"}>
            <Box width={150} marginX={"auto"} marginTop={"12px"}>
                <Slider
                    marks={true}
                    min={1}
                    max={8}
                    step={1}
                    valueLabelDisplay={"auto"}
                    onChange={changeWidth}
                    value={lineWidth}
                    color={"warning"}
                ></Slider>
            </Box>
            <Box
                width={250}
                marginX={"auto"}
            >
                <Stack
                    spacing={{ xs: 1, sm: 2 }}
                    direction={"row"}
                    useFlexGap={true}
                    sx={{ flexWrap: 'wrap' }}
                >
                    <Badge onClick={()=>{enableColor(0)}} variant={"dot"} color={colorList[0] ? "primary" : undefined}><Circle sx={{ color: pink[500] }}></Circle></Badge>
                    <Badge onClick={()=>{enableColor(1)}} variant={"dot"} color={colorList[1] ? "primary" : undefined}><Circle sx={{ color: blue[500] }}></Circle></Badge>
                    <Badge onClick={()=>{enableColor(2)}} variant={"dot"} color={colorList[2] ? "primary" : undefined}><Circle sx={{ color: red[700] }}></Circle></Badge>
                    <Badge onClick={()=>{enableColor(3)}} variant={"dot"} color={colorList[3] ? "primary" : undefined}><Circle sx={{ color: orange[500] }}></Circle></Badge>
                    <Badge onClick={()=>{enableColor(4)}} variant={"dot"} color={colorList[4] ? "primary" : undefined}><Circle sx={{ color: cyan[500] }}></Circle></Badge>
                    <Badge onClick={()=>{enableColor(5)}} variant={"dot"} color={colorList[5] ? "primary" : undefined}><Circle sx={{ color: brown[500] }}></Circle></Badge>
                    <Badge onClick={()=>{enableColor(6)}} variant={"dot"} color={colorList[6] ? "primary" : undefined}><Circle sx={{ color: grey[500] }}></Circle></Badge>
                    <Badge onClick={()=>{enableColor(7)}} variant={"dot"} color={colorList[7] ? "primary" : undefined}><Circle sx={{ color: common["black"] }}></Circle></Badge>
                    <Badge onClick={()=>{enableColor(8)}} variant={"dot"} color={colorList[8] ? "primary" : undefined}><Circle sx={{ color: common["white"] }}></Circle></Badge>
                    <Badge onClick={()=>{enableColor(9)}} variant={"dot"} color={colorList[9] ? "primary" : undefined}><Circle sx={{ color: lime[500] }}></Circle></Badge>
                    <Badge onClick={()=>{enableColor(10)}} variant={"dot"} color={colorList[10] ? "primary" : undefined}><Circle sx={{ color: purple[500] }}></Circle></Badge>
                    <Badge onClick={()=>{enableColor(11)}} variant={"dot"} color={colorList[11] ? "primary" : undefined}><Circle sx={{ color: indigo[500] }}></Circle></Badge>
                    <Badge onClick={()=>{enableColor(12)}} variant={"dot"} color={colorList[12] ? "primary" : undefined}><Circle sx={{ color: green[500] }}></Circle></Badge>
                    <Badge onClick={()=>{enableColor(13)}} variant={"dot"} color={colorList[13] ? "primary" : undefined}><Circle sx={{ color: blueGrey[500] }}></Circle></Badge>
                    <Badge onClick={()=>{enableColor(14)}} variant={"dot"} color={colorList[14] ? "primary" : undefined}><Circle sx={{ color: yellow[500] }}></Circle></Badge>
                    <Badge onClick={()=>{enableColor(15)}} variant={"dot"} color={colorList[15] ? "primary" : undefined}><Circle sx={{ color: teal[500] }}></Circle></Badge>
                </Stack>
            </Box>
        </div>
    </>
}