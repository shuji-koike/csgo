import { faBomb, faTimes, faTools } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import Slider from "@material-ui/core/Slider"
import { uniqBy } from "lodash"
import React from "react"
import styled from "styled-components"
import { BombState, TeamColor, bombColor } from "."

export const DemoSlider: React.FC<{
  match: Match
  round?: Round
  frame?: Frame
  setFrame: (e: Frame) => void
}> = function ({ match, round, frame, setFrame }) {
  if (!round || !frame) return null
  const marks = React.useMemo(
    () => [
      ...round.Frames.filter(e => e.Bomb.State & BombState.Planted)
        .slice(0, 1)
        .map(e => ({
          value: round.Frames.indexOf(e),
          label: (
            <Icon
              style={{ color: bombColor(e.Bomb.State) }}
              icon={faBomb}></Icon>
          ),
        })),
      ...round.Frames.filter(e => e.Bomb.State & BombState.Defused)
        .slice(0, 1)
        .map(e => ({
          value: round.Frames.indexOf(e),
          label: <Icon style={{ color: TeamColor[3] }} icon={faTools}></Icon>,
        })),
      ...round.Frames.filter(e => e.Bomb.State & BombState.Exploded)
        .slice(0, 1)
        .map(e => ({
          value: round.Frames.indexOf(e),
          label: (
            <Icon
              style={{ color: bombColor(e.Bomb.State) }}
              icon={faBomb}></Icon>
          ),
        })),
      ...round.Frames.filter(
        (e, i, arr) =>
          !(frameToTime(match, round, e) % 5) &&
          arr.find(
            f => frameToTime(match, round, f) === frameToTime(match, round, e)
          ) === e
      ).map(e => ({
        value: round.Frames.indexOf(e),
        label: <MarkerLabel>{labelFormat(match, round, e)}</MarkerLabel>,
      })),
      ...match.KillEvents.filter(e => e.Round == round.Round).map(e => ({
        value: findIndex(round.Frames, f => f.Tick >= e.Tick),
        label: (
          <Icon style={{ color: TeamColor[e.Team] }} icon={faTimes}></Icon>
        ),
      })),
    ],
    [match, round]
  )
  return (
    <Slider
      value={round.Frames.indexOf(frame)}
      max={round.Frames.length - 1}
      onChange={(_, value) => setFrame(round.Frames[value as number])}
      marks={uniqBy(marks, "value")}
      valueLabelDisplay="auto"
      valueLabelFormat={e => labelFormat(match, round, round.Frames[e])}
    />
  )
}

function findIndex(frames: Frame[], fn: (f: Frame) => boolean) {
  const index = frames.findIndex(fn)
  return index == -1 ? frames.length - 1 : index
}

function tickToSecond(match: Match, round: Round, tick: number) {
  return ((tick || 0) - round.Frames[0].Tick) / match.TickRate
}

function frameToTime(match: Match, round: Round, frame: Frame): number {
  const tick =
    round.Frames.find(e => e.Bomb.State & BombState.Planted)?.Tick ?? NaN
  return frame.Bomb.State & BombState.Planted
    ? Math.floor((frame.Tick - tick) / match.TickRate)
    : round.TimeLimit - tickToSecond(match, round, frame.Tick)
}

function labelFormat(match: Match, round: Round, frame: Frame) {
  return frame.Bomb.State & BombState.Planted
    ? frameToTime(match, round, frame)
    : new Date(frameToTime(match, round, frame) * 1000)
        .toISOString()
        .substr(14, 5)
}

const MarkerLabel = styled.span`
  color: #666;
  font-size: 14px !important;
  font-family: monospace;
  letter-spacing: -1px;
`
const Icon = styled(FontAwesomeIcon)`
  position: relative;
  top: -19px;
`
