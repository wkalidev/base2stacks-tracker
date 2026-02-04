'use client'

import { useState, useEffect } from 'react'
import { AppConfig, UserSession, showConnect } from '@stacks/connect'
import { StacksTestnet, StacksMainnet } from '@stacks/network'

const appConfig = new AppConfig(['store_write', 'publish_data'])
const userSession = new UserSession({ appConfig })

export function useWallet() {
  const [mounted, setMounted] = useState(false)
  const [userData, setUserData] = useState<any>(null)
  const [address, setAddress] = useState<string>('')

  useEffect(() => {
    setMounted(true)
    if (userSession.isUserSignedIn()) {
      const data = userSession.loadUserData()
      setUserData(data)
      setAddress(data.profile.stxAddress.testnet)
    }
  }, [])

  const connect = () => {
    showConnect({
      appDetails: {
        name: 'Base2Stacks Bridge Tracker',
        icon: window.location.origin + '/android-chrome-512x512.png',
      },
      redirectTo: '/',
      onFinish: () => {
        const data = userSession.loadUserData()
        setUserData(data)
        setAddress(data.profile.stxAddress.testnet)
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

  const isConnected = userData !== null

  return {
    mounted,
    connect,
    disconnect,
    isConnected,
    address,
    userData,
  }
}