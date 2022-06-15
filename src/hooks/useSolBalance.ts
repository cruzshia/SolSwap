import { useEffect, useState } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'

export default function useSolBalance() {
  const { publicKey } = useWallet()
  const { connection } = useConnection()
  const [balance, setBalance] = useState<number>(0)

  useEffect(() => {
    const getAccountInfo = async () => {
      const balance = await connection.getBalance(publicKey!) // get SOL balance
      setBalance(balance / LAMPORTS_PER_SOL)
    }
    if (publicKey) {
      getAccountInfo()
      return
    }
    setBalance(0)
  }, [connection, publicKey])

  return {
    balance,
  }
}
