import React, { useState, useEffect } from 'react';
import { SafeAreaView, ScrollView, View, StyleSheet, Modal, Dimensions } from 'react-native';
import { Text, Button, Input, Icon } from 'react-native-elements';
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
  const [history, setHistory] = useState<{ players: Player[]; rounds: Round[] }[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const screenHeight = Dimensions.get('window').height;

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

  const addRound = () => {
    const newRoundId = (rounds.length + 1).toString();
    const newRounds = [...rounds, { id: newRoundId, scores: {} }];
    updateHistory(players, newRounds);
    setRounds(newRounds);
  };

  const updateScore = (playerId: string, roundId: string, score: string) => {
    const updatedRounds = rounds.map((round) => {
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
      const newPlayers = players.map((player) =>
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

  const resetGame = () => {
    const initialPlayers = [{ id: '1', name: 'Player 1' }];
    const initialRounds = [{ id: '1', scores: {} }];
    setPlayers(initialPlayers);
    setRounds(initialRounds);
    updateHistory(initialPlayers, initialRounds);
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.container}>
        <ScrollView>
          <ScrollView horizontal style={{
              minHeight: screenHeight - 110,
            }}>
            <View>
              <View style={styles.headerContainer}>
                <Text style={styles.headerText}>Player</Text>
                {rounds.map((round) => (
                  <Text key={round.id} style={styles.headerText}>
                    Round {round.id}
                  </Text>
                ))}
              </View>
              {players.map((player) => (
                <View key={player.id} style={styles.scoreRow}>
                  <Button
                    title={player.name}
                    onPress={() => openRenameModal(player.id)}
                    buttonStyle={styles.playerName}
                  />
                  {rounds.map((round) => (
                    <Input
                      key={round.id}
                      keyboardType="number-pad"
                      value={round.scores[player.id] || ''}
                      onChangeText={(score) => updateScore(player.id, round.id, score)}
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
      <View style={styles.footer}>
        <Button
          onPress={addPlayer}
          icon={<Icon name="user-plus" type="font-awesome" color="#fff" />}
          buttonStyle={styles.footerButton}
          type="clear"
        />
        <Button
          onPress={addRound}
          icon={<Icon name="plus-square" type="font-awesome" color="#fff" />}
          buttonStyle={styles.footerButton}
          type="clear"
        />
        <Button
          onPress={undo}
          disabled={historyIndex <= 0}
          icon={<Icon name="undo" type="font-awesome" color="#fff" />}
          buttonStyle={styles.footerButton}
          type="clear"
        />
        <Button
          onPress={redo}
          disabled={historyIndex >= history.length - 1}
          icon={<Icon name="undo" type="font-awesome" color="#fff" />}
          buttonStyle={{
            ...styles.footerButton,
            // Flip
            transform: [{ rotateY: '180deg' }],
          }}
          type="clear"
        />
        <Button
          onPress={resetGame}
          icon={<Icon name="refresh" type="font-awesome" color="#fff" />}
          buttonStyle={styles.footerButton}
          type="clear"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    backgroundColor: '#2089dc',
    borderRadius: 5,
  },
  inputContainer: {
    flex: 1,
    marginHorizontal: 4,
    minWidth: 100,
  },
  input: {
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    backgroundColor: '#2089dc',
    justifyContent: 'space-around',
    paddingVertical: 10,
  },
  footerButton: {
    backgroundColor: 'transparent',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
  },
  modalInputContainer: {
    width: '100%',
    minWidth: 200,
    marginBottom: 20,
  },
  modalInput: {
    textAlign: 'center',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    backgroundColor: '#2089dc',
    marginHorizontal: 10,
  },
  modalCancelButton: {
    backgroundColor: '#e74c3c',
    marginHorizontal: 10,
  },
});