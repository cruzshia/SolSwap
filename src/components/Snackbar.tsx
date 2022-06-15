import React, { useEffect } from 'react'
import { useSnackbar, SnackbarMessage, OptionsObject } from 'notistack'
import { Subject } from 'rxjs'

export const snackbarSubject = new Subject<{ message: SnackbarMessage; options?: OptionsObject }>()

export default function Snackbar() {
  const { enqueueSnackbar } = useSnackbar()

  useEffect(() => {
    const sub = snackbarSubject.asObservable().subscribe(({ message, options }) => enqueueSnackbar(message, options))
    return () => sub.unsubscribe()
  }, [enqueueSnackbar])

  return null
}
