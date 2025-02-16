import {Badge, Box, Slider, Stack} from "@mui/material"
import {emitTo} from "@tauri-apps/api/event";
import { pink, blue, red, orange, cyan, brown, grey, common, green, indigo, purple, lime, blueGrey, yellow, teal } from '@mui/material/colors';
import {Circle} from "@mui/icons-material";
import {useState} from "react";

type Color = {
  hex: string;
  mui: string;
}
const COLORS: Color[] = [
    { hex: "#e91e63", mui: pink[500] },
    { hex: "#2196f3", mui: blue[500] },
    { hex: "#d32f2f", mui: red[700] },
    { hex: "#ff9800", mui: orange[500] },
    { hex: "#00bcd4", mui: cyan[500] },
    { hex: "#795548", mui: brown[500] },
    { hex: "#9e9e9e", mui: grey[500] },
    { hex: "#000", mui: common["black"] },
    { hex: "#fff", mui: common["white"] },
    { hex: "#cddc39", mui: lime[500] },
    { hex: "#9c27b0", mui: purple[500] },
    { hex: "#3f51b5", mui: indigo[500] },
    { hex: "#66bb6a", mui: green[500] },
    { hex: "#607d8b", mui: blueGrey[500] },
    { hex: "#ffeb3b", mui: yellow[500] },
    { hex: "#009688", mui: teal[500] },
];

export default function PenSettings({lineWidth, setLineWidth}: {lineWidth: number, setLineWidth: (number: number) => void}) {

    const [colorList, setColorList] = useState<boolean[]>((new Array(COLORS.length)).fill(false));

    function enableColor(colorIndex: number) {
        const newColorList = new Array(COLORS.length).fill(false);
        newColorList[colorIndex] = true;
        setColorList(newColorList);
        emitTo("canvas", "change://canvas/penColor", COLORS[colorIndex].hex).then();
        console.log(COLORS[colorIndex].hex)
    }
    

    function changeWidth(_event: Event, value: number | number[]) {
        if (typeof value == "number") {
            emitTo("canvas", "change://canvas/lineWidth", value).then()
            setLineWidth(value)
        }
    }

    return <>
        <Box className={"slide-bar"}>
            <Box width={150} marginX={"auto"} marginTop={"12px"}>
                <Slider
                    marks={true}
                    min={1}
                    max={8}
                    step={1}
                    valueLabelDisplay={"auto"}
                    onChange={changeWidth}
                    value={lineWidth}
                    defaultValue={3}
                    color={"warning"}
                ></Slider>
            </Box>
            <Box
                width={260}
                marginX={"auto"}
            >
                <Stack
                    spacing={{ xs: 1, sm: 2 }}
                    direction={"row"}
                    useFlexGap={true}
                    sx={{ flexWrap: 'wrap' }}
                    marginX={"auto"}
                >
                    {COLORS.map((color, index) => (
                        <Box key={index} width={25} marginX={"auto"}>
                        <Badge  onClick={()=>{enableColor(index)}} variant={"dot"} color={colorList[index] ? "primary" : undefined}>
                            <Circle sx={{ color: color.mui }}></Circle>
                        </Badge>
                        </Box>
                    ))}
                </Stack>
            </Box>
        </Box>
    </>
}