import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import api from '@/lib/api';
import { Group, User, Todo } from '@/types';
import currentUser from '@/hooks/getCurrentUser';

export default function TodosScreen() {
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGroups();
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      loadTodos(selectedGroup.id);
    }
  }, [selectedGroup]);

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

  const loadTodos = async (groupId: number) => {
    try {
      const todosData = await api.getGroupTodos(groupId);
      setTodos(todosData);
    } catch (error) {
      console.error('Error loading todos:', error);
    }
  };

  const handleCreateTodo = async () => {
    if (!selectedGroup || !newTodoTitle.trim()) return;
    try {
      await api.createTodo(selectedGroup.id, newTodoTitle,currentUser.id);
      setNewTodoTitle('');
      loadTodos(selectedGroup.id);
    } catch (error) {
      console.error('Error creating todo:', error);
    }
  };

  const handleToggleTodo = async (todo: Todo) => {
    try {
      await api.updateTodo(todo.id, { status: !todo.status });
      loadTodos(todo.groupId);
    } catch (error) {
      console.error('Error updating todo:', error);
    }
  };

  const handleDeleteTodo = async (todoId: number) => {
    try {
      await api.deleteTodo(todoId);
      if (selectedGroup) {
        loadTodos(selectedGroup.id);
      }
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  };

  const renderGroup = ({ item }: { item: Group }) => (
    <TouchableOpacity
      style={[
        styles.groupItem,
        selectedGroup?.id === item.id && styles.selectedGroup,
      ]}
      onPress={() => setSelectedGroup(item)}
    >
      <Text style={styles.groupName}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderTodo = ({ item }: { item: Todo }) => (
    <View style={styles.todoItem}>
      <TouchableOpacity
        style={styles.todoCheckbox}
        onPress={() => handleToggleTodo(item)}
      >
        <View style={[styles.checkbox, item.status && styles.checked]} />
      </TouchableOpacity>
      <View style={styles.todoInfo}>
        <Text style={[styles.todoTitle, item.status && styles.completedTodo]}>
          {item.title}
        </Text>
        <Text style={styles.todoCreator}>
          Created by: {item.creator.phoneNumber}
        </Text>
      </View>
      {currentUser.role === ('MANAGER'||'OWNER') && (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteTodo(item.id)}
        >
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      )}
    </View>
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
      <View style={styles.groupsList}>
        <FlatList
          horizontal
          data={groups}
          renderItem={renderGroup}
          keyExtractor={(item) => item.id.toString()}
          showsHorizontalScrollIndicator={false}
        />
      </View>

      {selectedGroup && (
        <View style={styles.todosContainer}>
          <View style={styles.createTodo}>
            <TextInput
              style={styles.input}
              value={newTodoTitle}
              onChangeText={setNewTodoTitle}
              placeholder="New todo title"
            />
            <TouchableOpacity
              style={styles.createButton}
              onPress={handleCreateTodo}
            >
              <Text style={styles.createButtonText}>Add Todo</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={todos}
            renderItem={renderTodo}
            keyExtractor={(item) => item.id.toString()}
            style={styles.list}
          />
        </View>
      )}

      {!selectedGroup && (
        <View style={styles.noSelection}>
          <Text>Select a group to view todos</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  groupsList: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  groupItem: {
    padding: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    marginRight: 8,
  },
  selectedGroup: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  groupName: {
    fontWeight: '500',
  },
  todosContainer: {
    flex: 1,
    padding: 16,
  },
  createTodo: {
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
  todoItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  todoCheckbox: {
    marginRight: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 12,
  },
  checked: {
    backgroundColor: '#007AFF',
  },
  todoInfo: {
    flex: 1,
  },
  todoTitle: {
    fontSize: 16,
    marginBottom: 4,
  },
  completedTodo: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  todoCreator: {
    fontSize: 12,
    color: '#666',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    padding: 8,
    borderRadius: 6,
  },
  deleteButtonText: {
    color: '#fff',
  },
  noSelection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 