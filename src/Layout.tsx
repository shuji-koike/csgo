import { IconProp } from "@fortawesome/fontawesome-svg-core" // eslint-disable-line no-unused-vars
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { Drawer } from "@material-ui/core"
import AppBar from "@material-ui/core/AppBar"
import CssBaseline from "@material-ui/core/CssBaseline"
import IconButton from "@material-ui/core/IconButton"
import List from "@material-ui/core/List"
import ListItem from "@material-ui/core/ListItem"
import ListItemIcon from "@material-ui/core/ListItemIcon"
import ListItemText from "@material-ui/core/ListItemText"
import Toolbar from "@material-ui/core/Toolbar"
import Typography from "@material-ui/core/Typography"
import MenuIcon from "@material-ui/icons/Menu"
import React from "react"
import { NavLink } from "react-router-dom"

// https://git.io/JvUzq

class LayoutState {
  showHeader = true
  showDrawer = false
  nav: React.ReactNode = null
}

export const LayoutContext = React.createContext<{
  layout: LayoutState
  setLayout: (layout: LayoutState) => void
}>({
  layout: new LayoutState(),
  setLayout: () => undefined,
})

export const Layout: React.FC<{
  title?: string
  nav?: React.ReactNode
  menu?: React.ReactNode
}> = function ({ title, nav, menu, children }) {
  const [layout, setLayout] = React.useState(new LayoutState())
  const MenuButton = () => (
    <IconButton
      edge="start"
      color="inherit"
      onClick={() => setLayout({ ...layout, showDrawer: !layout.showDrawer })}>
      <MenuIcon />
    </IconButton>
  )
  return (
    <LayoutContext.Provider value={{ layout, setLayout }}>
      <CssBaseline />
      <AppBar color="transparent" style={{ top: layout.showHeader ? 0 : -60 }}>
        <Toolbar variant="dense">
          <MenuButton />
          {title && (
            <Typography component="h1" variant="h6" color="inherit" noWrap>
              <NavLink to="/">{title}</NavLink>
            </Typography>
          )}
          {layout.nav ?? nav}
        </Toolbar>
      </AppBar>
      <Drawer open={layout.showDrawer}>
        <MenuButton />
        <List>{menu}</List>
      </Drawer>
      {children}
    </LayoutContext.Provider>
  )
}

export const HeaderSlot: React.FC<{
  deps?: ReadonlyArray<any>
}> = ({ deps, children }) => {
  const { layout, setLayout } = React.useContext(LayoutContext)
  React.useEffect(() => {
    setLayout({ ...layout, nav: children })
    return () => setLayout({ ...layout, nav: null })
  }, deps)
  return <></>
}

export const NavItem: React.FC<{
  icon: IconProp
  label?: string
  to: string
  exact?: boolean
}> = ({ icon, label, ...props }) => (
  <Typography variant="h6">
    <NavLink {...props}>
      {icon && <FontAwesomeIcon icon={icon} />}
      {label}
    </NavLink>
  </Typography>
)

export const MenuItem: React.FC<{
  icon: IconProp
  label?: string
  divider?: boolean
  to: string
  exact?: boolean
}> = ({ icon, label, divider, ...props }) => (
  <ListItem button divider={divider !== false} component={NavLink} {...props}>
    <ListItemIcon>
      <FontAwesomeIcon icon={icon} />
    </ListItemIcon>
    <ListItemText primary={label} />
  </ListItem>
)
