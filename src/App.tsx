import { faFile, faHome, faTrophy } from "@fortawesome/free-solid-svg-icons"
import React from "react"
import { BrowserRouter, Route, Switch } from "react-router-dom"
import { DemoList } from "./DemoList"
import { DemoPage } from "./DemoPage"
import { Home } from "./Home"
import { Layout, MenuItem, NavItem } from "./Layout"
import { MatchContextProvider } from "./MatchContext"
import { Matches } from "./Matches"
import { Results } from "./Results"
import { Sandbox } from "./Sandbox"

export function App() {
  return (
    <BrowserRouter>
      <MatchContextProvider>
        <Switch>
          <Route>
            <Layout nav={<Nav />} menu={<Menu />}>
              <MainSwitch />
            </Layout>
          </Route>
        </Switch>
      </MatchContextProvider>
    </BrowserRouter>
  )
}

function MainSwitch() {
  return (
    <Switch>
      <Route path="/results" component={Results}></Route>
      <Route path="/matches" component={Matches}></Route>
      <Route path="/files/*" component={DemoPage}></Route>
      <Route path="/files" component={DemoList}></Route>
      <Route path="/sandbox" component={Sandbox}></Route>
      <Route path="/" component={Home}></Route>
    </Switch>
  )
}

function Nav() {
  return (
    <>
      <NavItem icon={faFile} to="/files" label="Files" />
      <NavItem icon={faTrophy} to="/results" label="Results" />
    </>
  )
}

function Menu() {
  return (
    <>
      <MenuItem icon={faHome} to="/" exact label="Home" />
      <MenuItem icon={faFile} to="/files" label="Files" />
      <MenuItem icon={faTrophy} to="/results" label="Results" />
    </>
  )
}
