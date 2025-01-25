import { View, Text } from 'react-native'
import React from 'react'
import currentUser from '@/hooks/getCurrentUser'

const settings = () => {
  return (
    <View className='flex-1 items-start justify-center px-12'>
      <Text className='text-2xl font-semibold'>Current User Id: {currentUser.id}</Text>
      <Text className='text-2xl font-semibold'>Current User Role: {currentUser.role}</Text> 
    </View>
  )
}

export default settings