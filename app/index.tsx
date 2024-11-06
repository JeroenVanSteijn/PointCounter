import React, { useState, useEffect } from 'react';
import { SafeAreaView, ScrollView, View, StyleSheet, Modal } from 'react-native';
import { Text, Button, Input } from 'react-native-elements';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Player {
  id: string;
  name: string;
}

interface Round {
  id: string;
  scores: { [key: string]: string };
}

export default function App() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [renamingPlayerId, setRenamingPlayerId] = useState<string | null>(null);
  const [newPlayerName, setNewPlayerName] = useState<string>('');
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [history, setHistory] = useState<{ players: Player[], rounds: Round[] }[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  useEffect(() => {
    loadGame();
  }, []);

  useEffect(() => {
    saveGame();
  }, [players, rounds]);

  const loadGame = async () => {
    try {
      const savedPlayers = await AsyncStorage.getItem('players');
      const savedRounds = await AsyncStorage.getItem('rounds');
      if (savedPlayers && savedRounds) {
        setPlayers(JSON.parse(savedPlayers));
        setRounds(JSON.parse(savedRounds));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const saveGame = async () => {
    try {
      await AsyncStorage.setItem('players', JSON.stringify(players));
      await AsyncStorage.setItem('rounds', JSON.stringify(rounds));
    } catch (error) {
      console.error(error);
    }
  };

  const addPlayer = () => {
    const newPlayerId = (players.length + 1).toString();
    const newPlayers = [...players, { id: newPlayerId, name: `Player ${newPlayerId}` }];
    updateHistory(newPlayers, rounds);
    setPlayers(newPlayers);
  };

  const removePlayer = (playerId: string) => {
    const newPlayers = players.filter(player => player.id !== playerId);
    updateHistory(newPlayers, rounds);
    setPlayers(newPlayers);
  };

  const addRound = () => {
    const newRoundId = (rounds.length + 1).toString();
    const newRounds = [...rounds, { id: newRoundId, scores: {} }];
    updateHistory(players, newRounds);
    setRounds(newRounds);
  };

  const removeRound = () => {
    if (rounds.length > 1) {
      const newRounds = rounds.slice(0, -1);
      updateHistory(players, newRounds);
      setRounds(newRounds);
    }
  };

  const updateScore = (playerId: string, roundId: string, score: string) => {
    const updatedRounds = rounds.map(round => {
      if (round.id === roundId) {
        return {
          ...round,
          scores: { ...round.scores, [playerId]: score },
        };
      }
      return round;
    });
    updateHistory(players, updatedRounds);
    setRounds(updatedRounds);
  };

  const renamePlayer = () => {
    if (renamingPlayerId && newPlayerName) {
      const newPlayers = players.map(player => 
        player.id === renamingPlayerId ? { ...player, name: newPlayerName } : player
      );
      updateHistory(newPlayers, rounds);
      setPlayers(newPlayers);
      setRenamingPlayerId(null);
      setNewPlayerName('');
      setIsModalVisible(false);
    }
  };

  const openRenameModal = (playerId: string) => {
    setRenamingPlayerId(playerId);
    setIsModalVisible(true);
  };

  const updateHistory = (newPlayers: Player[], newRounds: Round[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ players: newPlayers, rounds: newRounds });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const previousState = history[historyIndex - 1];
      setPlayers(previousState.players);
      setRounds(previousState.rounds);
      setHistoryIndex(historyIndex - 1);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setPlayers(nextState.players);
      setRounds(nextState.rounds);
      setHistoryIndex(historyIndex + 1);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.buttonContainer}>
          <Button
            title="Add Player"
            onPress={addPlayer}
            buttonStyle={styles.button}
          />
          <Button
            title="Add Round"
            onPress={addRound}
            buttonStyle={styles.button}
          />
          <Button
            title="Remove Player"
            onPress={() => removePlayer(players[players.length - 1]?.id)}
            disabled={players.length <= 1}
            buttonStyle={styles.button}
          />
          <Button
            title="Remove Round"
            onPress={removeRound}
            disabled={rounds.length <= 1}
            buttonStyle={styles.button}
          />
          <Button
            title="Undo"
            onPress={undo}
            disabled={historyIndex <= 0}
            buttonStyle={styles.button}
          />
          <Button
            title="Redo"
            onPress={redo}
            disabled={historyIndex >= history.length - 1}
            buttonStyle={styles.button}
          />
        </View>
        <ScrollView horizontal>
          <View>
            <View style={styles.headerContainer}>
              <Text style={styles.headerText}>Player</Text>
              {rounds.map(round => (
                <Text key={round.id} style={styles.headerText}>
                  Round {round.id}
                </Text>
              ))}
            </View>
            {players.map(player => (
              <View key={player.id} style={styles.scoreRow}>
                <Button
                  title={player.name}
                  onPress={() => openRenameModal(player.id)}
                  buttonStyle={styles.playerName}
                />
                {rounds.map(round => (
                  <Input
                    key={round.id}
                    keyboardType="number-pad"
                    value={round.scores[player.id] || ''}
                    onChangeText={score => updateScore(player.id, round.id, score)}
                    containerStyle={styles.inputContainer}
                    inputStyle={styles.input}
                  />
                ))}
              </View>
            ))}
          </View>
        </ScrollView>
        <Modal
          visible={isModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setIsModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Input
                placeholder="Player Name"
                value={newPlayerName}
                onChangeText={setNewPlayerName}
                containerStyle={styles.modalInputContainer}
                inputStyle={styles.modalInput}
              />
              <View style={styles.modalButtonContainer}>
                <Button
                  title="Cancel"
                  onPress={() => setIsModalVisible(false)}
                  buttonStyle={styles.modalCancelButton}
                />
                <Button
                  title="Save"
                  onPress={renamePlayer}
                  buttonStyle={styles.modalButton}
                />
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  buttonContainer: {
    marginBottom: 16,
  },
  button: {
    marginVertical: 8,
    backgroundColor: '#2089dc',
  },
  cancelButton: {
    marginVertical: 8,
    backgroundColor: '#e74c3c',
  },
  headerContainer: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },
  headerText: {
    flex: 1,
    fontWeight: 'bold',
    textAlign: 'center',
    minWidth: 100,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  playerName: {
    flex: 1,
    textAlign: 'center',
    minWidth: 100,
  },
  inputContainer: {
    flex: 1,
    marginHorizontal: 4,
    minWidth: 100,
  },
  input: {
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
  },
  modalInputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  modalInput: {
    textAlign: 'center',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    marginHorizontal: 5,
    backgroundColor: '#2089dc',
  },
  modalCancelButton: {
    marginHorizontal: 5,
    backgroundColor: '#e74c3c',
  },
});
