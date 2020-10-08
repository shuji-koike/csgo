import axios from "axios"
import icons from "./icons.json"

/* eslint-disable no-unused-vars */
export enum Team {
  Unassigned = 0,
  Spectators = 1,
  Terrorists = 2,
  CounterTerrorists = 3,
}

export enum BombState {
  Planting = 1,
  Planted = 1 << 1,
  Defusing = 1 << 2,
  Defused = 1 << 3,
  Exploded = 1 << 4,
}

export enum PlayerState {
  HasHelmet = 1,
  HasArmor = 1 << 1,
  HasDefuseKit = 1 << 2,
  HasBomb = 1 << 3,
  IsBot = 1 << 4,
  IsConnected = 1 << 5,
  IsDucking = 1 << 6,
  IsDefusing = 1 << 7,
  IsPlanting = 1 << 8,
  IsReloading = 1 << 9,
  IsUnknown = 1 << 10,
}
/* eslint-enable no-unused-vars */

export type Dict<V = string> = {
  [key: string]: V
}

export const TeamOpponent: Map<Team, Team> = new Map([
  [Team.Terrorists, Team.CounterTerrorists],
  [Team.CounterTerrorists, Team.Terrorists],
])

export const TeamColor: Dict<string> = {
  [Team.Unassigned]: "#F00",
  [Team.Spectators]: "#0F0",
  [Team.Terrorists]: "#CC9629",
  [Team.CounterTerrorists]: "#295FCC",
}

export function teamColor(n: Team): string {
  return TeamColor[n || 0]
}

export function teamOpponentColor(n: Team): string {
  return TeamColor[TeamOpponent.get(n) || 0]
}

export const NadeColor: Dict<string> = {
  501: "gray", // EqDecoy
  502: "red", // EqMolotov
  503: "red", // EqIncendiary
  504: "#A1E6C9", // EqFlash
  505: "white", // EqSmoke
  506: "purple", // EqHE
}

export function bombColor(state: BombState) {
  return (
    {
      [BombState.Planting]: "#FFFF00",
      [BombState.Planted]: "#FF0000",
      [BombState.Planted | BombState.Defusing]: "#3567CC",
      [BombState.Defused]: "#3567CC",
      [BombState.Exploded]: "#FF0000",
    }[state] || "#E04800"
  )
}

export function colorToMatrix(hex: string) {
  const [r, g, b] = (hex.slice(1).match(/.{2}/g) || []).map(
    a => parseInt(a, 16) / 255
  )
  return [
    [0, 0, 0, 0, r],
    [0, 0, 0, 0, g],
    [0, 0, 0, 0, b],
    [0, 0, 0, 1, 0],
  ]
    .flat()
    .join(" ")
}

export function rotatePoint(p: Point, r: number, d: number): Point {
  return {
    X: p.X + Math.cos((r * Math.PI) / 180) * d,
    Y: p.Y + Math.sin((r * Math.PI) / 180) * d,
  }
}

export function pointToArray(p: Point) {
  return [p.X, p.Y]
}

export function pointsToString(arr: Point[]) {
  return arr.map(pointToArray).flat().join(" ")
}

export function findRound(
  match: Match,
  tick: number | undefined
): Round | undefined {
  if (typeof tick != "number") return
  return match.Rounds?.find(e => e.Frames[e.Frames.length - 1].Tick > tick)
}

export function findFrame(
  match: Match,
  tick: number | undefined
): Frame | undefined {
  if (typeof tick != "number") return
  return findRound(match, tick)?.Frames.find(e => e.Tick > tick)
}

export async function fetchSteamData(ids: number[]) {
  const url =
    "/api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?steamids=" +
    Array.from(new Set(ids)).join(",")
  const { data } = await axios.get(url)
  return data.response?.players?.reduce?.(
    (acc: any, e: any) => (acc[e.steamid] = e),
    {}
  )
}

class PlayerScore {
  ID: number
  Name: string = ""
  Team: Team = 0
  kills: number = 0
  assists: number = 0
  deaths: number = 0
  headshots: number = 0
  constructor(ID: number) {
    this.ID = ID
  }
  get headshotPercentage() {
    return ((this.headshots / this.kills) * 100).toFixed(1) + "%"
  }
  get killDeath() {
    return (this.kills / this.deaths).toFixed(2)
  }
}

export function getScores(match: Match) {
  const dict: { [key: number]: PlayerScore } = {}
  match.KillEvents.map(e => [e.Killer, e.Assister, e.Victim])
    .flat()
    .forEach(e => (dict[e] = new PlayerScore(e)))
  match.KillEvents.forEach(e => {
    dict[e.Killer].kills += 1
    dict[e.Assister].assists += 1
    dict[e.Victim].deaths += 1
    dict[e.Killer].headshots += e.IsHeadshot ? 1 : 0
  })
  match.Rounds?.slice(-1)
    .map(e => e.Frames.slice(-1))
    .flat()
    .forEach(e =>
      e?.Players.forEach(e =>
        Object.assign(dict[e.ID], { Name: e.Name, Team: e.Team })
      )
    )
  return Object.entries(dict)
    .map(([, v]) => v)
    .filter(e => e.ID)
    .sort((a, b) => (a.Team == b.Team ? b.kills - a.kills : a.Team - b.Team))
}

export function sumCache(frame: Frame, team: Team) {
  return frame.Players.filter(e => e.Team === team)
    .map(e => e.Money)
    .reduce((a, b) => a + b, 0)
}

export function setpos(e: { Position: Vector; Yaw: number; Pitch: number }) {
  return [
    `setpos ${e.Position.X} ${e.Position.Y} ${e.Position.Z}`,
    `setang ${e.Yaw} ${e.Pitch}`,
  ].join(";")
}

export function velocity(vector: Vector) {
  return Object.values(vector)
    .map(e => Math.floor(e))
    .join(",")
}

export function icon(name: string | number) {
  return (
    icons.canvas.sprites.find(e => e.name == name)?.src ||
    `/static/icons/${name}.png`
  )
}

export function armorIcon(player: Player) {
  return (
    (player.State & PlayerState.HasHelmet && icon(403)) ||
    (player.State & PlayerState.HasArmor && icon(402)) ||
    "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="
  )
}
