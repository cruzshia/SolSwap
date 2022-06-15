import { useEffect, useState, useCallback } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import {
  LiquidityPoolKeys,
  Liquidity,
  TokenAmount,
  Token,
  TokenAccount,
  Percent,
  Price,
  CurrencyAmount,
} from '@raydium-io/raydium-sdk'
import { snackbarSubject } from '../components/Snackbar'

interface Props {
  poolKeys?: LiquidityPoolKeys
  initialAmount?: string
  initialReverse?: boolean
}

export default function usePairInfo({ poolKeys, initialAmount, initialReverse }: Props) {
  const { connection } = useConnection()
  const { publicKey, sendTransaction } = useWallet()

  const [inputAmount, setInputAmount] = useState<string>(initialAmount || '')
  const [isReverse, setIsReverse] = useState<boolean>(initialReverse || false)
  const [refreshTag, setRefreshTag] = useState<number>(0)
  const [pairInfo, setPaiInfo] = useState<{
    amountIn: CurrencyAmount
    amountOut: CurrencyAmount
    minAmountOut: CurrencyAmount
    currentPrice: Price
    executionPrice: Price | null
    priceImpact: Percent
    fee: CurrencyAmount
  }>()

  const fetchPairInfo = useCallback(({ amount, reverse = false }: { amount?: string; reverse?: boolean }) => {
    setInputAmount(amount || '')
    setIsReverse((prev) => {
      if (prev !== reverse) {
        setPaiInfo(undefined)
      }
      return reverse
    })
    setRefreshTag(Date.now())
  }, [])

  const calPairAmount = useCallback(
    async ({ amount, reverse = false }: { amount: string; reverse: boolean }) => {
      const { baseMint, quoteMint } = poolKeys!
      try {
        const poolInfo = await Liquidity.fetchInfo({ connection, poolKeys: poolKeys! })

        const { baseDecimals, quoteDecimals } = poolInfo

        const [tokenInput, tokenInputDecimal, tokenOutput, tokenOutputDecimal] = reverse
          ? [baseMint, baseDecimals, quoteMint, quoteDecimals]
          : [quoteMint, quoteDecimals, baseMint, baseDecimals]

        const currencyIn = new Token(tokenInput, tokenInputDecimal)
        const amountIn = new TokenAmount(currencyIn, amount!, false)
        const currencyOut = new Token(tokenOutput, tokenOutputDecimal)
        const slippage = new Percent(10, 100)

        const res = {
          ...Liquidity.computeAmountOut({ poolKeys: poolKeys!, poolInfo, amountIn, currencyOut, slippage }),
          amountIn,
        }
        setPaiInfo(res)

        return res
      } catch (e) {
        snackbarSubject.next({
          message: 'something with fetching pair info',
        })
        return undefined
      }
    },
    [poolKeys, connection]
  )

  const swapToken = useCallback(
    async ({
      tokenAccounts,
      amountIn,
      amountOut,
    }: {
      tokenAccounts: TokenAccount[]
      amountIn: TokenAmount
      amountOut: CurrencyAmount
    }) => {
      if (!poolKeys || !publicKey) return
      const { transaction, signers } = await Liquidity.makeSwapTransaction({
        connection,
        poolKeys: poolKeys,
        userKeys: {
          tokenAccounts,
          owner: publicKey,
        },
        amountIn,
        amountOut,
        fixedSide: 'in',
      })
      const txid = await sendTransaction(transaction, connection, { signers, skipPreflight: true })
      return txid
    },
    [poolKeys, publicKey, connection, sendTransaction]
  )

  useEffect(() => {
    if (!poolKeys || isNaN(Number(inputAmount))) return
    refreshTag !== 0 && calPairAmount({ amount: inputAmount, reverse: isReverse })
  }, [connection, poolKeys, inputAmount, isReverse, refreshTag, calPairAmount])

  return {
    pairInfo,
    fetchPairInfo,
    calPairAmount,
    swapToken,
  }
}
