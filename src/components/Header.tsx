import React, { FC } from 'react'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Toolbar from '@mui/material/Toolbar'
import { WalletMultiButton } from '@solana/wallet-adapter-material-ui'
import useSolBalance from '../hooks/useSolBalance'
import useTokenInfo from '../hooks/useTokenInfo'

const ButtonAppBar: FC = function () {
  const { balance } = useSolBalance()
  useTokenInfo()

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Box />
          <Box sx={{ flexGrow: 1, textAlign: 'right', paddingRight: '10px' }}>{balance} SOL</Box>
          <WalletMultiButton />
        </Toolbar>
      </AppBar>
    </Box>
  )
}

export default ButtonAppBar
