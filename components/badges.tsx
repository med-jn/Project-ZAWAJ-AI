import React from "react"

type Level = "bronze" | "silver" | "gold" | "diamond"

const LEVELS: Record<Level, {
  label: string
  bg: string
  text: string
  border: string
}> = {

  bronze: {
    label: "BRONZE",
    bg: "bg-bronze-metallic",
    text: "text-bronze-text",
    border: "#6e3f23"
  },

  silver: {
    label: "SILVER",
    bg: "bg-silver-metallic",
    text: "text-silver-text",
    border: "#8e8e8e"
  },

  gold: {
    label: " G O L D ",
    bg: "bg-gold-metallic",
    text: "text-gold-text",
    border: "#c7a329"
  },

  diamond: {
    label: "DIAMOND",
    bg: "bg-diamond-metallic",
    text: "text-diamond-text",
    border: "#9edfff"
  }

}

interface LevelBadgeProps {
  type: Level
  size?: string
}

export const LevelBadge = ({
  type,
  size = "text-xs"
}: LevelBadgeProps) => {

  const cfg = LEVELS[type]

  if (!cfg) return null

  return (

    <span
      className={`
        badge-metal
        ${cfg.bg}
        ${cfg.text}
        ${size}
      `}
      style={{
        border: `0.07em solid ${cfg.border}`
      }}
    >

      <span className="badge-engraved">
        {cfg.label}
      </span>

    </span>

  )

}