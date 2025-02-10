import React, { useCallback } from 'react';
import { View, Image, TouchableOpacity, ScrollView, Platform, Dimensions, Pressable } from 'react-native';
import { Text } from '@/components/ui/text';
import * as ImagePicker from 'expo-image-picker';
import Carousel from 'react-native-reanimated-carousel';
import { Ionicons } from '@expo/vector-icons';

interface ImagePickerProps {
  images: string[];
  onImagesSelected: (images: string[]) => void;
  maxImages?: number;
  title?: string;
}

interface CarouselRenderItem {
  item: string;
  index: number;
}

const CustomImagePicker: React.FC<ImagePickerProps> = ({
  images,
  onImagesSelected,
  maxImages = 5,
  title = "Hotel"
}) => {
  const width = Dimensions.get('window').width;

  const pickImages = useCallback(async () => {
    const remainingSlots = maxImages - images.length;
    if (remainingSlots <= 0) {
      alert(`Maximum ${maxImages} images allowed`);
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: remainingSlots,
      });

      if (!result.canceled) {
        const newImages = result.assets.map(asset => asset.uri);
        onImagesSelected([...images, ...newImages].slice(0, maxImages));
      }
    } catch (error) {
      console.error('Error picking images:', error);
      alert('Failed to pick images');
    }
  }, [images, maxImages, onImagesSelected]);

  const removeImage = useCallback((index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesSelected(newImages);
  }, [images, onImagesSelected]);

  const renderCarouselItem = useCallback(({ item, index }: CarouselRenderItem) => (
    <View className="relative">
      <Image
        source={{ uri: item }}
        className="w-3/4 h-full rounded-lg p-2"
        resizeMode="cover"
      />
      <TouchableOpacity
        onPress={() => removeImage(index)}
        className="absolute top-2 right-0 bg-black/50 rounded-full p-2"
      >
        <Ionicons name="close" size={20} color="white" />
      </TouchableOpacity>
    </View>
  ), [removeImage]);

  if (images.length === 0) {
    return (
      <Pressable
        onPress={pickImages}
        className="flex-row items-center justify-center h-20 p-4 border-2 border-dashed border-gray-300 rounded-lg my-4 mx-4"
      >
        <Ionicons name="images-outline" size={24} color="white" />
        <Text className="dark:text-white text-black ml-2">Add {title} Images (Max {maxImages})</Text>
      </Pressable>
    );
  }

  return (
    <View className="mb-6">
      <View className="h-64 mb-4">
        <Carousel<string>
          loop
          width={width}
          height={240}
          data={images}
          scrollAnimationDuration={1000}
          renderItem={renderCarouselItem}
        />
        <View className="flex-row items-center justify-center gap-2 mt-2">
          <Ionicons name="swap-horizontal" size={14} color="gray" />
          <Text className="text-center text-gray-500 text-sm">Swipe to view more images</Text>
        </View>
      </View>

      <View className="flex-row items-center justify-center">
        {images.length < maxImages && (
          <Pressable
            onPress={pickImages}
            className="flex-row items-center justify-center bg-black rounded-lg p-2 px-4"
          >
            <Ionicons name="add" size={24} color="white" />
            <Text className="text-white ml-2">
              Add More Images ({images.length}/{maxImages})
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
};

export default CustomImagePicker; 