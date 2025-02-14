import { View, Image } from 'react-native'
import React from 'react'

const GoogleLogo = () => {
  return (
    <View>
        <Image source={require('@/assets/images/google-logo.png')} style={{ width: 20, height: 20 }} />
    </View>
  )
}

export default GoogleLogo