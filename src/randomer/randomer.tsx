import "../assets/global.scss"
import RandomerStyle from "./randomer.module.scss"
import {useState} from "react";
import {WebviewWindow as TauriWebviewWindow} from "@tauri-apps/api/webviewWindow";
import {BaseDirectory, create, exists, readTextFile} from "@tauri-apps/plugin-fs";
import TOML from "@ltd/j-toml";
import {Box, Button, LinearProgress} from "@mui/material";

export default function RandomPage() {
    const [randomNumber, setRandomNumber] = useState(0)
    const [max, setMax] = useState(0); const [min, setMin] = useState(0)
    const [historyNumber, setHistoryNumber] = useState(Array<number | null>(20).fill(null))

    async function random() {
        const [minN, maxN]: [number, number] = await rNumber()
        if (maxN === max && minN === min) { /* empty */ } else {
            setHistoryNumber(Array<number | null>(20).fill(null))
        }
        const weightList: number[] = Array(maxN - minN + 1).fill(100)
        historyNumber.forEach((e) => {
            if (e !== null) {
                const i: number = Number(e);
                weightList[i - minN] = 10
            }
        })
        setMax(maxN); setMin(minN)
        const random_number = (new (await import("chance")).Chance()).weighted(
            Array.from(Array(maxN-minN+1), (_v,k) =>k+1),
            weightList
        )
        historyNumber.pop()
        historyNumber.unshift(random_number)
        setRandomNumber(random_number)
    }

    async function changeRandomSettingsPageVisibility() {
        const tWindow = await TauriWebviewWindow.getByLabel("random/settings")
        if (await tWindow?.isVisible()) {
            await tWindow?.hide()
        } else {
            await tWindow?.show()
        }
    }

    return (
        <>
            <Box className={`${RandomerStyle.background} drag-region`}
                 onScroll={(e) => {
                     e.preventDefault()
                 }}
            >
                <Box unselectable={"on"} textAlign={"center"} height={"30px"}>
                    <Box marginTop={"20px"}>{randomNumber}</Box>
                </Box>
                <Box
                    width={80}
                    marginX={"auto"}
                >
                    <LinearProgress
                        variant={"determinate"}
                        value={randomNumber/(max-min)*98}
                    ></LinearProgress>
                </Box>
                <Box
                    marginTop={"20px"}
                >
                    <Box unselectable={"on"} className={`${RandomerStyle.buttons}`} marginX={"auto"}>
                        <Button onClick={random} className={`${RandomerStyle.win10Button} no-drag-region`}>抽取</Button>
                        <Button onClick={changeRandomSettingsPageVisibility}
                                className={`${RandomerStyle.win10Button} no-drag-region`}
                        >
                            设置
                        </Button>
                    </Box>
                </Box>
            </Box>
        </>
    )
}

async function rNumber(): Promise<[number, number]> {
    if (!(await exists('config.toml', {baseDir: BaseDirectory.AppLocalData}))) {
        await create('config.toml', {baseDir: BaseDirectory.AppLocalData})
    }
    const config = (await readTextFile('config.toml', {baseDir: BaseDirectory.AppLocalData})).slice(1, -1).split(",").join("\n")
    const configData = TOML.parse(
        config
    )
    const maxN = Number(configData["random_max"] ?? 48)
    const minN = Number(configData["random_min"] ?? 1)
    return [minN, maxN]
}