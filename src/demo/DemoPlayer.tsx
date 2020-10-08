import React from "react"
import styled from "styled-components"
import { HeaderSlot } from "../Layout"
import { DemoMenu } from "./DemoMenu"
import { DemoNav } from "./DemoNav"
import { DemoSlider } from "./DemoSlider"
import { FrameView, TrailView } from "./FrameView"
import { KillEventView } from "./KillEvent"
import { MapView } from "./MapView"
import { NadeEventView } from "./NadeEvent"
import { fetchSteamData, findRound, findFrame } from "."

export const DemoPlayer: React.FC<{
  match: Match
  tick?: number
  onExit?: () => void
}> = function ({ match, tick, onExit }) {
  const [state, setState] = React.useState({ paused: true, wheel: false })
  const [round, setRound] = React.useState(findRound(match, tick))
  const [frame, setFrame] = React.useState(findFrame(match, tick))
  const [steam, setSteam] = React.useState<any>({})
  const [filter, setFilter] = React.useState<Filter>({})
  const ref = React.createRef<HTMLFormElement>()
  const currentRound = round?.Round || 0
  const currentFrame = frame ? round?.Frames.indexOf(frame) || 0 : 0
  const ids = frame?.Players.map(e => e.ID).sort((a, b) => a - b)
  React.useEffect(() => {
    if (frame && !round?.Frames.includes(frame)) setFrame(round?.Frames[0])
  }, [round])
  React.useEffect(() => {
    ids && fetchSteamData(ids).then(e => setSteam({ ...steam, ...e }))
  }, [ids?.join()])
  React.useEffect(() => ref.current?.focus(), [ref.current])
  React.useEffect(() =>
    clearInterval.bind(
      window,
      setTimeout(
        () => !state.paused && setCurrentFrame(currentFrame + 1),
        1000 / 8
      )
    )
  )
  React.useEffect(() => {
    document.body.style.overscrollBehaviorY = "none"
    return () => void (document.body.style.overscrollBehaviorY = "auto")
  })
  function setCurrentFrame(n: number) {
    const frame = round?.Frames[n]
    if (frame) setFrame(frame)
  }
  function setCurrentRound(n: number) {
    const round = match.Rounds?.find(e => e.Round === n)
    if (round) {
      setFrame(round.Frames[0])
      setRound(round)
    }
  }
  function setTick(tick: number) {
    setRound(findRound(match, tick))
    setFrame(findFrame(match, tick))
  }
  function onKeyDown(e: React.KeyboardEvent) {
    const dict: { [key: string]: () => void } = {
      ArrowUp: () => setCurrentRound(currentRound - 1),
      ArrowDown: () => setCurrentRound(currentRound + 1),
      ArrowLeft: () => setCurrentFrame(currentFrame - 1),
      ArrowRight: () => setCurrentFrame(currentFrame + 1),
      Escape: () => onExit?.(),
      q: () => onExit?.(),
      x: () => console.info(frame),
      " ": () => setState({ ...state, paused: !state.paused }),
    }
    dict[e.key]?.()
  }
  function onWheel(e: React.WheelEvent) {
    if (state.wheel && Math.abs(e.deltaX) < 10) {
      if (e.deltaY < 0) setCurrentFrame(currentFrame + 1)
      if (e.deltaY > 0) setCurrentFrame(currentFrame - 1)
      e.stopPropagation()
    }
  }
  return (
    <StyledForm ref={ref} tabIndex={0} onKeyDown={onKeyDown} onWheel={onWheel}>
      <HeaderSlot deps={[currentRound]}>
        <DemoNav match={match} round={round} onChange={setRound} />
      </HeaderSlot>
      <main>
        <MapView match={match}>
          <TrailView round={round} />
          <FrameView frame={frame} />
          {filter.kills &&
            match.KillEvents?.filter(filter.kills).map((e, i) => (
              <KillEventView key={i} event={e} onClick={e => setTick(e.Tick)} />
            ))}
          {filter.nades &&
            match.NadeEvents?.filter(filter.nades).map((e, i) => (
              <NadeEventView key={i} event={e} onClick={e => setTick(e.Tick)} />
            ))}
        </MapView>
      </main>
      <aside>
        <DemoMenu
          round={round}
          frame={frame}
          steam={steam}
          filter={filter}
          setFilter={setFilter}
        />
      </aside>
      <footer>
        <DemoSlider
          match={match}
          round={round}
          frame={frame}
          setFrame={setFrame}></DemoSlider>
        <pre>
          index:{currentFrame}, frame:{frame?.Frame}, tick:{frame?.Tick}
        </pre>
      </footer>
    </StyledForm>
  )
}

export interface Filter {
  players?: (e: Player) => boolean
  kills?: (e: KillEvent) => boolean
  nades?: (e: NadeEvent) => boolean
}

const StyledForm = styled.form`
  position: relative;
  outline: none;
  color: #fff;
  > main {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vh;
    height: 100vh;
    max-width: 100vw;
    max-height: 100vw;
  }
  > aside {
    position: fixed;
    top: 60px;
    right: 4px;
    width: 250px;
  }
  > footer {
    position: fixed;
    left: 0;
    bottom: 0;
    box-sizing: border-box;
    padding: 16px 32px;
    width: 100%;
  }
  > footer > pre {
    position: absolute;
    right: 0;
    bottom: 0;
    margin: 0;
    font-size: 16px;
    color: #333;
  }
`
