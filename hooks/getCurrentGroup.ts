import AsyncStorage from '@react-native-async-storage/async-storage';

export const getCurrentGroup = async () => {
    try {
        const groupId = await AsyncStorage.getItem('currentGroupId');
        return groupId ? parseInt(groupId) : null;
    } catch (error) {
        console.error('Error getting current group:', error);
        return null;
    }
};

export const setCurrentGroup = async (groupId: number | null) => {
    try {
        if (groupId === null) {
            await AsyncStorage.removeItem('currentGroupId');
        } else {
            await AsyncStorage.setItem('currentGroupId', groupId.toString());
        }
    } catch (error) {
        console.error('Error setting current group:', error);
    }
};

export default {
    getCurrentGroup,
    setCurrentGroup,
};