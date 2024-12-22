import {Badge, Box, Stack} from "@mui/material";
import {Circle} from "@mui/icons-material";
import {useState} from "react";
import {emitTo} from "@tauri-apps/api/event";

export default function EraserSettings() {
    const [eraserList, setEraserList] = useState(new Array(3).fill(false))

    function enableEraser(eraser: number) {
        const eraserNumberList = [[40,80], [60,120], [80, 160]]
        emitTo("canvas", "change-eraserSize", eraserNumberList[eraser]).then()
        const list = new Array(3).fill(false)
        list[eraser] = true
        setEraserList(list)
    }

    return <>
        <div>
            <Box
                width={200}
                marginX={"auto"}
                marginTop={"15px"}
            >
                <Stack
                    spacing={{ xs: 5, sm: 1 }}
                    direction={"row"}
                    marginLeft={"20px"}
                >
                    <Badge onClick={()=>{enableEraser(0)}} variant={"dot"} color={eraserList[0] ? "primary" : undefined}><Circle fontSize={"small"} sx={{color: "#fff"}}></Circle></Badge>
                    <Badge onClick={()=>{enableEraser(1)}} variant={"dot"} color={eraserList[1] ? "primary" : undefined}><Circle fontSize={"medium"} sx={{color: "#fff"}}></Circle></Badge>
                    <Badge onClick={()=>{enableEraser(2)}} variant={"dot"} color={eraserList[2] ? "primary" : undefined}><Circle fontSize={"large"} sx={{color: "#fff"}}></Circle></Badge>
                </Stack>
            </Box>
        </div>
    </>
}