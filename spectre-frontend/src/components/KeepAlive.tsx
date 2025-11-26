import React, { useEffect, useState } from 'react'
import { useLocation, useOutlet } from 'react-router'

type Route = {
  pathname: string
  element: React.ReactElement
}

function KeepAlive() {
  const [routes, setRoutes] = useState<Route[]>([])
  const outLet = useOutlet()
  const { pathname } = useLocation()

  useEffect(() => {
    if (!routes.find((r) => r.pathname === pathname) && outLet) {
      setRoutes([...routes, { pathname, element: outLet }])
    }
  }, [outLet, pathname, routes])
  return (
    <div>
      {routes.map((route) => (
        <div
          key={route.pathname}
          style={{ display: pathname === route.pathname ? 'block' : 'none' }}
        >
          {route.element}
        </div>
      ))}
    </div>
  )
}

export default KeepAlive
