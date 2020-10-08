import axios from "axios"
import React from "react"
import { useParams } from "react-router-dom"

interface MatchState {
  match: Match | null
  setMatch: (match: Match) => void
  tick: number
  setTick: (tick: number) => void
}

export const MatchContext = React.createContext<MatchState>({} as MatchState)

export const MatchContextProvider: React.FC = ({ children }) => {
  const path = useParams<{ 0: string | undefined }>()?.[0]
  const [match, setMatch] = React.useState<Match | null>(null)
  const [tick, setTick] = React.useState(0)
  React.useEffect(() => {
    path && axios.get(`/api/files/${path}`).then(({ data }) => setMatch(data))
  }, [path])
  return (
    <MatchContext.Provider value={{ match, setMatch, tick, setTick }}>
      {children}
    </MatchContext.Provider>
  )
}
