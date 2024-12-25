import {Box, Stack, ToggleButton, ToggleButtonGroup} from "@mui/material";
import {Circle} from "@mui/icons-material";
import React, {useState} from "react";
import {emitTo} from "@tauri-apps/api/event";

export default function EraserSettings() {
    const [size, setSize] = useState(60)

    function changeSize(
        _event: React.MouseEvent<HTMLElement>,
        value: number,
    ) {
        setSize(value)
        emitTo("canvas", "change-eraserSize", value).then()
    }

    return <>
        <div>
            <Box
                className={"clear-bar"}
                marginX={"auto"}
                width={60}
            ></Box>
            <Box
                width={200}
                marginX={"auto"}
                marginTop={"15px"}
            >
                <Stack
                    direction={"row"}
                    useFlexGap={true}
                    marginLeft={"20px"}
                >
                    <ToggleButtonGroup
                        value={size}
                        onChange={changeSize}
                        exclusive={true}
                        color={"warning"}
                        size={"large"}
                    >
                        <ToggleButton value={30} key={"min"}><Circle fontSize={"small"} sx={{color: "#fff"}}></Circle></ToggleButton>
                        <ToggleButton value={60} key={"mid"}><Circle fontSize={"medium"} sx={{color: "#fff"}}></Circle></ToggleButton>
                        <ToggleButton value={100} key={"max"}><Circle fontSize={"large"} sx={{color: "#fff"}}></Circle></ToggleButton>
                    </ToggleButtonGroup>
                </Stack>
            </Box>
        </div>
    </>
}