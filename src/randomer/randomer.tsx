import "../assets/global.scss"
import RandomerStyle from "./randomer.module.scss"
import {useEffect, useState} from "react";
import {WebviewWindow as TauriWebviewWindow} from "@tauri-apps/api/webviewWindow";
import {BaseDirectory, exists, readFile} from "@tauri-apps/plugin-fs";
import { rConfig } from "./config.ts";
import {Box, Button, LinearProgress} from "@mui/material";
import {getCurrentWindow} from "@tauri-apps/api/window";
import { message } from '@tauri-apps/plugin-dialog';

const chance = new (await import("chance")).Chance()

export default function RandomPage() {
    const [randomNumber, setRandomNumber] = useState(0)
    const [max, setMax] = useState(0); const [min, setMin] = useState(0)
    const [history] = useState(new historyNumber())
    const [id, setId] = useState<Map<string, string> | null>(null);

    const [showName, setShowName] = useState(false)

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
        readConfig().then();
        readIdCsv().then();

        const window = getCurrentWindow();
        window.listen('reload://randomer/config', readConfig).then()
    }, []);

    async function readConfig() {
        const [minN, maxN, showName]: [number, number, boolean] = await rConfig()
        if (maxN === max && minN === min) { /* empty */ } else {
            history.reset()
        }
        setMax(maxN)
        setMin(minN)
        setShowName(showName)
    }

    async function notify_reset() {
        await message(
            'Weight Reset',
            { title: 'Tauri', kind: 'info' }
        );
    }

    async function readIdCsv() {
        try {
            if (await exists('id.csv', { baseDir: BaseDirectory.AppLocalData })) {
                const csvContent = new TextDecoder("gbk").decode(await readFile('id.csv', { baseDir: BaseDirectory.AppLocalData }));
                const lines = csvContent.split('\n');
                const idMap: Map<string, string> = new Map();

                // Read start from line 1
                for (const line of lines) {
                    if (line.trim() === "") continue; // Skip empty line
                    const parts = line.split(',');
                    if (parts.length >= 2) {
                        const id = parts[0].trim();
                        const name = parts[1].trim();
                        idMap.set(id, name);
                    }
                }
                setId(idMap);
            }
        } catch (error) {
            console.error("读取 id.csv 文件失败:", error);
            await message(`读取 id.csv 文件失败: ${error}`, {title: '错误', kind: 'error'})
            setId(null); // If failed, set it to null
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
                    <Box marginTop={"20px"}>{randomNumber}{showName ? `, ${id?.get(String(randomNumber)) ?? "None"}` : ""}</Box>
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

class historyNumber {
    public list: (number | null)[]

    constructor() {
        this.list = Array<number | null>(30).fill(null)
    }

    reset() {
        this.list = Array<number | null>(30).fill(null)
    }
}