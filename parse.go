package main

import (
	"io"
	"io/ioutil"
	"log"
	"math"
	"os"
	"sort"

	"github.com/golang/geo/r2"
	"github.com/golang/geo/r3"
	"github.com/markus-wa/demoinfocs-golang"
	"github.com/markus-wa/demoinfocs-golang/common"
	"github.com/markus-wa/demoinfocs-golang/events"
	"github.com/markus-wa/demoinfocs-golang/metadata"
)

var debug = log.New(ioutil.Discard, "", log.LstdFlags)
var warn = log.New(os.Stderr, "", log.LstdFlags)

func init() {
	demoinfocs.DefaultParserConfig.MsgQueueBufferSize = 128 * 1024
}

// Parse ...
func Parse(reader io.Reader) (match Match, err error) {
	parser := demoinfocs.NewParser(reader)
	header, err := parser.ParseHeader()
	if err != nil {
		return
	}
	mapMetadata := metadata.MapNameToMap[header.MapName]
	normalize := func(point r3.Vector) r2.Point {
		x, y := mapMetadata.TranslateScale(point.X, point.Y)
		return r2.Point{X: math.Round(x), Y: math.Round(y)}
	}
	normalizeSafe := func(p *common.Player) r2.Point {
		if p == nil {
			return r2.Point{}
		}
		return normalize(p.Position)
	}

	state := parser.GameState()
	var round Round
	var bomb Bomb
	nades := make(map[int]NadeEvent)

	parser.RegisterEventHandler(func(e events.MatchStart) {
		log.Printf("%6d| MatchStart\t[%d]\tstarted=%t\twarmup=%t\tTickRate=%.1f\tFrameRate=%.1f\n",
			parser.CurrentFrame(),
			state.TotalRoundsPlayed(),
			state.IsMatchStarted(),
			state.IsWarmupPeriod(),
			parser.TickRate(),
			header.FrameRate())
		if match.Ended || match.Started && state.IsWarmupPeriod() {
			return
		}
		match = Match{
			TypeName:   "Match",
			TickRate:   int(math.Round(parser.TickRate())),
			FrameRate:  int(math.Round(header.FrameRate())),
			MapName:    header.MapName,
			Started:    true,
			Rounds:     make([]Round, 0),
			KillEvents: make([]KillEvent, 0),
			NadeEvents: make([]NadeEvent, 0),
		}
	})
	parser.RegisterEventHandler(func(e events.RoundStart) {
		log.Printf("%6d| RoundStart\t[%d]\tstarted=%t\twarmup=%t\n",
			parser.CurrentFrame(),
			state.TotalRoundsPlayed(),
			state.IsMatchStarted(),
			state.IsWarmupPeriod())
		round = Round{
			TypeName:  "Round",
			Tick:      state.IngameTick(),
			Frame:     parser.CurrentFrame(),
			Round:     state.TotalRoundsPlayed(),
			TimeLimit: e.TimeLimit,
			Frames:    make([]Frame, 0),
		}
		bomb = Bomb{}
	})
	parser.RegisterEventHandler(func(e events.RoundFreezetimeEnd) {
		if state.IsMatchStarted() && !state.IsWarmupPeriod() {
			round.Started = true
		}
	})
	parser.RegisterEventHandler(func(e events.RoundEnd) {
		log.Printf("%6d| RoundEnd\t[%d]\tstarted=%t\twarmup=%t\n",
			parser.CurrentFrame(),
			state.TotalRoundsPlayed(),
			state.IsMatchStarted(),
			state.IsWarmupPeriod())
		round.Winner = e.Winner
		round.Reason = e.Reason
		if match.Started && !match.Ended && round.Started &&
			round.Winner != common.TeamSpectators &&
			round.Reason != events.RoundEndReason(0) {
			match.Rounds = append(match.Rounds, round)
		}
	})
	parser.RegisterEventHandler(func(e events.AnnouncementWinPanelMatch) {
		log.Printf("%6d| AnnouncementWinPanelMatch\n", parser.CurrentFrame())
		match.Ended = true
	})

	parser.RegisterEventHandler(func(e events.GrenadeProjectileThrow) {
		debug.Printf("%6d| GrenadeProjectileThrow\t%d\n", parser.CurrentFrame(),
			e.Projectile.EntityID)
		nades[e.Projectile.EntityID] = NadeEvent{
			Position: e.Projectile.Thrower.Position,
			Velocity: e.Projectile.Thrower.Velocity,
			Yaw:      e.Projectile.Thrower.ViewDirectionX,
			Pitch:    e.Projectile.Thrower.ViewDirectionY,
		}
	})

	parser.RegisterEventHandler(func(e events.FlashExplode) {
		debug.Printf("%6d| FlashExplode\t%d\t%d\t%d\n", parser.CurrentFrame(),
			e.GrenadeEntityID, e.Thrower.Team, e.Thrower.SteamID)
		proj, ok := state.GrenadeProjectiles()[e.GrenadeEntityID]
		if !ok {
			warn.Printf("%6d| FlashExplode\tProjectileNotFound", parser.CurrentFrame())
			return
		}
		trajectory := make([]r2.Point, len(proj.Trajectory))
		for i := range proj.Trajectory {
			trajectory[i] = normalize(proj.Trajectory[i])
		}
		nade, ok := nades[e.GrenadeEntityID]
		if !ok {
			warn.Printf("%6d| FlashExplode\tNadeEvent", parser.CurrentFrame())
			return
		}
		match.NadeEvents = append(match.NadeEvents, NadeEvent{
			ID:         e.GrenadeEntityID,
			Weapon:     e.GrenadeType,
			Thrower:    e.Thrower.SteamID,
			Team:       e.Thrower.Team,
			Position:   nade.Position,
			Velocity:   nade.Velocity,
			Yaw:        nade.Yaw,
			Pitch:      nade.Pitch,
			Trajectory: trajectory,
			Tick:       state.IngameTick(),
			Frame:      parser.CurrentFrame(),
			Round:      state.TotalRoundsPlayed(),
		})
	})

	parser.RegisterEventHandler(func(e events.PlayerFlashed) {
		debug.Printf("%6d| PlayerFlashed\t%d\t%d\t%d\n", parser.CurrentFrame(),
			e.Projectile.EntityID, e.Attacker.Team, e.Player.Team)
	})

	parser.RegisterEventHandler(func(e events.Kill) {
		debug.Printf("%6d| KillEvents\t%#v\n", parser.CurrentFrame(), e)
		if !match.Started || match.Ended || !round.Started {
			return
		}
		match.KillEvents = append(match.KillEvents, KillEvent{
			Killer:     getSteamID(e.Killer),
			Victim:     getSteamID(e.Victim),
			Assister:   getSteamID(e.Assister),
			Weapon:     getWeapon(e.Weapon),
			Team:       getTeam(e.Victim),
			IsHeadshot: e.IsHeadshot,
			Penetrated: e.PenetratedObjects,
			Tick:       state.IngameTick(),
			Frame:      parser.CurrentFrame(),
			Round:      state.TotalRoundsPlayed(),
			Point:      normalizeSafe(e.Victim),
			From:       normalizeSafe(e.Killer),
		})
	})

	parser.RegisterEventHandler(func(e events.PlayerHurt) {
		debug.Printf("%6d| PlayerHurt\t%#v\n", parser.CurrentFrame(), e)
	})
	parser.RegisterEventHandler(func(e events.Footstep) {
		debug.Printf("%6d| Footstep\t%#v\n", parser.CurrentFrame(), e)
	})

	parser.RegisterEventHandler(func(e events.BombEventIf) {
		debug.Printf("%6d| BombEventIf\t%#v\n", parser.CurrentFrame(), e)
		switch e.(type) {
		case events.BombPlantBegin:
			bomb.State |= BombPlanting
		case events.BombPlantAborted:
			bomb.State ^= BombPlanting
		case events.BombPlanted:
			bomb.State = BombPlanted
			round.BombSite = string(e.(events.BombPlanted).Site)
		case events.BombDefuseStart:
			bomb.State |= BombDefusing
		case events.BombDefuseAborted:
			bomb.State ^= BombDefusing
		case events.BombDefused:
			bomb.State = BombDefused
		case events.BombExplode:
			bomb.State = BombExploded
		default:
			bomb.State = 0
		}
	})

	parser.RegisterEventHandler(func(_ events.FrameDone) {
		if !state.IsMatchStarted() || state.IsWarmupPeriod() {
			return
		}
		if !match.Started || match.Ended || !round.Started {
			return
		}
		if parser.CurrentFrame()%32 != 0 {
			return
		}
		frame := Frame{
			Tick:  state.IngameTick(),
			Frame: parser.CurrentFrame(),
			Bomb:  bomb,
		}
		frame.Bomb.Point = normalize(state.Bomb().Position())
		for _, p := range state.Participants().Connected() {
			switch p.Team {
			case common.TeamSpectators, common.TeamUnassigned:
				continue
			}
			player := Player{
				ID:    p.SteamID,
				Name:  p.Name,
				Team:  p.Team,
				Money: p.Money,
			}
			if p.IsAlive() {
				player.Point = normalize(p.Position)
				player.Yaw = math.Round(float64(p.ViewDirectionX))
				player.Hp = p.Hp
				if p.ActiveWeapon() != nil {
					player.Weapon = p.ActiveWeapon().Weapon
				}
				for _, w := range p.Weapons() {
					player.Weapons = append(player.Weapons, w.Weapon)
				}
				if p.HasDefuseKit {
					player.Weapons = append(player.Weapons, common.EqDefuseKit)
					player.State ^= HasDefuseKit
				}
				if p.HasHelmet {
					player.State ^= HasHelmet
				}
				if p.Armor > 0 {
					player.State ^= HasArmor
				}
				if p.IsDucking {
					player.State ^= IsDucking
				}
				if p.IsReloading {
					player.State ^= IsReloading
				}
				sort.Slice(player.Weapons, func(i, j int) bool {
					return int(player.Weapons[i]) < int(player.Weapons[j])
				})
			} else {
				player.Point = normalize(p.LastAlivePosition)
			}
			if p.FlashDuration > 0 {
				d := p.FlashDuration
				d -= float32(state.IngameTick()-p.FlashTick) / float32(header.TickRate())
				if d > 0 {
					player.Flashed = d
				}
			}
			frame.Players = append(frame.Players, player)
			sort.Slice(frame.Players, func(i, j int) bool {
				if frame.Players[i].Team == frame.Players[j].Team {
					return frame.Players[i].ID < frame.Players[j].ID
				}
				return int(frame.Players[i].Team) > int(frame.Players[j].Team)
			})
		}
		for _, e := range state.GrenadeProjectiles() {
			active := false
			if e.Weapon == common.EqSmoke {
				prop := state.Entities()[e.EntityID].FindProperty("m_nSmokeEffectTickBegin")
				if prop.Value().IntVal != 0 {
					active = true
				}
			}
			frame.Nades = append(frame.Nades, Nade{
				ID:      e.EntityID,
				Weapon:  e.Weapon,
				Point:   normalize(e.Position),
				Thrower: getSteamID(e.Thrower),
				Team:    getTeam(e.Thrower),
				Active:  active,
			})
			sort.Slice(frame.Nades, func(i, j int) bool {
				return frame.Nades[i].ID < frame.Nades[j].ID
			})
		}
		for _, e := range state.Infernos() {
			arr := e.Active().ConvexHull2D()
			for i, f := range arr {
				x, y := mapMetadata.TranslateScale(f.X, f.Y)
				arr[i].X = math.Round(x)
				arr[i].Y = math.Round(y)
			}
			frame.Nades = append(frame.Nades, Nade{
				ID:      e.EntityID,
				Thrower: getSteamID(e.Thrower()),
				Team:    getTeam(e.Thrower()),
				Active:  true,
				Flames:  arr,
			})
		}
		round.Frames = append(round.Frames, frame)
	})

	parser.RegisterEventHandler(func(e events.ParserWarn) {
		log.Printf("%6d| ParserWarn\t%s\n", parser.CurrentFrame(), e.Message)
	})

	err = parser.ParseToEnd()
	if err == demoinfocs.ErrUnexpectedEndOfDemo {
		log.Printf("%6d| ErrUnexpectedEndOfDemo\n", parser.CurrentFrame())
		err = nil
	} else if err != nil {
		log.Printf("%6d| ParseError\t%s\n", parser.CurrentFrame(), err.Error())
	} else {
		log.Printf("%6d| ParseToEnd\n", parser.CurrentFrame())
	}
	return
}

func getSteamID(p *common.Player) int64 {
	if p == nil {
		return 0
	}
	return p.SteamID
}
func getTeam(p *common.Player) common.Team {
	if p == nil {
		return common.TeamUnassigned
	}
	return p.Team
}
func getWeapon(p *common.Equipment) common.EquipmentElement {
	if p == nil {
		return common.EqUnknown
	}
	return p.Weapon
}
