import { useEffect, useState } from 'react'
import { jsonInfo2PoolKeys, LiquidityPoolKeys, LiquidityPoolJsonInfo } from '@raydium-io/raydium-sdk'
import axios from 'axios'
import { snackbarSubject } from '../components/Snackbar'

interface Props {
  poolKey: string
}

export default function useGetPoolInfo({ poolKey }: Props) {
  const [key, setKey] = useState<LiquidityPoolKeys>()
  useEffect(() => {
    async function fetchPool() {
      try {
        const { data } = await axios.get(process.env.RAYDIUM_LIQUIDITY_POOLS as string)
        const pools: LiquidityPoolJsonInfo[] = (data?.official || []).concat(data?.unOfficial || [])
        const raySolPk = jsonInfo2PoolKeys(pools.find((item) => item.lpMint === poolKey) as LiquidityPoolJsonInfo)
        setKey(raySolPk)
      } catch (_) {
        snackbarSubject.next({
          message: 'something wrong with fetching pool info',
        })
      }
    }
    fetchPool()
  }, [poolKey])

  return key
}
