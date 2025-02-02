import { View, Text, Alert } from 'react-native'
import React from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const RenderDialog = (dialogTitle: string, dialogDescription: string, dialogButtonText?: string, handlePress?: () => void) => {
  return (

        <Dialog>
        <DialogContent className='sm:max-w-[425px]'>
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>
              {dialogDescription}
            </DialogDescription>
          </DialogHeader>   
          {dialogButtonText && (
            <DialogFooter>
              <DialogClose asChild>
                <Button onPress={handlePress}>
                <Text>{dialogButtonText}</Text>
              </Button>
            </DialogClose>
          </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

  )
}

export default RenderDialog