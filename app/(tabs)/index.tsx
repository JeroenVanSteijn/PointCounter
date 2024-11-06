import React, { useState, useEffect } from 'react';
import { SafeAreaView, ScrollView, View, StyleSheet } from 'react-native';
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
    setPlayers([...players, { id: newPlayerId, name: `Player ${newPlayerId}` }]);
  };

  const removePlayer = (playerId: string) => {
    setPlayers(players.filter(player => player.id !== playerId));
  };

  const addRound = () => {
    const newRoundId = (rounds.length + 1).toString();
    setRounds([...rounds, { id: newRoundId, scores: {} }]);
  };

  const removeRound = () => {
    if (rounds.length > 1) {
      setRounds(rounds.slice(0, -1));
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
    setRounds(updatedRounds);
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
        </View>
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
            <Text style={styles.playerName}>{player.name}</Text>
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
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  playerName: {
    flex: 1,
    textAlign: 'center',
  },
  inputContainer: {
    flex: 1,
    marginHorizontal: 4,
  },
  input: {
    textAlign: 'center',
  },
});