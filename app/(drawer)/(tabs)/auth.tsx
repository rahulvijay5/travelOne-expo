import { View, Text, TouchableOpacity } from 'react-native'
import React from 'react'
import { useUser } from '@clerk/clerk-expo';

const auth = () => {
  const user = useUser();

  return (
    <View className="flex-1 items-center justify-center gap-4">
      <Text className="text-base">
        {JSON.stringify(user?.user?.publicMetadata.role, null, 2)}
      </Text>
    </View>
  )
}

export default auth