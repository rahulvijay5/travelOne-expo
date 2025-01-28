import { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import api from '@/lib/api';
import { Group, User, Todo } from '@/types';
import currentUser from '@/hooks/getCurrentUser';
import { getCurrentGroup } from '@/hooks/getCurrentGroup';

export default function TodosScreen() {
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [loading, setLoading] = useState(true);

  const loadTodos = useCallback(async (groupId: number) => {
    try {
      setLoading(true);
      const todosData = await api.getGroupTodos(groupId);
      setTodos(todosData);
    } catch (error) {
      console.error('Error loading todos:', error);
      setTodos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load current group and todos on mount and when focused
  useEffect(() => {
    const loadCurrentGroup = async () => {
      const groupId = await getCurrentGroup();
      setSelectedGroupId(groupId);
      if (groupId) {
        loadTodos(groupId);
      } else {
        setLoading(false);
      }
    };

    loadCurrentGroup();
  }, [loadTodos]);

  const handleCreateTodo = async () => {
    if (!selectedGroupId || !newTodoTitle.trim()) return;
    try {
      await api.createTodo(selectedGroupId, newTodoTitle, currentUser.id);
      setNewTodoTitle('');
      loadTodos(selectedGroupId);
    } catch (error) {
      console.error('Error creating todo:', error);
    }
  };

  const handleToggleTodo = async (todo: Todo) => {
    try {
      await api.updateTodo(todo.id, { status: !todo.status });
      if (selectedGroupId) {
        loadTodos(selectedGroupId);
      }
    } catch (error) {
      console.error('Error updating todo:', error);
    }
  };

  const handleDeleteTodo = async (todoId: number) => {
    try {
      await api.deleteTodo(todoId);
      if (selectedGroupId) {
        loadTodos(selectedGroupId);
      }
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  };

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
      {currentUser.role == 'MANAGER' || currentUser.role == 'OWNER' && (
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
      {selectedGroupId && (
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

      {!selectedGroupId && (
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