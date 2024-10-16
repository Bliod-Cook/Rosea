import React from "react"
export default function WinButton({children, width, height, onClick}: {children?: React.ReactNode, width?: number, height?: number, onClick?: () => void}) {
    return (
        <button style={{
            backgroundColor: "#f0f0f0",
            border: "1px solid #888888",
            padding: `${height ? height : 10}px ${width ? width : 20}px`,
            fontSize: "10px",
            cursor: "pointer",
        }} onClick={onClick ? onClick : () => {}} className={'select-none'}>{children}</button>
    )
}