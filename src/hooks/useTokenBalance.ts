import { PublicKey } from '@solana/web3.js'

import { TOKEN_PROGRAM_ID, SPL_ACCOUNT_LAYOUT, TokenAccount } from '@raydium-io/raydium-sdk'

import { useEffect, useState } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'

interface Props {
  tokenMint: string
}

export default function useTokenBalance({ tokenMint }: Props) {
  const { publicKey } = useWallet()
  const { connection } = useConnection()
  const [tokenAccounts, setTokenAccounts] = useState<TokenAccount[]>([])
  const [tokenBalance, setTokenBalance] = useState<number>(0)

  useEffect(() => {
    async function fetchAccounts() {
      const tokenResp = await connection.getTokenAccountsByOwner(publicKey!, {
        programId: TOKEN_PROGRAM_ID,
      })

      setTokenAccounts(
        tokenResp.value.reduce(
          (acc, { pubkey, account }) => acc.concat([{ pubkey, accountInfo: SPL_ACCOUNT_LAYOUT.decode(account.data) }]),
          [] as TokenAccount[]
        )
      )
    }

    if (publicKey) {
      fetchAccounts()
      return
    }
    setTokenAccounts([])
    setTokenBalance(0)
  }, [connection, publicKey])

  useEffect(() => {
    if (!tokenAccounts.length) return

    async function getTokenBalance(tokenAddress: PublicKey) {
      const accountBalance = await connection.getTokenAccountBalance(tokenAddress)
      const balance = accountBalance.value.uiAmount || 0
      setTokenBalance(balance)
    }
    const tokenAddress = tokenAccounts.find((account) => account.accountInfo.mint.toBase58() === tokenMint)?.pubkey
    if (tokenAddress) {
      getTokenBalance(tokenAddress)
    }
  }, [connection, tokenAccounts, tokenMint])

  return { tokenBalance, tokenAccounts }
}
