import React, { useState } from 'react';
import { View, Pressable, Image, Alert, ActivityIndicator, useColorScheme } from 'react-native';
import { Text } from '@/components/ui/text';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { uploadDocument } from '@/lib/api/documents';
import { useAuth } from '@clerk/clerk-expo';
import { navigateTo } from '@/lib/actions/navigation';
import { Nullable } from '@/types';
import * as FileSystem from 'expo-file-system';

interface DocumentUploaderProps {
  onUploadSuccess: (url: string) => void;
}

const MAX_FILE_SIZE_MB = 5;

const DocumentUploader: React.FC<DocumentUploaderProps> = ({ onUploadSuccess }) => {
  const [document, setDocument] = useState<Nullable<{ uri: string; name: string; type: string }>>(null);
  const [uploading, setUploading] = useState(false);
  const { getToken } = useAuth();
  const colorScheme = useColorScheme();

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      console.log('Document picker result:', result);

      if (result.canceled) {
        return;
      }

      const fileInfo = await FileSystem.getInfoAsync(result.assets[0].uri, { size: true });
      if (!fileInfo.exists) {
        Alert.alert('Error', 'File does not exist');
        return;
      }

      const fileSizeInMB = fileInfo.size ? fileInfo.size / (1024 * 1024) : 0;
      if (fileSizeInMB > MAX_FILE_SIZE_MB) {
        Alert.alert(
          'File Too Large',
          `Please select a file smaller than ${MAX_FILE_SIZE_MB}MB`
        );
        return;
      }

      setDocument({
        uri: result.assets[0].uri,
        name: result.assets[0].name,
        type: result.assets[0].mimeType || 'application/octet-stream'
      });
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const takePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert('Permission Denied', 'Permission to access camera is required!');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.7,
        allowsEditing: true,
      });

      console.log('Camera result:', result);

      if (!result.canceled && result.assets?.[0]?.uri) {
        const fileInfo = await FileSystem.getInfoAsync(result.assets[0].uri, { size: true });
        if (!fileInfo.exists) {
          Alert.alert('Error', 'File does not exist');
          return;
        }

        const fileSizeInMB = fileInfo.size ? fileInfo.size / (1024 * 1024) : 0;
        if (fileSizeInMB > MAX_FILE_SIZE_MB) {
          Alert.alert(
            'File Too Large',
            `Please select a file smaller than ${MAX_FILE_SIZE_MB}MB`
          );
          return;
        }

        setDocument({
          uri: result.assets[0].uri,
          name: 'photo.jpg',
          type: 'image/jpeg'
        });
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const handleUpload = async () => {
    if (!document) {
      Alert.alert('Error', 'Please select a document first');
      return;
    }

    try {
      setUploading(true);
      console.log('Starting document upload for:', document);

      const token = await getToken();
      if (!token) {
        console.error('No authentication token found');
        navigateTo("/not-authenticated");
        return;
      }

      const documentUrl = await uploadDocument(document.uri, "GovernmentDocs", token, document.type);
      console.log('Document upload response:', documentUrl);

      onUploadSuccess(documentUrl);
      Alert.alert('Success', 'Document uploaded successfully!');
      setDocument(null);
    } catch (error) {
      console.error('Upload Error:', error);
      Alert.alert('Error', 'An error occurred while uploading the document. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const isImage = document?.type?.startsWith('image/');

  return (
    <View className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg">
      <Text className="text-lg font-semibold dark:text-white mb-2">Upload Government ID</Text>
      
      {document && isImage && (
        <View className="mb-4">
          <Image 
            source={{ uri: document.uri }} 
            className="w-full h-48 rounded" 
            resizeMode="cover" 
          />
          <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {document.name}
          </Text>
        </View>
      )}

      {document && !isImage && (
        <View className="mb-4 p-4 bg-gray-100 dark:bg-gray-800 rounded">
          <Text className="text-sm text-gray-500 dark:text-gray-400">
            Selected document: {document.name}
          </Text>
        </View>
      )}

      <View className="space-y-3">
        <View className="flex-row justify-between gap-2">
          <Pressable
            onPress={pickDocument}
            disabled={uploading}
            className={`bg-blue-500 p-2 rounded-lg flex-1 ${uploading ? 'opacity-50' : ''}`}
          >
            <Text className="text-white text-center">
              Choose Document
            </Text>
          </Pressable>
          <Pressable
            onPress={takePhoto}
            disabled={uploading}
            className={`bg-green-500 p-2 rounded-lg flex-1 ${uploading ? 'opacity-50' : ''}`}
          >
            <Text className="text-white text-center">
              Take Photo
            </Text>
          </Pressable>
        </View>

        {document && (
          <Pressable
            onPress={handleUpload}
            disabled={uploading}
            className={`dark:bg-white bg-black p-3 mt-2 rounded-lg ${uploading ? 'opacity-50' : ''}`}
          >
            {uploading ? (
              <View className="flex-row justify-center items-center">
                <ActivityIndicator color={colorScheme === 'dark' ? 'black' : 'white'} size="small" />
                <Text className="text-white dark:text-black text-center ml-2">Uploading...</Text>
              </View>
            ) : (
              <Text className="text-white dark:text-black text-center font-semibold">
                Upload Document
              </Text>
            )}
          </Pressable>
        )}
      </View>
    </View>
  );
};

export default DocumentUploader;