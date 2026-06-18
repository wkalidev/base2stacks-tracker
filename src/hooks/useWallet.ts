'use client'

import { useState, useEffect } from 'react'
import { AppConfig, UserSession, showConnect, setSelectedProviderId, getSelectedProviderId } from '@stacks/connect'

declare global {
  interface Window {
    XverseProviders?: { StacksProvider?: unknown }
  }
}

const appConfig  = new AppConfig(['store_write', 'publish_data'])
const userSession = new UserSession({ appConfig })

// Leather sets window.StacksProvider as immutable, shadowing Xverse's injection path.
// Check window.XverseProviders.StacksProvider directly to detect Xverse regardless.
function preferXverseIfAvailable() {
  if (typeof window === 'undefined') return
  if (window.XverseProviders?.StacksProvider) {
    if (!getSelectedProviderId()) {
      setSelectedProviderId('XverseProviders.StacksProvider')
    }
  }
}

export function useWallet() {
  const [mounted,  setMounted]  = useState(false)
  const [userData, setUserData] = useState<any>(null)
  const [address,  setAddress]  = useState<string>('')

  useEffect(() => {
    setMounted(true)
    if (userSession.isUserSignedIn()) {
      const data = userSession.loadUserData()
      setUserData(data)
      setAddress(data.profile.stxAddress.mainnet)
    }
  }, [])

  const connect = () => {
    preferXverseIfAvailable()
    showConnect({
      appDetails: {
        name: 'Base2Stacks Bridge Tracker',
        icon: window.location.origin + '/android-chrome-512x512.png',
      },
      redirectTo: '/',
      onFinish: () => {
        const data = userSession.loadUserData()
        setUserData(data)
        setAddress(data.profile.stxAddress.mainnet)
        window.location.reload()
      },
      userSession,
    })
  }

  const disconnect = () => {
    userSession.signUserOut()
    setUserData(null)
    setAddress('')
    window.location.reload()
  }

  return {
    mounted,
    connect,
    disconnect,
    isConnected: userData !== null,
    address,
    userData,
  }
}
