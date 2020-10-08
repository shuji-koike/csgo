import React from "react"
import {
  NadeColor,
  bombColor,
  colorToMatrix,
  pointToArray,
  pointsToString,
  rotatePoint,
  teamColor,
  icon,
} from "."

export const FrameView: React.FC<{
  frame?: Frame
}> = function ({ frame }) {
  return frame ? (
    <>
      <MolotovView frame={frame}></MolotovView>
      {(frame.Players || []).map(e => (
        <FramePlayer key={e.ID} player={e}></FramePlayer>
      ))}
      <BombView frame={frame}></BombView>
      {(frame.Nades || []).map(e => (
        <NadeView key={e.ID} nade={e}></NadeView>
      ))}
    </>
  ) : (
    <></>
  )
}

export const FramePlayer: React.FC<{
  player: Player
}> = function ({ player }) {
  return (
    <g key={player.ID}>
      {!player.Hp ? (
        <path
          d={[
            "M",
            player.X - 4,
            player.Y - 4,
            "L",
            player.X + 4,
            player.Y + 4,
            "M",
            player.X - 4,
            player.Y + 4,
            "L",
            player.X + 4,
            player.Y - 4,
          ].join(" ")}
          fill="transparent"
          stroke={teamColor(player.Team)}
          strokeWidth={2}></path>
      ) : (
        <>
          <circle
            cx={player.X}
            cy={player.Y}
            r="8"
            fill={teamColor(player.Team)}
          />
          <circle
            cx={player.X}
            cy={player.Y}
            r="16"
            fill="white"
            style={{ fillOpacity: player.Flashed ? 0.5 : 0 }}
          />
          <path
            d={[
              "M",
              ...pointToArray(rotatePoint(player, -player.Yaw, 2)),
              "L",
              ...pointToArray(rotatePoint(player, -player.Yaw, 12)),
            ].join(" ")}
            strokeWidth={2}
            stroke="#fff"
            fill="transparent"
          />
        </>
      )}
      <text
        x={player.X + 15}
        y={player.Y}
        fontSize="14"
        fill={player.Hp ? "#eee" : "#888"}
        fontFamily="monospace">
        {player.Name}
      </text>
    </g>
  )
}

export const TrailView: React.FC<{
  round?: Round
}> = function ({ round }) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  React.useEffect(() => {
    const context = canvasRef?.current?.getContext?.("2d")
    if (context) {
      context.clearRect(0, 0, 1024, 1024)
      round?.Frames.forEach(f => {
        for (const e in f.Players) {
          context.fillStyle = teamColor(f.Players[e].Team)
          context.fillRect(f.Players[e].X, f.Players[e].Y, 1, 1)
        }
      })
    }
  }, [round])
  return (
    <foreignObject x={0} y={0} width={1024} height={1024}>
      <canvas ref={canvasRef} width="1024" height="1024"></canvas>
    </foreignObject>
  )
}

export const BombView: React.FC<{
  frame: Frame
}> = function ({ frame }) {
  return (
    <g>
      <image
        x={frame.Bomb.X - 8}
        y={frame.Bomb.Y - 13}
        href={icon("404")}
        width="15"
        height="25"
        filter="url(#BombColor)"
      />
      <filter id="BombColor">
        <feColorMatrix
          in="SourceGraphic"
          type="matrix"
          values={colorToMatrix(bombColor(frame.Bomb.State))}
        />
      </filter>
    </g>
  )
}

export const MolotovView: React.FC<{
  frame: Frame
}> = function ({ frame }) {
  return (
    <g>
      {frame.Nades?.filter(e => e.Flames?.length).map((nade, i) => (
        <polygon
          key={i}
          points={pointsToString(nade.Flames || [])}
          stroke={teamColor(nade.Team)}
          strokeWidth="2"
          fill="#8e0c05"
          style={{ fillOpacity: 0.5 }}
        />
      ))}
    </g>
  )
}

export const NadeView: React.FC<{
  nade: Nade
}> = function ({ nade }) {
  if (!nade.Weapon) return null
  return nade.Weapon == 505 && nade.Active ? (
    <circle
      cx={nade.X}
      cy={nade.Y}
      r="24"
      fill="#fff"
      stroke={teamColor(nade.Team)}
      strokeWidth="2"
      style={{ fillOpacity: 0.5 }}
    />
  ) : (
    <circle
      cx={nade.X}
      cy={nade.Y}
      r="5"
      fill={NadeColor[nade.Weapon]}
      stroke={teamColor(nade.Team)}
      strokeWidth="2"
    />
  )
}
