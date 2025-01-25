import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import api from '@/lib/api';
import currentUser from '@/hooks/getCurrentUser';

interface JoinGroupProps {
  onJoined: () => void;
}

export default function JoinGroup({ onJoined }: JoinGroupProps) {
  const [groupId, setGroupId] = useState(0);
  const [message, setMessage] = useState('');

  const handleJoinGroup = async () => {
    console.log(groupId);
    console.log(currentUser.id);
    if (groupId === 0) {
      setMessage('Please enter a group ID');
      return;
    }

    try {
      const response = await api.addMember(groupId, currentUser.id);
      if (response.ok) {
        setMessage('Successfully joined group');
        setGroupId(0);
        onJoined();
      } else {
        setMessage('Failed to join group, response is not ok');
      }
    } catch (error) {
      console.error('Error joining group:', error);
      setMessage('Failed to join group');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Join a Group</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={groupId.toString()}
          onChangeText={(text) => setGroupId(parseInt(text))}
          placeholder="Enter group ID"
          keyboardType="number-pad"
        />
        <TouchableOpacity
          style={styles.button}
          onPress={handleJoinGroup}
        >
          <Text style={styles.buttonText}>Join</Text>
        </TouchableOpacity>
      </View>
      {message ? (
        <Text style={styles.message}>{message}</Text>
      ) : null}
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
    marginTop: 8,
    color: '#666',
  },
}); 