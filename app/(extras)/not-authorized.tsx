import { Text } from '@/components/ui/text'
import React from 'react'
import { View } from 'react-native'
import { Button } from '@/components/ui/button'
import { router } from 'expo-router'

const NotAuthorized = () => {
  return (
    <View className="flex-1 justify-center items-center">
      <Text className="text-center text-2xl font-bold dark:text-white">You are not authorized to access this page!!</Text>
      <Button onPress={() => router.push("/")} className="bg-blue-500">
        <Text>Go Home</Text>
      </Button>
    </View>
  )
}

export default NotAuthorized