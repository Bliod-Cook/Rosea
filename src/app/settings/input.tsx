import React from "react";
import {getConfig} from "@/app/scripts/config";

export default async function InputBar({config, defaultValue, onChange, children}: {config: string, defaultValue: string, onChange?: () => null, children?: React.ReactNode}) {
    return <input
        onChange={onChange}
        defaultValue={await getConfig(config, defaultValue)}
    >{children}</input>
}