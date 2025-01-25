import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import api from '@/lib/api';
import { User } from '@/types';
import currentUser from '@/hooks/getCurrentUser';
export default function UsersScreen() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedRole, setSelectedRole] = useState<User['role']>('CUSTOMER');
  const [message, setMessage] = useState('');

  const roles: User['role'][] = ['OWNER', 'MANAGER', 'CUSTOMER'];

  const handleCreateUser = async () => {
    if (!phoneNumber.trim()) {
      setMessage('Please enter a phone number');
      return;
    }

    try {
      await api.createUser(phoneNumber, selectedRole);
      setMessage(`Successfully created ${selectedRole} user`);
      setPhoneNumber('');
    } catch (error) {
      console.error('Error creating user:', error);
      setMessage('Failed to create user');
    }
  };

  if (currentUser.role !== 'SUPERADMIN') {
    return (
      <View style={styles.container}>
        <Text>Only superadmins can manage users</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.title}>Create New User</Text>
        
        <TextInput
          style={styles.input}
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          placeholder="Phone number"
          keyboardType="phone-pad"
        />

        <View style={styles.roleSelector}>
          {roles.map((role) => (
            <TouchableOpacity
              key={role}
              style={[
                styles.roleButton,
                selectedRole === role && styles.selectedRole,
              ]}
              onPress={() => setSelectedRole(role)}
            >
              <Text
                style={[
                  styles.roleButtonText,
                  selectedRole === role && styles.selectedRoleText,
                ]}
              >
                {role}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreateUser}
        >
          <Text style={styles.createButtonText}>Create User</Text>
        </TouchableOpacity>

        {message ? (
          <Text style={styles.message}>{message}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  form: {
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  roleSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  roleButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
    alignItems: 'center',
  },
  selectedRole: {
    backgroundColor: '#007AFF',
  },
  roleButtonText: {
    color: '#007AFF',
    fontWeight: '500',
  },
  selectedRoleText: {
    color: '#fff',
  },
  createButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  message: {
    textAlign: 'center',
    color: '#666',
  },
}); 