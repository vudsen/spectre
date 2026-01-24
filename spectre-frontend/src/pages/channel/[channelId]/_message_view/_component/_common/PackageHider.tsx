import React, { useMemo, useState } from 'react'

type ClassInfo = {
  package: string
  lightPackage: string
  classname: string
}

interface PackageHiderProps {
  classname: string
  forceExpand?: boolean
}

const PackageHider: React.FC<PackageHiderProps> = ({
  classname,
  forceExpand,
}) => {
  const [lightMode, setLightMode] = useState(true)
  const info: ClassInfo = useMemo(() => {
    const packageCharacters: string[] = []
    const pkgs = classname.split('.')
    for (let i = 0; i < pkgs.length - 1; i++) {
      if (i === 1) {
        // usually company name
        packageCharacters.push(pkgs[i])
      } else {
        packageCharacters.push(pkgs[i].charAt(0))
      }
    }
    return {
      classname: pkgs[pkgs.length - 1],
      package: classname.substring(0, classname.lastIndexOf('.')),
      lightPackage: packageCharacters.join('.'),
    }
  }, [classname])

  return (
    <>
      {lightMode && !forceExpand ? (
        <span
          className="cursor-pointer bg-green-100"
          onClick={() => setLightMode(false)}
        >
          {info.lightPackage}
        </span>
      ) : (
        <span>{info.package}</span>
      )}
      <span>.{info.classname}</span>
    </>
  )
}

export default PackageHider
