import React from "react"

type Level = "bronze" | "silver" | "gold" | "platine"

const LEVELS: Record<Level, {
  label: string
  bg: string
  text: string
  border: string
}> = {

  bronze: {
    label: "BRNZ",
    bg: "bg-bronze-metallic",
    text: "text-bronze-text",
    border: "#6e3f23"
  },

  silver: {
    label: "SLVR",
    bg: "bg-silver-metallic",
    text: "text-silver-text",
    border: "#8e8e8e"
  },

  gold: {
    label: "GOLD",
    bg: "bg-gold-metallic",
    text:   "#c7a329",
    border: "#c7a329"
  },

  platine: {
    label: "PLTN",
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