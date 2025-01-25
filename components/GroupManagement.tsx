import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import api from '@/lib/api';
import { Group, User } from '@/types';
import currentUser from '@/hooks/getCurrentUser';

interface GroupManagementProps {
  group: Group;
  onUpdate: () => void;
}

export default function GroupManagement({ group, onUpdate }: GroupManagementProps) {
  const [managerId, setManagerId] = useState(0);
  const [message, setMessage] = useState('');

  const handleAddManager = async () => {
    if (!managerId) {
      setMessage('Please enter a manager id');
      return;
    }

    try {
      const response = await api.addManager(group.id, managerId);
      if (response.success) {
        setMessage('Manager added successfully');
        setManagerId(0);
        onUpdate();
      } else {
        setMessage(response.message || 'Failed to add manager');
      }
    } catch (error) {
      console.error('Error adding manager:', error);
      setMessage('Failed to add manager');
    }
  };

    const handleRemoveManager = async (managerId: number) => {
    try {
      await api.removeManager(group.id, managerId);
      onUpdate();
    } catch (error) {
      console.error('Error removing manager:', error);
    }
  };

  const canManageGroup = currentUser.role === 'SUPERADMIN' || group.ownerId === currentUser.id;

  if (!canManageGroup) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Manage Group</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Add Manager</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={managerId.toString()}
            onChangeText={(text) => setManagerId(parseInt(text))}
            placeholder="Manager's phone number"
            keyboardType="numeric"
          />
          <TouchableOpacity
            style={styles.button}
            onPress={handleAddManager}
          >
            <Text style={styles.buttonText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      {message ? (
        <Text style={styles.message}>{message}</Text>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Current Managers</Text>
        {group.managers.map((manager) => (
          <View key={manager.id} style={styles.managerItem}>
            <Text>{manager.phoneNumber}</Text>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => handleRemoveManager(manager.id)}
            >
              <Text style={styles.removeButtonText}>Remove</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    marginVertical: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 8,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 8,
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  message: {
    marginVertical: 8,
    color: '#666',
  },
  managerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginVertical: 4,
  },
  removeButton: {
    backgroundColor: '#FF3B30',
    padding: 6,
    borderRadius: 6,
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 12,
  },
}); 