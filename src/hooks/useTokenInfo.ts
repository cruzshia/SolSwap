import { useState, useEffect, useCallback } from 'react'
import { createModel } from 'hox'
import axios from 'axios'

interface TokenInfo {
  mint: string
  decimals: number
  extensions: Record<string, any>
  name: string
  symbol: string
  icon: string
}

interface TokenInfoResp {
  name: string
  timestamp: string
  official: TokenInfo[]
  version: {
    major: number
    minor: number
    patch: number
  }
}

function useTokenInfo() {
  const [tokenInfos, setTokenInfos] = useState<Record<string, TokenInfo>>({})
  const [refreshFlag, setRefreshFeched] = useState<number>(0)

  const handleReFetch = useCallback(() => setRefreshFeched(Date.now()), [])

  useEffect(() => {
    async function fetchTokenList() {
      try {
        const { data } = await axios.get<TokenInfoResp>(process.env.RAYDIUM_TOKEN_LIST as string)
        setTokenInfos(
          data.official.reduce(
            (acc, tokenInfo) => ({
              ...acc,
              [tokenInfo.symbol]: tokenInfo,
            }),
            {}
          )
        )
      } catch (e) {
        console.log(e)
      }
    }
    fetchTokenList()
  }, [refreshFlag])

  return { tokenInfos, refreshToken: handleReFetch }
}

export default createModel(useTokenInfo)
