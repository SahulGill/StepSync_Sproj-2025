// import React, { useState, useEffect, useRef } from 'react';
// import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Alert } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import Animated, {
//   useSharedValue,
//   useAnimatedStyle,
//   withTiming,
// } from 'react-native-reanimated';
// import { getAuth } from 'firebase/auth';
// import { getDatabase, ref, onValue, off, update } from 'firebase/database';

// const { width } = Dimensions.get('window');

// const PuzzleMode = ({navigation, route}) => {
//   const [gameMode, setGameMode] = useState('');
//   const [difficulty, setDifficulty] = useState('');
//   const [gameStatus, setGameStatus] = useState('pending');
//   const [sessionId, setSessionId] = useState(null);
//   const [timeRemaining, setTimeRemaining] = useState(600);
//   const [totalTime, setTotalTime] = useState(600);
//   const [heartRate, setHeartRate] = useState(88);
//   const [calories, setCalories] = useState(0);
//   const [lives, setLives] = useState(3);

//   const buttonScale = useSharedValue(1);
//   const timeBar = useSharedValue(1.0);
//   const timerRef = useRef(null);


//   const [isConnected, setIsConnected] = useState(false);
//   const wsRef = useRef(null);

//   // ESP32 IP address (replace with your ESP32's IP)
//   const ESP32_IP = 'SAMPLE'; // Change this to your ESP32's IP

//   useEffect(() => {
//     connectToESP32();

//     return () => {
//       if (wsRef.current) {
//         wsRef.current.close();
//       }
//     };
//   }, []);

//   const connectToESP32 = () => {
//     try {
//       wsRef.current = new WebSocket(`ws://${ESP32_IP}:81`);

//       wsRef.current.onopen = () => {
//         console.log('Connected to ESP32');
//         setIsConnected(true);
//       };

//       wsRef.current.onmessage = (event) => {
//         try {
//           const data = JSON.parse(event.data);
//           if (data.type === 'heartRate') {
//             setHeartRate(data.bpm);
//             console.log('Received BPM:', data.bpm);
//           }
//         } catch (error) {
//           console.error('Error parsing WebSocket message:', error);
//         }
//       };

//       wsRef.current.onclose = () => {
//         console.log('Disconnected from ESP32');
//         setIsConnected(false);
//         // Attempt to reconnect after 3 seconds
//         setTimeout(connectToESP32, 3000);
//       };

//       wsRef.current.onerror = (error) => {
//         console.error('WebSocket error:', error);
//         setIsConnected(false);
//       };
//     } catch (error) {
//       console.error('Failed to connect to ESP32:', error);
//     }
//   };

//   const animatedButtonStyle = useAnimatedStyle(() => ({
//     transform: [{ scale: buttonScale.value }],
//     backgroundColor: buttonScale.value === 1 ? '#2D1B3D' : '#00FF00',
//   }));

//   const timeBarStyle = useAnimatedStyle(() => ({
//     width: `${timeBar.value * 100}%`,
//   }));

//   // Game mode display names
//   const gameModeNames = {
//     'btc': 'Beat The Clock',
//     'memory': 'Memory Game',
//     'mirror': 'Mirror Game'
//   };

//   // Time limits based on game mode and difficulty (in seconds)
//   const getTimeLimit = (mode, diff) => {
//     const timeLimits = {
//       'btc': {
//         'easy': 900,   // 15 minutes
//         'medium': 600, // 10 minutes
//         'hard': 300    // 5 minutes
//       },
//       'memory': {
//         'easy': 1200,  // 20 minutes
//         'medium': 900, // 15 minutes
//         'hard': 600    // 10 minutes
//       },
//       'mirror': {
//         'easy': 1800,  // 30 minutes
//         'medium': 1200, // 20 minutes
//         'hard': 900     // 15 minutes
//       }
//     };
//     return timeLimits[mode]?.[diff] || 600;
//   };

//   // Calorie burn rate per minute based on game mode and difficulty
//   const getCalorieRate = (mode, diff) => {
//     const calorieRates = {
//       'btc': {
//         'easy': 4,   // Fast-paced clicking
//         'medium': 7,
//         'hard': 12
//       },
//       'memory': {
//         'easy': 3,   // Mental activity (lighter)
//         'medium': 5,
//         'hard': 8
//       },
//       'mirror': {
//         'easy': 6,   // Physical movement (highest)
//         'medium': 10,
//         'hard': 15
//       }
//     };
//     return calorieRates[mode]?.[diff] || 5;
//   };

//   // Calculate calories based on time elapsed, game mode, and difficulty
//   const calculateCalories = (timeElapsed, mode, difficulty) => {
//     const minutesElapsed = timeElapsed / 60;
//     const calorieRate = getCalorieRate(mode, difficulty);
//     return Math.floor(minutesElapsed * calorieRate);
//   };

//   useEffect(() => {
//     const auth = getAuth();
//     const user = auth.currentUser;

//     if (user) {
//       const db = getDatabase();
//       const pendingSessionsRef = ref(db, 'pendingSessions');

//       const unsubscribe = onValue(pendingSessionsRef, (snapshot) => {
//         if (snapshot.exists()) {
//           const sessions = snapshot.val();
//           console.log('All pending sessions:', sessions);

//           // Find the user's most recent session that's not completed
//           const userSession = Object.entries(sessions).find(([id, session]) => {
//             console.log(`Checking session ${id}:`, session);
//             return session.userId === user.uid && 
//                    (session.status === 'pending' || session.status === 'in_progress');
//           });

//           if (userSession) {
//             const [id, session] = userSession;
//             console.log('Found user session:', { id, session });

//             setSessionId(id);
//             setGameMode(session.gameMode);
//             setDifficulty(session.difficulty);
//             setGameStatus(session.status);

//             console.log('Current game status:', session.status);

//             const timeLimit = getTimeLimit(session.gameMode, session.difficulty);
//             setTotalTime(timeLimit);

//             // Reset everything when session is pending
//             if (session.status === 'pending') {
//               console.log('Session is pending - waiting for PC');
//               setTimeRemaining(timeLimit);
//               setCalories(0);
//               timeBar.value = 1.0;
//             }
//             // Start timer when session becomes in_progress
//             else if (session.status === 'in_progress') {
//               console.log('Session is in progress - game should start');
//               if (timeRemaining === timeLimit) {
//                 // First time starting, reset everything
//                 setTimeRemaining(timeLimit);
//                 setCalories(0);
//                 timeBar.value = 1.0;
//               }
//             }
//           } else {
//             console.log('No active session found for user:', user.uid);
//             // No session found, go back
//             Alert.alert('No Active Session', 'No game session found. Please start a new game.', [
//               { text: 'OK', onPress: () => navigation.goBack() }
//             ]);
//           }
//         } else {
//           console.log('No pending sessions found');
//         }
//       });

//       return () => {
//         off(pendingSessionsRef);
//       };
//     }
//   }, []);

//   // Start game timer ONLY when status changes to 'in_progress'
//   useEffect(() => {
//     console.log('Game status effect triggered. Status:', gameStatus);

//     if (gameStatus === 'in_progress' && !timerRef.current) {
//       console.log('Status is in_progress and no timer running - STARTING TIMER');
//       startGameTimer();
//     } else if (gameStatus === 'pending' && timerRef.current) {
//       console.log('Status is pending and timer running - STOPPING TIMER');
//       clearInterval(timerRef.current);
//       timerRef.current = null;
//     } else if (gameStatus !== 'in_progress' && timerRef.current) {
//       console.log('Status is not in_progress - STOPPING TIMER');
//       clearInterval(timerRef.current);
//       timerRef.current = null;
//     }

//     return () => {
//       if (timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//     };
//   }, [gameStatus]); // Only depend on gameStatus

//   const startGameTimer = () => {
//     timerRef.current = setInterval(() => {
//       setTimeRemaining((prevTime) => {
//         const newTime = prevTime - 1;

//         // Update time bar animation
//         timeBar.value = withTiming(newTime / totalTime, { duration: 1000 });

//         // Update calories based on time elapsed (local calculation)
//         const timeElapsed = totalTime - newTime;
//         const currentCalories = calculateCalories(timeElapsed, gameMode, difficulty);
//         setCalories(currentCalories);

//         // Game over when time runs out
//         if (newTime <= 0) {
//           gameOver('time_up');
//           return 0;
//         }

//         return newTime;
//       });
//     }, 1000);
//   };

//   const gameOver = async (reason) => {
//     if (timerRef.current) {
//       clearInterval(timerRef.current);
//       timerRef.current = null;
//     }

//     // Calculate final score based on time, game mode, and difficulty
//     const timeUsed = totalTime - timeRemaining;

//     // Different point systems for different game modes
//     const getPointsPerSecond = (mode) => {
//       switch(mode) {
//         case 'btc': return 10;     // Beat the Clock: fast-paced
//         case 'memory': return 8;   // Memory Game: moderate points
//         case 'mirror': return 12;  // Mirror Game: highest points (physical)
//         default: return 10;
//       }
//     };

//     const baseScore = Math.floor(timeUsed * getPointsPerSecond(gameMode));
//     const difficultyMultiplier = difficulty === 'hard' ? 3 : difficulty === 'medium' ? 2 : 1;
//     const finalScore = baseScore * difficultyMultiplier;

//     // Only save to Firebase if time ran out (natural game completion)
//     // Let Unity handle the session when user stops manually
//     if (reason === 'time_up' && sessionId) {
//       const db = getDatabase();
//       const sessionRef = ref(db, `pendingSessions/${sessionId}`);
//       await update(sessionRef, {
//         status: 'completed',
//         score: finalScore,
//         calories: calories,
//         duration: (totalTime - timeRemaining) / 60 // duration in minutes
//       });

//       // Also save to user's sessions
//       const auth = getAuth();
//       const user = auth.currentUser;
//       if (user) {
//         const userSessionRef = ref(db, `users/${user.uid}/sessions/${sessionId}`);
//         await update(userSessionRef, {
//           score: finalScore,
//           gameMode: gameMode,
//           difficulty: difficulty,
//           timestamp: Math.floor(Date.now() / 1000),
//           calories: calories,
//           duration: (totalTime - timeRemaining) / 60
//         });
//       }
//     }

//     const message = reason === 'time_up' 
//       ? `Time's up! Final Score: ${finalScore}` 
//       : `Game stopped! Unity will handle the session.`;

//     Alert.alert('Game Over', message, [
//       {
//         text: 'OK',
//         onPress: () => navigation.goBack()
//       }
//     ]);
//   };

//   const handlePressIn = () => {
//     buttonScale.value = withTiming(0.95, { duration: 100 });
//   };

//   const handlePressOut = () => {
//     buttonScale.value = withTiming(1, { duration: 100 });

//     if (gameStatus === 'in_progress') {
//       // Stop the game
//       gameOver('stopped');
//     } else {
//       // Go back if game hasn't started
//       navigation.goBack();
//     }
//   };

//   const formatTime = (seconds) => {
//     const mins = Math.floor(seconds / 60);
//     const secs = seconds % 60;
//     return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
//   };

//   const getButtonText = () => {
//     switch(gameStatus) {
//       case 'pending':
//         return 'WAITING FOR PC...';
//       case 'in_progress':
//         return 'STOP GAME';
//       default:
//         return 'BACK';
//     }
//   };

//   const getStatusMessage = () => {
//     const gameDisplayName = gameModeNames[gameMode] || 'Game';
//     switch(gameStatus) {
//       case 'pending':
//         return `Waiting for ${gameDisplayName.toLowerCase()} to start on PC...`;
//       case 'in_progress':
//         return `${gameDisplayName} in progress!`;
//       default:
//         return `Ready to play ${gameDisplayName.toLowerCase()}!`;
//     }
//   };

//   return (
//     <View style={styles.container}>
//       {/* Header */}
//       <Text style={styles.headerText}>
//         {gameModeNames[gameMode] || 'Game Mode'}
//       </Text>

//       {/* Status Message */}
//       <Text style={styles.statusText}>{getStatusMessage()}</Text>

//       {/* Lives */}
//       <View style={styles.livesContainer}>
//         {[...Array(lives)].map((_, i) => (
//           <Ionicons key={i} name="heart" size={32} color="#B44CD1" style={styles.heartIcon} />
//         ))}
//       </View>

//       {/* Game Stats */}
//       <View style={styles.statsContainer}>
//         <StatCircle label="Heart Rate" value={heartRate.toString()} unit="bpm" />
//         <StatCircle label="Calories" value={calories.toString()} unit="kcal" />

//         <View style={styles.difficultyRow}>
//           <Text style={styles.difficultyLabel}>Difficulty:</Text>
//           <Text style={styles.difficultyValue}>{difficulty.toUpperCase()}</Text>
//         </View>

//         <Text style={styles.timeLabel}>Time Remaining:</Text>
//         <Text style={styles.timeDisplay}>{formatTime(timeRemaining)}</Text>
//         <View style={styles.timeBarContainer}>
//           <Animated.View style={[styles.timeBarFill, timeBarStyle]} />
//         </View>
//       </View>

//       {/* Action Button */}
//       <Animated.View style={[styles.button, animatedButtonStyle]}>
//         <TouchableOpacity
//           onPressIn={handlePressIn}
//           onPressOut={handlePressOut}
//           disabled={gameStatus === 'pending'}
//         >
//           <Text style={[
//             styles.buttonText,
//             gameStatus === 'pending' && styles.disabledButtonText
//           ]}>
//             {getButtonText()}
//           </Text>
//         </TouchableOpacity>
//       </Animated.View>
//     </View>
//   );
// };

// const StatCircle = ({ label, value, unit }) => {
//   return (
//     <View style={styles.circleStat}>
//       <View style={styles.circle}>
//         <Text style={styles.circleValue}>{value}</Text>
//         <Text style={styles.circleUnit}>{unit}</Text>
//       </View>
//       <Text style={styles.circleLabel}>{label}</Text>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingHorizontal: 20,
//   },
//   headerText: {
//     fontSize: 28,
//     fontWeight: 'bold',
//     color: '#FF00FF',
//     marginBottom: 10,
//     textShadowColor: '#FF00FF',
//     textShadowOffset: { width: 0, height: 0 },
//     textShadowRadius: 10,
//   },
//   statusText: {
//     fontSize: 16,
//     color: '#00FF00',
//     marginBottom: 20,
//     textAlign: 'center',
//   },
//   livesContainer: {
//     flexDirection: 'row',
//     marginBottom: 30,
//   },
//   heartIcon: {
//     marginHorizontal: 5,
//   },
//   statsContainer: {
//     width: '100%',
//     alignItems: 'center',
//     marginBottom: 30,
//   },
//   circleStat: {
//     alignItems: 'center',
//     marginBottom: 20,
//   },
//   circle: {
//     width: 100,
//     height: 100,
//     borderRadius: 50,
//     borderWidth: 3,
//     borderColor: '#00FF00',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginBottom: 5,
//     backgroundColor: '#2D1B3D',
//   },
//   circleValue: {
//     color: '#00FF00',
//     fontSize: 24,
//     fontWeight: 'bold',
//   },
//   circleUnit: {
//     color: '#00FF00',
//     fontSize: 12,
//   },
//   circleLabel: {
//     color: '#FF00FF',
//     fontSize: 14,
//   },
//   difficultyRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     width: '80%',
//     marginBottom: 15,
//   },
//   difficultyLabel: {
//     fontSize: 15,
//     color: '#00FF00',
//   },
//   difficultyValue: {
//     fontSize: 15,
//     fontWeight: 'bold',
//     color: '#FF00FF',
//   },
//   timeLabel: {
//     fontSize: 16,
//     color: '#00FF00',
//     marginBottom: 5,
//   },
//   timeDisplay: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: '#FF00FF',
//     marginBottom: 10,
//   },
//   timeBarContainer: {
//     width: '80%',
//     height: 16,
//     backgroundColor: '#2D1B3D',
//     borderRadius: 10,
//     overflow: 'hidden',
//     borderWidth: 1,
//     borderColor: '#00FF00',
//     marginBottom: 20,
//   },
//   timeBarFill: {
//     height: '100%',
//     backgroundColor: '#FF00FF',
//     borderRadius: 10,
//   },
//   button: {
//     paddingVertical: 15,
//     width: '80%',
//     borderWidth: 1,
//     borderColor: '#00FF00',
//     backgroundColor: '#2D1B3D',
//     borderRadius: 10,
//   },
//   buttonText: {
//     color: '#FF00FF',
//     fontSize: 18,
//     fontWeight: 'bold',
//     textAlign: 'center',
//     textShadowColor: '#FF00FF',
//     textShadowOffset: { width: 0, height: 0 },
//     textShadowRadius: 10,
//   },
//   disabledButtonText: {
//     color: '#666',
//   },
// });

// export default PuzzleMode;


import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { getAuth } from 'firebase/auth';
import { getDatabase, ref, onValue, off, update, push, set } from 'firebase/database';

const { width } = Dimensions.get('window');

const PuzzleMode = ({ navigation, route }) => {
  const [gameMode, setGameMode] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [gameStatus, setGameStatus] = useState('pending');
  const [sessionId, setSessionId] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(600);
  const [totalTime, setTotalTime] = useState(600);
  const [heartRate, setHeartRate] = useState(88);
  const [calories, setCalories] = useState(0);
  const [lives, setLives] = useState(3);

  const buttonScale = useSharedValue(1);
  const timeBar = useSharedValue(1.0);
  const timerRef = useRef(null);

  // ESP32 Connection States
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);
  const ESP32_IP = 'SAMPLE';

  // Heart Rate Session Tracking
  const [heartRateReadings, setHeartRateReadings] = useState([]);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const heartRateTimeoutRef = useRef(null);

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
    backgroundColor: buttonScale.value === 1 ? '#2D1B3D' : '#00FF00',
  }));

  const timeBarStyle = useAnimatedStyle(() => ({
    width: `${timeBar.value * 100}%`,
  }));

  // Game mode display names
  const gameModeNames = {
    'btc': 'Beat The Clock',
    'memory': 'Memory Game',
    'mirror': 'Mirror Game'
  };

  // Time limits based on game mode and difficulty (in seconds)
  const getTimeLimit = (mode, diff) => {
    const timeLimits = {
      'btc': {
        'easy': 900,   // 15 minutes
        'medium': 600, // 10 minutes
        'hard': 300    // 5 minutes
      },
      'memory': {
        'easy': 1200,  // 20 minutes
        'medium': 900, // 15 minutes
        'hard': 600    // 10 minutes
      },
      'mirror': {
        'easy': 1800,  // 30 minutes
        'medium': 1200, // 20 minutes
        'hard': 900     // 15 minutes
      }
    };
    return timeLimits[mode]?.[diff] || 600;
  };

  // Calorie burn rate per minute based on game mode and difficulty
  const getCalorieRate = (mode, diff) => {
    const calorieRates = {
      'btc': {
        'easy': 4,   // Fast-paced clicking
        'medium': 7,
        'hard': 12
      },
      'memory': {
        'easy': 3,   // Mental activity (lighter)
        'medium': 5,
        'hard': 8
      },
      'mirror': {
        'easy': 6,   // Physical movement (highest)
        'medium': 10,
        'hard': 15
      }
    };
    return calorieRates[mode]?.[diff] || 5;
  };

  // Calculate calories based on time elapsed, game mode, and difficulty
  const calculateCalories = (timeElapsed, mode, difficulty) => {
    const minutesElapsed = timeElapsed / 60;
    const calorieRate = getCalorieRate(mode, difficulty);
    return Math.floor(minutesElapsed * calorieRate);
  };

  // Calculate average heart rate from readings
  const calculateAverageHeartRate = (readings) => {
    if (readings.length === 0) return 0;
    const sum = readings.reduce((acc, reading) => acc + reading.bpm, 0);
    return Math.round(sum / readings.length);
  };

  // Save heart rate to Firebase realtime database
  const saveHeartRateToFirebase = async (bmp) => {
    console.log('Attempting to save heart rate:', bmp);

    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        console.log('No authenticated user found');
        return;
      }

      console.log('User authenticated:', user.uid);

      const db = getDatabase();

      // Save only BPM to heartRateReadings/bpm (single field, gets updated each time)
      const heartRateRef = ref(db, 'heartRateReadings/bpm');
      await set(heartRateRef, bmp); // Updates the same field each time

      // Update local readings array for calculating average later
      const newReading = {
        bpm: bmp,
        timestamp: Date.now()
      };

      setHeartRateReadings(prev => {
        const updated = [...prev, newReading];
        console.log('Local readings updated. Total readings:', updated.length);
        return updated;
      });

      console.log('✅ Heart rate saved to Firebase successfully:', bmp);

    } catch (error) {
      console.error('❌ Error saving heart rate to Firebase:', error);
      console.error('Error details:', error.message);
    }
  };

  // Clear heart rate readings from Firebase
  const clearHeartRateReadings = async () => {
    console.log('🧹 Clearing heart rate readings from Firebase...');

    try {
      const db = getDatabase();

      // Remove the heartRateReadings/bmp field
      const heartRateRef = ref(db, 'heartRateReadings/bmp');
      await set(heartRateRef, null); // Setting to null removes the field

      console.log('✅ Heart rate readings cleared from Firebase');

    } catch (error) {
      console.error('❌ Error clearing heart rate readings:', error);
    }
  };
  const saveSessionAverageHeartRate = async () => {
    console.log('📊 Attempting to save session average...');
    console.log('Session ID:', sessionId);
    console.log('Heart rate readings count:', heartRateReadings.length);

    if (!sessionId) {
      console.log('❌ No sessionId available for saving average');
      return;
    }

    if (heartRateReadings.length === 0) {
      console.log('❌ No heart rate readings to calculate average');
      return;
    }

    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        console.log('❌ No authenticated user found');
        return;
      }

      const db = getDatabase();
      const avgHeartRate = calculateAverageHeartRate(heartRateReadings);

      console.log('📊 Calculated average heart rate:', avgHeartRate);
      console.log('📊 Total readings:', heartRateReadings.length);
      console.log('📊 Session duration:', totalTime - timeRemaining, 'seconds');

      // Calculate final score
      const timeUsed = totalTime - timeRemaining;
      const getPointsPerSecond = (mode) => {
        switch (mode) {
          case 'btc': return 10;
          case 'memory': return 8;
          case 'mirror': return 12;
          default: return 10;
        }
      };
      const baseScore = Math.floor(timeUsed * getPointsPerSecond(gameMode));
      const difficultyMultiplier = difficulty === 'hard' ? 3 : difficulty === 'medium' ? 2 : 1;
      const finalScore = baseScore * difficultyMultiplier;

      // Save ALL session data including average heart rate
      const userSessionRef = ref(db, `users/${user.uid}/sessions/${sessionId}`);

      const sessionData = {
        gameMode: gameMode,
        difficulty: difficulty,
        score: finalScore,
        timestamp: Math.floor(Date.now() / 1000),
        duration: Math.floor((totalTime - timeRemaining) / 60), // Duration in minutes (integer)
        avg_heartrate: avgHeartRate
      };

      await update(userSessionRef, sessionData);

      console.log('✅ Complete session data with average heart rate saved successfully:', avgHeartRate);

    } catch (error) {
      console.error('❌ Error saving session average heart rate:', error);
      console.error('Error details:', error.message);
    }
  };

  // ESP32 Connection Functions
  const connectToESP32 = () => {
    try {
      // Clean up existing connection first
      if (wsRef.current) {
        if (wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.close();
        }
        wsRef.current = null;
      }

      console.log('🔄 Connecting to ESP32 at', ESP32_IP + ':81');
      wsRef.current = new WebSocket(`ws://${ESP32_IP}:81`);

      wsRef.current.onopen = () => {
        console.log('✅ Connected to ESP32 via WiFi');
        setIsConnected(true);

        // Start session tracking when connected
        if (!sessionStartTime) {
          setSessionStartTime(Date.now());
          console.log('📊 Session tracking started');
        }
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 Received data from ESP32:', data);

          if (data.type === 'heartRate' && data.bpm) {
            console.log('💓 Heart rate update:', data.bpm);
            setHeartRate(data.bpm);

            // Save to Firebase realtime database
            saveHeartRateToFirebase(data.bpm);

            // Clear any existing timeout and set a new one
            if (heartRateTimeoutRef.current) {
              clearTimeout(heartRateTimeoutRef.current);
            }

            // Set timeout to detect if readings stop
            heartRateTimeoutRef.current = setTimeout(() => {
              console.log('⚠️ Heart rate readings stopped - no data for 15 seconds');
            }, 15000); // 15 seconds timeout

          } else if (data.type === 'sensorStatus') {
            console.log('📊 Sensor status:', data.fingerDetected ? 'Finger detected' : 'No finger');
          } else if (data.type === 'connected') {
            console.log('🤝 ESP32 welcome message:', data.message);
          }
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error);
          console.error('Raw message:', event.data);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log('🔌 Disconnected from ESP32. Code:', event.code, 'Reason:', event.reason);
        setIsConnected(false);

        // Clear heart rate timeout
        if (heartRateTimeoutRef.current) {
          clearTimeout(heartRateTimeoutRef.current);
          heartRateTimeoutRef.current = null;
        }

        // Only attempt reconnection if:
        // 1. It wasn't a manual close (code 1000)
        // 2. Game is still in progress
        // 3. We don't already have a websocket reference (prevent multiple reconnections)
        if (event.code !== 1000 && gameStatus === 'in_progress' && wsRef.current === null) {
          console.log('🔄 Will attempt to reconnect in 3 seconds...');
          setTimeout(() => {
            // Double check game is still in progress before reconnecting
            if (gameStatus === 'in_progress' && (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED)) {
              console.log('🔄 Attempting reconnection...');
              connectToESP32();
            }
          }, 3000);
        } else {
          console.log('🚫 Not reconnecting - manual close or game not in progress');
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setIsConnected(false);
      };

    } catch (error) {
      console.error('❌ Failed to connect to ESP32:', error);
    }
  };

  // Disconnect ESP32
  const disconnectESP32 = () => {
    console.log('🔌 Manually disconnecting ESP32...');

    try {
      if (heartRateTimeoutRef.current) {
        clearTimeout(heartRateTimeoutRef.current);
        heartRateTimeoutRef.current = null;
      }

      if (wsRef.current) {
        // Set to null first to prevent reconnection attempts
        const ws = wsRef.current;
        wsRef.current = null;

        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
          ws.close(1000, 'Manual disconnect'); // Normal closure
        }
      }

      setIsConnected(false);
      console.log('✅ ESP32 disconnected successfully');
    } catch (error) {
      console.error('❌ Error during ESP32 disconnect:', error);
    }
  };

  // Handle navigation/page leave
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', async (e) => {
      console.log('🚪 Page is being left, cleaning up...');

      // Save session average before leaving
      if (heartRateReadings.length > 0) {
        await saveSessionAverageHeartRate();
      }

      // Clear heart rate readings from Firebase
      await clearHeartRateReadings();

      // Disconnect ESP32
      disconnectESP32();
    });

    return unsubscribe;
  }, [navigation, heartRateReadings, sessionId]);

  // Initialize ESP32 connection when component mounts
  useEffect(() => {
    console.log('🔄 Component mounted, initializing ESP32 connection...');
    // Only connect if game is in progress, not during pending
    if (gameStatus === 'in_progress') {
      connectToESP32();
    }

    return () => {
      // Cleanup on unmount
      console.log('🧹 Component unmounting, cleaning up...');

      // Use Promise.all to handle async cleanup without await in cleanup function
      const cleanup = async () => {
        // Save session average if we have readings
        if (heartRateReadings.length > 0) {
          await saveSessionAverageHeartRate();
        }

        // Clear heart rate readings and disconnect
        await clearHeartRateReadings();
        disconnectESP32();
      };

      // Execute cleanup without blocking
      cleanup().catch(error => {
        console.error('Error during cleanup:', error);
      });
    };
  }, [gameStatus]); // Depend on gameStatus to connect only when game starts

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (user) {
      const db = getDatabase();
      const pendingSessionsRef = ref(db, 'pendingSessions');

      const unsubscribe = onValue(pendingSessionsRef, (snapshot) => {
        if (snapshot.exists()) {
          const sessions = snapshot.val();
          console.log('All pending sessions:', sessions);

          // Find the user's most recent session that's not completed
          const userSession = Object.entries(sessions).find(([id, session]) => {
            console.log(`Checking session ${id}:`, session);
            return session.userId === user.uid &&
              (session.status === 'pending' || session.status === 'in_progress');
          });

          if (userSession) {
            const [id, session] = userSession;
            console.log('Found user session:', { id, session });

            setSessionId(id);
            setGameMode(session.gameMode);
            setDifficulty(session.difficulty);
            setGameStatus(session.status);

            console.log('Current game status:', session.status);

            const timeLimit = getTimeLimit(session.gameMode, session.difficulty);
            setTotalTime(timeLimit);

            // Reset everything when session is pending
            if (session.status === 'pending') {
              console.log('Session is pending - waiting for PC');
              setTimeRemaining(timeLimit);
              setCalories(0);
              setHeartRateReadings([]); // Reset heart rate readings
              // Use setTimeout to avoid reanimated warning
              setTimeout(() => {
                timeBar.value = 1.0;
              }, 0);
            }
            // Start timer when session becomes in_progress
            else if (session.status === 'in_progress') {
              console.log('Session is in progress - game should start');
              if (timeRemaining === timeLimit) {
                // First time starting, reset everything
                setTimeRemaining(timeLimit);
                setCalories(0);
                setHeartRateReadings([]); // Reset heart rate readings
                // Use setTimeout to avoid reanimated warning
                setTimeout(() => {
                  timeBar.value = 1.0;
                }, 0);
              }
            }
          } else {
            console.log('No active session found for user:', user.uid);
            // No session found, go back
            Alert.alert('No Active Session', 'No game session found. Please start a new game.', [
              { text: 'OK', onPress: () => navigation.goBack() }
            ]);
          }
        } else {
          console.log('No pending sessions found');
        }
      });

      return () => {
        off(pendingSessionsRef);
      };
    }
  }, []);

  // Start game timer ONLY when status changes to 'in_progress'
  useEffect(() => {
    console.log('Game status effect triggered. Status:', gameStatus);

    if (gameStatus === 'in_progress' && !timerRef.current) {
      console.log('Status is in_progress and no timer running - STARTING TIMER');
      startGameTimer();

      // Connect ESP32 when game starts
      if (!isConnected) {
        console.log('🔄 Game started - connecting ESP32...');
        connectToESP32();
      }
    } else if (gameStatus === 'pending') {
      console.log('Status is pending - STOPPING TIMER and DISCONNECTING ESP32');

      // Stop timer if running
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      // Disconnect ESP32 when game is pending
      if (isConnected) {
        disconnectESP32();
      }
    } else if (gameStatus !== 'in_progress' && timerRef.current) {
      console.log('Status is not in_progress - STOPPING TIMER');
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [gameStatus, isConnected]); // Depend on both gameStatus and isConnected

  const startGameTimer = () => {
    timerRef.current = setInterval(() => {
      setTimeRemaining((prevTime) => {
        const newTime = prevTime - 1;

        // Update time bar animation using setTimeout to avoid render conflicts
        setTimeout(() => {
          timeBar.value = withTiming(newTime / totalTime, { duration: 1000 });
        }, 0);

        // Update calories based on time elapsed (local calculation)
        const timeElapsed = totalTime - newTime;
        const currentCalories = calculateCalories(timeElapsed, gameMode, difficulty);
        setCalories(currentCalories);

        // Game over when time runs out
        if (newTime <= 0) {
          gameOver('time_up');
          return 0;
        }

        return newTime;
      });
    }, 1000);
  };

  const gameOver = async (reason) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Save session average heart rate before ending
    if (heartRateReadings.length > 0) {
      await saveSessionAverageHeartRate();
    }

    // Clear heart rate readings from Firebase
    await clearHeartRateReadings();

    // Calculate final score based on time, game mode, and difficulty
    const timeUsed = totalTime - timeRemaining;

    // Different point systems for different game modes
    const getPointsPerSecond = (mode) => {
      switch (mode) {
        case 'btc': return 10;     // Beat the Clock: fast-paced
        case 'memory': return 8;   // Memory Game: moderate points
        case 'mirror': return 12;  // Mirror Game: highest points (physical)
        default: return 10;
      }
    };

    const baseScore = Math.floor(timeUsed * getPointsPerSecond(gameMode));
    const difficultyMultiplier = difficulty === 'hard' ? 3 : difficulty === 'medium' ? 2 : 1;
    const finalScore = baseScore * difficultyMultiplier;
    const avgHeartRate = calculateAverageHeartRate(heartRateReadings);

    // Only save to Firebase if time ran out (natural game completion)
    // Let Unity handle the session when user stops manually
    if (reason === 'time_up' && sessionId) {
      const db = getDatabase();
      const sessionRef = ref(db, `pendingSessions/${sessionId}`);
      await update(sessionRef, {
        status: 'completed',
        score: finalScore,
        calories: calories,
        duration: (totalTime - timeRemaining) / 60, // duration in minutes
        avg_heartrate: avgHeartRate,
        total_heartrate_readings: heartRateReadings.length
      });

      // Also save to user's sessions with avg heart rate
      const auth = getAuth();
      const user = auth.currentUser;
      if (user) {
        const userSessionRef = ref(db, `users/${user.uid}/sessions/${sessionId}`);
        await update(userSessionRef, {
          gameMode: gameMode,
          difficulty: difficulty,
          score: finalScore,
          timestamp: Math.floor(Date.now() / 1000), // Ensure valid Unix timestamp in seconds
          duration: Math.floor((totalTime - timeRemaining) / 60), // Duration in minutes (integer)
          avg_heartrate: avgHeartRate
        });
      }
    }

    // Disconnect ESP32 when game ends
    disconnectESP32();

    const message = reason === 'time_up'
      ? `Time's up! Final Score: ${finalScore}\nAverage Heart Rate: ${avgHeartRate} BPM`
      : `Game stopped! Unity will handle the session.`;

    Alert.alert('Game Over', message, [
      {
        text: 'OK',
        onPress: () => navigation.goBack()
      }
    ]);
  };

  const handlePressIn = () => {
    buttonScale.value = withTiming(0.95, { duration: 100 });
  };

  const handlePressOut = async () => {
    buttonScale.value = withTiming(1, { duration: 100 });

    if (gameStatus === 'in_progress') {
      // Stop the game
      await gameOver('stopped');
    } else {
      // Save session data and clear readings before going back
      if (heartRateReadings.length > 0) {
        await saveSessionAverageHeartRate();
      }
      await clearHeartRateReadings();
      disconnectESP32();
      navigation.goBack();
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getButtonText = () => {
    switch (gameStatus) {
      case 'pending':
        return 'WAITING FOR PC...';
      case 'in_progress':
        return 'STOP GAME';
      default:
        return 'BACK';
    }
  };

  const getStatusMessage = () => {
    const gameDisplayName = gameModeNames[gameMode] || 'Game';
    switch (gameStatus) {
      case 'pending':
        return `Waiting for ${gameDisplayName.toLowerCase()} to start on PC...`;
      case 'in_progress':
        return `${gameDisplayName} in progress!`;
      default:
        return `Ready to play ${gameDisplayName.toLowerCase()}!`;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <Text style={styles.headerText}>
        {gameModeNames[gameMode] || 'Game Mode'}
      </Text>

      {/* Status Message */}
      <Text style={styles.statusText}>{getStatusMessage()}</Text>

      {/* ESP32 Connection Status */}
      <View style={styles.connectionStatus}>
        <View style={[styles.connectionDot, isConnected && styles.connectionDotConnected]} />
        <Text style={[styles.connectionText, isConnected && styles.connectionTextConnected]}>
          ESP32 {isConnected ? 'Connected' : 'Disconnected'}
        </Text>
        {heartRateReadings.length > 0 && (
          <Text style={styles.readingsCount}>
            {heartRateReadings.length} readings • Avg: {calculateAverageHeartRate(heartRateReadings)} BPM
          </Text>
        )}
      </View>

      {/* Lives */}
      <View style={styles.livesContainer}>
        {[...Array(lives)].map((_, i) => (
          <Ionicons key={i} name="heart" size={32} color="#B44CD1" style={styles.heartIcon} />
        ))}
      </View>

      {/* Game Stats */}
      <View style={styles.statsContainer}>
        <StatCircle
          label="Heart Rate"
          value={heartRate.toString()}
          unit="bpm"
          connected={isConnected}
        />
        <StatCircle label="Calories" value={calories.toString()} unit="kcal" />

        <View style={styles.difficultyRow}>
          <Text style={styles.difficultyLabel}>Difficulty:</Text>
          <Text style={styles.difficultyValue}>{difficulty.toUpperCase()}</Text>
        </View>

        <Text style={styles.timeLabel}>Time Remaining:</Text>
        <Text style={styles.timeDisplay}>{formatTime(timeRemaining)}</Text>
        <View style={styles.timeBarContainer}>
          <Animated.View style={[styles.timeBarFill, timeBarStyle]} />
        </View>
      </View>

      {/* Action Button */}
      <Animated.View style={[styles.button, animatedButtonStyle]}>
        <TouchableOpacity
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={gameStatus === 'pending'}
        >
          <Text style={[
            styles.buttonText,
            gameStatus === 'pending' && styles.disabledButtonText
          ]}>
            {getButtonText()}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const StatCircle = ({ label, value, unit, connected }) => {
  return (
    <View style={styles.circleStat}>
      <View style={[styles.circle, connected && styles.circleConnected]}>
        <Text style={[styles.circleValue, connected && styles.circleValueConnected]}>{value}</Text>
        <Text style={[styles.circleUnit, connected && styles.circleUnitConnected]}>{unit}</Text>
        {connected && (
          <View style={styles.pulseIndicator}>
            <Ionicons name="pulse" size={16} color="#00FF00" />
          </View>
        )}
      </View>
      <Text style={styles.circleLabel}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#1a1a1a',
  },
  headerText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF00FF',
    marginBottom: 10,
    textShadowColor: '#FF00FF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  statusText: {
    fontSize: 16,
    color: '#00FF00',
    marginBottom: 20,
    textAlign: 'center',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  connectionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF0000',
    marginRight: 8,
  },
  connectionDotConnected: {
    backgroundColor: '#00FF00',
  },
  connectionText: {
    color: '#FF0000',
    fontSize: 14,
    marginRight: 15,
  },
  connectionTextConnected: {
    color: '#00FF00',
  },
  readingsCount: {
    color: '#FFD700',
    fontSize: 12,
    fontStyle: 'italic',
  },
  livesContainer: {
    flexDirection: 'row',
    marginBottom: 30,
  },
  heartIcon: {
    marginHorizontal: 5,
  },
  statsContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 30,
  },
  circleStat: {
    alignItems: 'center',
    marginBottom: 20,
  },
  circle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#00FF00',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
    backgroundColor: '#2D1B3D',
    position: 'relative',
  },
  circleConnected: {
    borderColor: '#00FF00',
    shadowColor: '#00FF00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  circleValue: {
    color: '#00FF00',
    fontSize: 24,
    fontWeight: 'bold',
  },
  circleValueConnected: {
    color: '#00FF00',
  },
  circleUnit: {
    color: '#00FF00',
    fontSize: 12,
  },
  circleUnitConnected: {
    color: '#00FF00',
  },
  pulseIndicator: {
    position: 'absolute',
    top: 5,
    right: 5,
  },
  circleLabel: {
    color: '#FF00FF',
    fontSize: 14,
  },
  difficultyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    marginBottom: 15,
  },
  difficultyLabel: {
    fontSize: 15,
    color: '#00FF00',
  },
  difficultyValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FF00FF',
  },
  timeLabel: {
    fontSize: 16,
    color: '#00FF00',
    marginBottom: 5,
  },
  timeDisplay: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF00FF',
    marginBottom: 10,
  },
  timeBarContainer: {
    width: '80%',
    height: 16,
    backgroundColor: '#2D1B3D',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#00FF00',
    marginBottom: 20,
  },
  timeBarFill: {
    height: '100%',
    backgroundColor: '#FF00FF',
    borderRadius: 10,
  },
  button: {
    paddingVertical: 15,
    width: '80%',
    borderWidth: 1,
    borderColor: '#00FF00',
    backgroundColor: '#2D1B3D',
    borderRadius: 10,
  },
  buttonText: {
    color: '#FF00FF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: '#FF00FF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  disabledButtonText: {
    color: '#666',
  },
});

export default PuzzleMode;