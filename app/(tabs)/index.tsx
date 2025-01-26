import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Group } from '@/types';
import currentUser from '@/hooks/getCurrentUser';
import JoinGroup from '@/components/JoinGroup';
import GroupManagement from '@/components/GroupManagement';
import api from '@/lib/api';
import { getCurrentGroup, setCurrentGroup } from '@/hooks/getCurrentGroup';
import { router } from 'expo-router';

export default function GroupsScreen() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  useEffect(() => {
    loadGroups();
    // Load currently selected group on mount
    getCurrentGroup().then((groupId) => {
      if (groupId) {
        const group = groups.find(g => g.id === groupId);
        if (group) {
          setSelectedGroup(group);
        }
      }
    });
  }, []);

  const loadGroups = async () => {
    try {

      let groupsData: Group[] = [];

      if (currentUser.role === 'SUPERADMIN') {
        groupsData = await api.getAllGroups();
      } else if (currentUser.role === 'OWNER') {
        groupsData = await api.getOwnerGroups(currentUser.id);
      } else if (currentUser.role === 'MANAGER') {
        groupsData = await api.getManagerGroups(currentUser.id);
      } else if (currentUser.role === 'CUSTOMER') {
        groupsData = await api.getUserGroups(currentUser.id);
      }
      setGroups(groupsData);
      
    } catch (error) {
      console.error('Error loading groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    try {
      await api.createGroup(newGroupName, currentUser.id);
      setNewGroupName('');
      loadGroups();
    } catch (error) {
      console.error('Error creating group:', error);
    }
  };

  const handleDeleteGroup = async (groupId: number) => {
    try {
      await api.deleteGroup(groupId);
      loadGroups();
      if (selectedGroup?.id === groupId) {
        setSelectedGroup(null);
      }
    } catch (error) {
      console.error('Error deleting group:', error);
    }
  };

  const renderGroup = ({ item }: { item: Group }) => (
    <TouchableOpacity
      style={[
        styles.groupItem,
        selectedGroup?.id === item.id && styles.selectedGroupItem,
      ]}
      onPress={async () => {
        const newSelectedGroup = selectedGroup?.id === item.id ? null : item;
        setSelectedGroup(newSelectedGroup);
        await setCurrentGroup(newSelectedGroup?.id ?? null);
        
        // Force refresh todos page by navigating to it
        router.push('/todos');
      }}
    >
      <View style={styles.groupInfo}>
        <Text style={styles.groupName}>{item.name}</Text>
        <Text style={styles.groupId}>ID: {item.id}</Text>
        {/* {currentUser.role === 'SUPERADMIN' && (
          <Text style={styles.groupDetails}>
            Owner: {item.owner?.phoneNumber || 'No owner'}
          </Text>
        )} */}
        {currentUser.role === ('OWNER' || 'SUPERADMIN') && (
          <Text style={styles.groupDetails}>
            Members: {item.members?.length || 0} | Managers: {item.managers?.length || 0  }
          </Text>
        )}
      </View>
      {currentUser.role === 'SUPERADMIN' && (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteGroup(item.id)}
        >
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {currentUser.role === 'CUSTOMER' && (
        <JoinGroup onJoined={loadGroups} />
      )}

      {(currentUser.role === 'SUPERADMIN' || currentUser.role === 'OWNER') && (
        <View style={styles.createGroup}>
          <TextInput
            style={styles.input}
            value={newGroupName}
            onChangeText={setNewGroupName}
            placeholder="New group name"
            placeholderTextColor="#666"
          />
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateGroup}
          >
            <Text style={styles.createButtonText}>Create Group</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={groups}
        renderItem={renderGroup}
        keyExtractor={(item) => item.id.toString()}
        style={styles.list}
      />

      {selectedGroup && (currentUser.role === 'SUPERADMIN' || selectedGroup.ownerId === currentUser.id) && (
        <GroupManagement
          group={selectedGroup}
          onUpdate={loadGroups}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  createGroup: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 8,
    marginRight: 8,
  },
  createButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 8,
    justifyContent: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  list: {
    flex: 1,
  },
  groupItem: {
    flexDirection: 'row',
    padding: 16,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  selectedGroupItem: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  groupId: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  groupDetails: {
    fontSize: 14,
    color: '#666',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    padding: 8,
    borderRadius: 6,
    alignSelf: 'center',
    marginLeft: 8,
  },
  deleteButtonText: {
    color: '#fff',
  },
});
