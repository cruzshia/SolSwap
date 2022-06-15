import React, { FC, ReactNode } from 'react'
import Box from '@mui/material/Box'
import Header from './Header'
import Sanckbar from './Snackbar'

interface Props {
  children?: ReactNode
}

const Layout: FC<Props> = function (props) {
  return (
    <Box>
      <Header />
      {props.children}
      <Sanckbar />
    </Box>
  )
}

export default Layout
