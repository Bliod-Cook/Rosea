import "../assets/global.scss"
import RandomerStyle from "./randomer.module.scss"
import {useEffect, useState} from "react";
import {WebviewWindow as TauriWebviewWindow} from "@tauri-apps/api/webviewWindow";
import {BaseDirectory, create, exists, readTextFile} from "@tauri-apps/plugin-fs";
import TOML from "@ltd/j-toml";
import {Box, Button, LinearProgress} from "@mui/material";
import {getCurrentWindow} from "@tauri-apps/api/window";
import { message } from '@tauri-apps/plugin-dialog';

const chance = new (await import("chance")).Chance()

export default function RandomPage() {
    const [randomNumber, setRandomNumber] = useState(0)
    const [max, setMax] = useState(0); const [min, setMin] = useState(0)
    const [history] = useState(new historyNumber())

    async function getRandomNumber() {
        const weightList: number[] = Array(max - min + 1).fill(100)
        history.list.forEach((e) => {
            if (e !== null) {
                const i: number = Number(e);
                weightList[i - min] = 5
            }
        })
        const random_number = chance.weighted(
            Array.from(Array(max-min+1), (_v,k) =>k+1),
            weightList
        )

        console.log(weightList)

        history.list.pop()
        history.list.unshift(random_number)

        return random_number
    }

    async function random() {
        setRandomNumber(await getRandomNumber())
    }

    async function changeRandomSettingsPageVisibility() {
        const tWindow = await TauriWebviewWindow.getByLabel("random/settings")
        if (await tWindow?.isVisible()) {
            await tWindow?.hide()
        } else {
            await tWindow?.show()
        }
    }

    useEffect(() => {
        setRange().then()
        const window = getCurrentWindow();

        window.listen('random-range-set', setRange).then()
    });

    async function setRange() {
        const [minN, maxN]: [number, number] = await rNumber()
        if (maxN === max && minN === min) { /* empty */ } else {
            history.reset()
        }
        setMax(maxN); setMin(minN)
    }

    async function notify_reset() {
        await message(
            'Weight Reset',
            { title: 'Tauri', kind: 'info' }
        );
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
                    width={120}
                    marginX={"auto"}
                    display={"flex"}
                >
                    <Box className={`${RandomerStyle.smallFont}`} width={20} sx={{textAlign: "center"}}>{min}</Box>
                    <Box
                        width={80}
                        marginX={"auto"}
                        marginTop={"7px"}
                    ><LinearProgress
                        variant={"determinate"}
                        value={randomNumber/(max-min)*98}
                    ></LinearProgress></Box>
                    <Box className={`${RandomerStyle.smallFont}`} width={20} sx={{textAlign: "center"}}>{max}</Box>
                </Box>
                <Box
                    marginTop={"20px"}
                >
                    <Box unselectable={"on"} className={`${RandomerStyle.buttons}`} marginX={"auto"}>
                        <Button onClick={random} className={`${RandomerStyle.win10Button} no-drag-region`} onContextMenu={
                            async (e) => {
                                e.preventDefault()

                                console.log("Reset")

                                history.reset()

                                await notify_reset()
                            }
                        }>抽取</Button>
                        <Button onClick={changeRandomSettingsPageVisibility}
                                className={`${RandomerStyle.win10Button} no-drag-region`}
                                onContextMenu={(e)=>{e.preventDefault()}}
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

class historyNumber {
    public list: (number | null)[]

    constructor() {
        this.list = Array<number | null>(30).fill(null)
    }

    reset() {
        this.list = Array<number | null>(30).fill(null)
    }
}