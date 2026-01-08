import { combineReducers, configureStore } from '@reduxjs/toolkit'
import navbarReducer from '@/store/navbarSlice.ts'
import channelReducer from '@/store/channelSlice.ts'
import sessionReducer from '@/store/sessionSlice.ts'
import tipReducer from './tipSlice'
import { persistStore, persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage'

const channelPersistConfig = {
  key: 'channel',
  storage,
  blacklist: [],
}

const sessionPersistConfig = {
  key: 'session',
  storage,
}

const tipPersistConfig = {
  key: 'tip',
  storage,
}
const rootReducer = combineReducers({
  navbar: navbarReducer,
  channel: persistReducer(channelPersistConfig, channelReducer),
  session: persistReducer(sessionPersistConfig, sessionReducer),
  tip: persistReducer(tipPersistConfig, tipReducer),
})

export const store = configureStore({
  reducer: rootReducer,
})
export const persistor = persistStore(store)

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch
