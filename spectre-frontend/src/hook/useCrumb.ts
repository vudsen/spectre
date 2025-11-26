import { useDispatch } from 'react-redux'
import { useEffect } from 'react'
import { replaceCrumbs } from '@/store/navbarSlice.ts'

export type Crumb = {
  name: string
  href?: string
}

const useCrumb = (crumbs: Crumb[]) => {
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(replaceCrumbs(crumbs))
    return () => {
      dispatch(replaceCrumbs([]))
    }
  }, [crumbs, dispatch])
}

export default useCrumb
