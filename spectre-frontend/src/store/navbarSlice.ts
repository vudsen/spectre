import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

type NavbarCrumb = {
  name: string
  href?: string
}

export interface NavbarState {
  /**
   * 额外的面包屑，显示在最后面
   */
  crumbs: NavbarCrumb[]
}

const initialState: NavbarState = {
  crumbs: [],
}

export const navbarSlice = createSlice({
  name: 'navbar',
  initialState,
  reducers: {
    /**
     * 替换当前的面包屑
     */
    replaceCrumbs(state, action: PayloadAction<NavbarCrumb[]>) {
      state.crumbs = action.payload
    },
  },
})

export const { replaceCrumbs } = navbarSlice.actions
export default navbarSlice.reducer
