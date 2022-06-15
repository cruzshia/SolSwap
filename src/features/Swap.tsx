import React, { useEffect, useState, useCallback } from 'react'
import { useConnection } from '@solana/wallet-adapter-react'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import InputLabel from '@mui/material/InputLabel'
import Avatar from '@mui/material/Avatar'
import CircularProgress from '@mui/material/CircularProgress'
import SwapVertIcon from '@mui/icons-material/SwapVert'
import IconButton from '@mui/material/IconButton'
import Button from '@mui/material/Button'
import Link from '@mui/material/Link'
import { snackbarSubject } from '../components/Snackbar'
import { useSolBalance, useTokenBalance, useGetPoolInfo, usePairInfo, useTokenInfo } from '../hooks'

const Label = ({ label, balance }: { label: string; balance: number }) => (
  <InputLabel sx={{ display: 'flex', justifyContent: 'space-between' }}>
    {label}
    <Typography>Balance: {balance}</Typography>
  </InputLabel>
)

const InputPrefix = ({ token, icon }: { token: string; icon?: string }) => (
  <InputAdornment position="start">
    <Avatar src={icon}>{token[0]}</Avatar>
    <Typography sx={{ marginLeft: '6px' }}>{token}</Typography>
  </InputAdornment>
)

enum TOKEN {
  Sol = 'SOL',
  Ray = 'RAY',
}

export default function Swap() {
  const { connection } = useConnection()
  const { balance } = useSolBalance()
  const { tokenBalance, tokenAccounts } = useTokenBalance({ tokenMint: process.env.RAY_ADDRESS as string })
  const poolKey = useGetPoolInfo({
    poolKey: process.env.RAY_SOL_POOL_MINT as string,
  })
  const [amount, setAmount] = useState<string>('')
  const [outputAmount, setOutputAmount] = useState<string>('')
  const [reverse, setReverse] = useState<boolean>(false)
  const [pairToken, setPairToken] = useState<{ outToken: TOKEN; inToken: TOKEN }>({
    outToken: TOKEN.Sol,
    inToken: TOKEN.Ray,
  })
  const balances = {
    [TOKEN.Sol]: balance,
    [TOKEN.Ray]: tokenBalance,
  }

  const { tokenInfos } = useTokenInfo()
  const { pairInfo, fetchPairInfo, calPairAmount, swapToken } = usePairInfo({
    poolKeys: poolKey!,
    initialAmount: '1',
    initialReverse: reverse,
  })

  const btnDisabled = !Number(amount) || Number(amount) > balances[pairToken.outToken] || !pairInfo

  const handleClickReverse = useCallback(() => {
    setReverse((v) => !v)
    setPairToken((v) => ({
      outToken: v.inToken,
      inToken: v.outToken,
    }))
  }, [])

  useEffect(() => {
    fetchPairInfo({
      amount: '1',
      reverse: reverse,
    })

    /** auto refresh rate per 10 secs */
    const interval = window.setInterval(() => {
      fetchPairInfo({
        amount: '1',
        reverse: reverse,
      })
    }, 10000)

    return () => clearInterval(interval)
  }, [fetchPairInfo, reverse])

  useEffect(() => {
    if (amount === '' || !pairInfo?.executionPrice) {
      setOutputAmount('')
      return
    }

    const rate = pairInfo?.executionPrice?.toFixed() || '0'
    if (rate) {
      setOutputAmount(String(parseFloat(amount!) * parseFloat(rate)))
    }
  }, [amount, pairInfo?.executionPrice])

  const handleSwapToken = async () => {
    const { amountIn, minAmountOut } =
      (await calPairAmount({
        amount,
        reverse,
      })) || {}

    if (!amountIn || !minAmountOut) return

    const txid = await swapToken({
      tokenAccounts,
      amountIn,
      amountOut: minAmountOut,
    })

    if (txid) {
      setAmount('')
      snackbarSubject.next({
        message: (
          <>
            transaction sent! txid:{' '}
            <Link target="_blank" href={`https://solscan.io/tx/${txid}`}>
              {txid}
            </Link>
          </>
        ),
      })
      connection.onSignature(
        txid,
        (signatureResult) => {
          if (signatureResult.err) {
            snackbarSubject.next({
              message: (
                <>
                  transaction failed! see details
                  <Link sx={{ marginLeft: '4px' }} target="_blank" href={`https://solscan.io/tx/${txid}`}>
                    here
                  </Link>
                </>
              ),
              options: { variant: 'error' },
            })
          } else {
            snackbarSubject.next({
              message: 'transaction success!',
            })
          }
        },
        'processed'
      )
      connection.getSignatureStatus(txid)
    }
  }

  return (
    <Card
      sx={{
        maxWidth: ['100%', '500px'],
        margin: '20px auto',
      }}
    >
      <CardContent sx={{ display: 'flex', flexDirection: 'column' }}>
        <Label label="Input" balance={balances[pairToken.outToken]} />
        <TextField
          id="inputToken"
          type="number"
          onChange={(e) => setAmount(e.currentTarget.value)}
          InputProps={{
            startAdornment: <InputPrefix token={pairToken.outToken} icon={tokenInfos[pairToken.outToken]?.icon} />,
          }}
        />
        <IconButton sx={{ margin: '10px auto' }} onClick={handleClickReverse}>
          <SwapVertIcon />
        </IconButton>
        <Label label="Output" balance={balances[pairToken.inToken]} />
        <TextField
          id="outputToken"
          type="number"
          disabled
          value={outputAmount}
          inputProps={{
            sx: { WebkitTextFillColor: '#FFF !important' },
          }}
          InputProps={{
            startAdornment: <InputPrefix token={pairToken.inToken} icon={tokenInfos[pairToken.inToken]?.icon} />,
            ...(amount && !pairInfo
              ? {
                  endAdornment: <CircularProgress />,
                }
              : {}),
          }}
        />
        <Button
          variant="contained"
          fullWidth
          disabled={btnDisabled}
          sx={{ justifyContent: 'center', marginTop: '20px' }}
          onClick={handleSwapToken}
        >
          Swap
        </Button>
      </CardContent>
    </Card>
  )
}
