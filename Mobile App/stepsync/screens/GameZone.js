// import React from 'react';
// import { View, Text, TextInput, Image, StyleSheet, TouchableOpacity, Alert } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
// import { getAuth } from 'firebase/auth';
// import { getDatabase, ref, get, push, set, onValue, off } from 'firebase/database';
// import { useEffect, useState } from 'react';

// import StepSyncApiServices from '../services/StepSyncApi';

// const GameZone = ({navigation}) => {

//   const [username, setUsername] = useState('');
//   const [profilePic, setprofilePic] = useState('');
//   const [streakCount, setStreakCount] = useState(0);
//   const [totalSessions, setTotalSessions] = useState(0);
//   const [todaySessionCount, setTodaySessionCount] = useState(0);

//   const profilePictures = {
//     'default.jpg': require('../assets/defaultProfile.jpg'),
//     'girlBlack.jpg': require('../assets/gamerGirlBlack.jpg'),
//     'boyWhite.png': require('../assets/gamerBoyWhite.png'),
//     'kid.png': require('../assets/gamerKid.png'),
//     'girlAsian.png': require('../assets/gamerGirlAsian.png')
//   };
  
//   // Game mode options with recommended option
//   const [gameModeOptions] = useState([
//     { key: 'btc', value: 'Beat the Clock', recommended: true },
//     { key: 'memory', value: 'Memory Game', recommended: false },
//     { key: 'mirror', value: 'Mirror Game', recommended: false }
//   ]);
  
//   // Difficulty level options with recommended option
//   const [difficultyOptions, setDifficultyOptions] = useState([
//     { key: 'easy', value: 'Easy', recommended: true },
//     { key: 'medium', value: 'Medium', recommended: false },
//     { key: 'hard', value: 'Hard', recommended: false }
//   ]);
  
//   // Get recommended options
//   const getRecommendedOption = (options) => {
//     return options.find(option => option.recommended);
//   };
  
//   // State for selected values - default to recommended
//   const [selectedGameMode, setSelectedGameMode] = useState(getRecommendedOption(gameModeOptions)?.key || '');
//   const [selectedDifficulty, setSelectedDifficulty] = useState(getRecommendedOption(difficultyOptions)?.key || '');

//   // Helper function to calculate streak from session timestamps
//   const calculateStreakFromSessions = (sessions) => {
//     if (!sessions || Object.keys(sessions).length === 0) return 0;

//     const sessionDates = Object.values(sessions)
//       .map(session => {
//         const date = new Date(session.timestamp * 1000);
//         return date.toISOString().split('T')[0];
//       })
//       .filter(date => date);

//     const uniqueDates = [...new Set(sessionDates)].sort().reverse();
    
//     if (uniqueDates.length === 0) return 0;

//     const today = new Date();
//     const todayStr = today.toISOString().split('T')[0];
//     const yesterdayStr = new Date(today.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

//     let streak = 0;
//     let currentDate = new Date(today);
    
//     let startDate = todayStr;
//     if (uniqueDates[0] === yesterdayStr && !uniqueDates.includes(todayStr)) {
//       startDate = yesterdayStr;
//       currentDate = new Date(today.getTime() - 24 * 60 * 60 * 1000);
//     }

//     for (let i = 0; i < uniqueDates.length; i++) {
//       const sessionDate = uniqueDates[i];
//       const expectedDate = currentDate.toISOString().split('T')[0];
      
//       if (sessionDate === expectedDate) {
//         streak++;
//         currentDate.setDate(currentDate.getDate() - 1);
//       } else {
//         break;
//       }
//     }
    
//     return streak;
//   };

//   // Helper function to get today's session count
//   const getTodaySessionCount = (sessions) => {
//     if (!sessions) return 0;
    
//     const today = new Date().toISOString().split('T')[0];
    
//     return Object.values(sessions).filter(session => {
//       const sessionDate = new Date(session.timestamp * 1000).toISOString().split('T')[0];
//       return sessionDate === today;
//     }).length;
//   };

//   // Dynamic status message for GameZone
//   const getGameZoneStatusMessage = () => {
//     if (totalSessions === 0) {
//       return "Ready to start your first gaming session?";
//     } else if (todaySessionCount === 0) {
//       if (streakCount === 0) {
//         return "Time to get back in the game!";
//       } else if (streakCount >= 7) {
//         return `${streakCount}-day streak! Keep the fire burning! 🔥`;
//       } else {
//         return `Day ${streakCount} streak - don't break it now!`;
//       }
//     } else if (todaySessionCount >= 2) {
//       return `${todaySessionCount} sessions today! You're crushing it! 💪`;
//     } else {
//       return "Great session! Ready for another challenge?";
//     }
//   };

//   // Function to create game session
//   const createGameSession = async (userId, userEmail, gameMode, difficulty) => {
//     try {
//       const db = getDatabase();
      
//       // Create session ID using push().key
//       const sessionRef = push(ref(db, 'pendingSessions'));
//       const sessionId = sessionRef.key;
      
//       // Create pending session data
//       const pendingSession = {
//         userId: userId,
//         userEmail: userEmail,
//         gameMode: gameMode,
//         difficulty: difficulty,
//         timestamp: Date.now(),
//         status: 'pending'
//       };
      
//       // Write to pending sessions
//       await set(sessionRef, pendingSession);
      
//       console.log('Game session created:', sessionId);
//       return sessionId;
      
//     } catch (error) {
//       console.error('Error creating game session:', error);
//       throw error;
//     }
//   };

//   // Function to update difficulty recommendations
//   const updateRecommendedDifficulty = (newRecommendedKey) => {
//     setDifficultyOptions(prev => 
//       prev.map(option => ({
//         ...option,
//         recommended: option.key === newRecommendedKey
//       }))
//     );
//     setSelectedDifficulty(newRecommendedKey);
//   };

//   // Function to update recommendations
//   const updateRecommendedGameMode = (newRecommendedKey) => {
//     setGameModeOptions(prev => 
//       prev.map(option => ({
//         ...option,
//         recommended: option.key === newRecommendedKey
//       }))
//     );
//   };

//   useEffect(() => {
//     const auth = getAuth();
//     const user = auth.currentUser;

//     if (user) {
//       const db = getDatabase();
//       const userRef = ref(db, `users/${user.uid}`);

//       const unsubscribe = onValue(userRef, (snapshot) => {
//         if (snapshot.exists()) {
//           const userData = snapshot.val();
          
//           setUsername(userData.username || 'Player');
//           setprofilePic(userData.profilePicUrl || 'default.jpg');
          
//           if (userData.sessions) {
//             const sessions = userData.sessions;
            
//             // Calculate dynamic values
//             const streak = calculateStreakFromSessions(sessions);
//             const todaySessions = getTodaySessionCount(sessions);
//             const total = Object.keys(sessions).length;
            
//             setStreakCount(streak);
//             setTodaySessionCount(todaySessions);
//             setTotalSessions(total);
//           } else {
//             // No sessions data
//             setStreakCount(0);
//             setTodaySessionCount(0);
//             setTotalSessions(0);
//           }
          
//           // Get API recommendation
//           fetchAPIRecommendation(userData);
//         }
//       });

//       return () => {
//         off(userRef);
//       };
//     }
//   }, []);

//   // Separate async function for API call
//   const fetchAPIRecommendation = async (userData) => {
//     try {
//       // Calculate BMI if not provided
//       let bmi = userData.bmi;
//       if (!bmi && userData.weight && userData.height) {
//         bmi = userData.weight / ((userData.height / 100) ** 2);
//       }

//       const healthData = {
//         age: userData.age,
//         bmi: bmi,
//         restingBPM: userData.restingBPM || 70,
//         workoutFrequency: userData.workoutFrequency || 100
//       };

//       console.log('User health data:', healthData);

//       // Call your API
//       const response = await fetch('https://stepsync-api-v2-production.up.railway.app/predict', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           features: [healthData.age, healthData.bmi, healthData.restingBPM, healthData.workoutFrequency]
//         }),
//       });

//       if (response.ok) {
//         const result = await response.json();
//         console.log('API response:', result);
//         const recommendedDifficulty = result.predicted_class.toLowerCase();
//         console.log('Recommended difficulty:', recommendedDifficulty);
//         updateRecommendedDifficulty(recommendedDifficulty);
//       }
//     } catch (error) {
//       console.error('API error:', error);
//       // Keep default "easy" if API fails
//     }
//   };

//   const buttonScale = useSharedValue(1);

//   const animatedButtonStyle = useAnimatedStyle(() => {
//     return {
//       transform: [{ scale: buttonScale.value }],
//       backgroundColor: buttonScale.value === 1 ? '#2D1B3D' : '#00FF00', // Change color on press
//     };
//   });

//   const handlePressIn = () => {
//     buttonScale.value = withTiming(0.95, { duration: 100 });
//   };

//   const handlePressOut = () => {
//     buttonScale.value = withTiming(1, { duration: 100 });
//     onStartGame();
//   };

//   // Function to handle game start
//   const onStartGame = async () => {
//     try {
//       const auth = getAuth();
//       const user = auth.currentUser;
      
//       if (!user) {
//         Alert.alert('Error', 'Please log in to start a game');
//         return;
//       }

//       const userId = user.uid;
//       const userEmail = user.email;
      
//       // Validate selections
//       if (!selectedGameMode || !selectedDifficulty) {
//         Alert.alert('Error', 'Please select both game mode and difficulty');
//         return;
//       }

//       console.log('Starting game with:', {
//         userId,
//         userEmail,
//         gameMode: selectedGameMode,
//         difficulty: selectedDifficulty
//       });

//       // Create game session
//       const sessionId = await createGameSession(userId, userEmail, selectedGameMode, selectedDifficulty);
      
//       // Navigate to game mode page with session data
//       Alert.alert(
//         'Game Session Created!', 
//         `Your game session has been created. Session ID: ${sessionId}\n\nYou can now start the game on your PC.`,
//         [
//           {
//             text: 'OK',
//             onPress: () => {
//               // Navigate to the game mode page (PuzzleMode handles all game modes)
//               navigation.push('mode', { 
//                 sessionId: sessionId,
//                 gameMode: selectedGameMode,
//                 difficulty: selectedDifficulty 
//               });
//             }
//           }
//         ]
//       );
      
//     } catch (error) {
//       console.error('Error starting game:', error);
//       Alert.alert('Error', 'Failed to start game session. Please try again.');
//     }
//   };

//   const homepage = () => {
//     navigation.push('home');
//   }

//   const progresspage = () => {
//     navigation.push('progress');
//   }

//   const leaderpage = () => {
//     navigation.push('leaderboard');
//   }

//   const settings = () => {
//     navigation.push('setting');
//   }

//   // Custom dropdown component
//   const CustomDropdown = ({ data, placeholder, onSelect, selectedValue }) => {
//     const [isOpen, setIsOpen] = useState(false);
    
//     const selectedOption = data.find(item => item.key === selectedValue);
    
//     return (
//       <>
//         <View style={styles.dropdownContainer}>
//           <TouchableOpacity 
//             style={styles.dropdownButton} 
//             onPress={() => setIsOpen(!isOpen)}
//           >
//             <Text style={styles.dropdownButtonText}>
//               {selectedOption ? selectedOption.value : placeholder}
//               {selectedOption?.recommended && ' ⭐'}
//             </Text>
//             <Ionicons 
//               name={isOpen ? "chevron-up" : "chevron-down"} 
//               size={16} 
//               color="#00FF00" 
//             />
//           </TouchableOpacity>
//         </View>
        
//         {isOpen && (
//           <>
//             <TouchableOpacity 
//               style={styles.dropdownOverlay} 
//               onPress={() => setIsOpen(false)}
//               activeOpacity={1}
//             />
//             <View style={styles.dropdownList}>
//               {data.map((item) => (
//                 <TouchableOpacity
//                   key={item.key}
//                   style={[
//                     styles.dropdownItem,
//                     selectedValue === item.key && styles.selectedItem
//                   ]}
//                   onPress={() => {
//                     onSelect(item.key);
//                     setIsOpen(false);
//                   }}
//                 >
//                   <Text style={[
//                     styles.dropdownItemText,
//                     selectedValue === item.key && styles.selectedItemText
//                   ]}>
//                     {item.value}
//                     {item.recommended && ' ⭐'}
//                   </Text>
//                 </TouchableOpacity>
//               ))}
//             </View>
//           </>
//         )}
//       </>
//     );
//   };

//   return (
//     <View style={styles.container}>
//       {/* Header Section */}
//       <View style={styles.headerBar}>
//         <Text style={styles.headerText}>GAME ZONE</Text>
//               {/* User Info Section */}
//       <View style={styles.userSection}>
//         <Image source={profilePictures[profilePic] } style={styles.profileImage} />
//         <View style={styles.userInfo}>
//           <Text style={styles.username}>{username}</Text>
//           <Text style={styles.userStatus}>{getGameZoneStatusMessage()}</Text>
//         </View>
//       </View>
//       </View>
      
//       {/* Weight Info */}
//       <View style={styles.weightSection}>
//         <View style={styles.row}>
//           <Text style={styles.label}>Game Mode:</Text>
//           <CustomDropdown
//             data={gameModeOptions}
//             placeholder="Select Game Mode"
//             selectedValue={selectedGameMode}
//             onSelect={setSelectedGameMode}
//           />
//         </View>
//         <View style={styles.row}>
//           <Text style={styles.label}>Difficulty Level</Text>
//           <CustomDropdown
//             data={difficultyOptions}
//             placeholder="Select Difficulty"
//             selectedValue={selectedDifficulty}
//             onSelect={setSelectedDifficulty}
//           />
//         </View>
//         <View style={styles.row}>
//           <Text style={styles.label}>Time Limit:</Text>
//           <TextInput style={styles.input} value="00:10:00" editable={false} />
//         </View>
//       </View>
      
//       {/* Bottom Navigation Bar */}
//       <View style={styles.bottomNav}>
//         <TouchableOpacity onPress={settings}><Ionicons name="settings" size={24} color="black" /></TouchableOpacity>
        
//         <TouchableOpacity onPress={leaderpage}><Ionicons name="bar-chart" size={24} color="black" /></TouchableOpacity>
        

//         <View style={styles.homeIconContainer}>
//         <TouchableOpacity onPress={homepage}><Ionicons name="home" size={28} color="black" /></TouchableOpacity>

//         </View>
//         <Ionicons name="game-controller" size={24} color="#FF00FF" />
//         <TouchableOpacity onPress={progresspage}><Ionicons name="flame" size={24} color="black" /></TouchableOpacity>

//       </View>

//         <Animated.View style={[styles.button, animatedButtonStyle]}>
//           <TouchableOpacity 
//             onPressIn={handlePressIn} 
//             onPressOut={handlePressOut} 
//             // onPress={() => console.log("Button Pressed")}
//           ><Text style={styles.buttonText}>START GAME</Text></TouchableOpacity>
//           </Animated.View>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     alignItems: 'center',
//     justifyContent: 'center',
//     width: '100%'
//   },
//   headerBar: {
//     width: '120%',
//     height: 200,
//     backgroundColor: '#2D1B3D',
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderBottomLeftRadius: 200,
//     borderBottomRightRadius: 200,
//     position: 'absolute',
//     top: 0,
//   },
//   headerText: {
//     color: '#FF00FF',
//     fontSize: 28,
//     fontWeight: 'bold',
//     marginTop: '5%',
//     textShadowColor: '#FF00FF',
//     textShadowOffset: { width: 0, height: 0 },
//     textShadowRadius: 10,
//   },
//   userSection: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     padding: 10,
//     borderRadius: 15,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     marginTop: 10
//   },
//   profileImage: {
//     width: 50,
//     height: 50,
//     borderRadius: 25,
//     backgroundColor: '#D3B3E5',
//   },
//   userInfo: {
//     marginLeft: 10,
//   },
//   username: {
//     fontSize: 16,
//     color: '#00FF00'
//   },
//   userStatus: {
//     fontSize: 12,
//     color: 'gray',
//   },
//   apiStatusContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginTop: 4,
//   },
//   statusDot: {
//     width: 8,
//     height: 8,
//     borderRadius: 4,
//     marginRight: 6,
//   },
//   apiStatusText: {
//     fontSize: 10,
//     color: '#888',
//   },
//   testButton: {
//     marginLeft: 8,
//     paddingHorizontal: 6,
//     paddingVertical: 2,
//     backgroundColor: '#444',
//     borderRadius: 4,
//   },
//   testButtonText: {
//     fontSize: 8,
//     color: '#00FF00',
//   },
//   weightSection: {
//     marginTop: 100,
//     width: '80%'
//   },
//   row: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 30,
//   },
//   label: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     color: '#FF00FF'
//   },
//   input: {
//     width: '40%',
//     height: 40,
//     borderRadius: 10,
//     backgroundColor: '#2D1B3D',
//     textAlign: 'center',
//     color: '#00FF00',
//     fontSize: 16,
//     borderWidth: 1,
//     borderColor: '#00FF00'
//   },
//   difficultyContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     width: '45%',
//   },
//   refreshButton: {
//     marginLeft: 8,
//     padding: 8,
//     borderRadius: 20,
//     backgroundColor: '#2D1B3D',
//     borderWidth: 1,
//     borderColor: '#00FF00',
//   },
//   recommendationInfo: {
//     backgroundColor: 'rgba(45, 27, 61, 0.3)',
//     padding: 12,
//     borderRadius: 8,
//     marginTop: 10,
//     borderWidth: 1,
//     borderColor: '#00FF00',
//   },
//   recommendationText: {
//     color: '#00FF00',
//     fontSize: 12,
//     textAlign: 'center',
//     fontStyle: 'italic',
//   },
//   debugInfo: {
//     backgroundColor: 'rgba(255, 0, 255, 0.1)',
//     padding: 8,
//     borderRadius: 4,
//     marginTop: 10,
//   },
//   debugText: {
//     color: '#FF00FF',
//     fontSize: 10,
//     textAlign: 'center',
//   },
//   dropdownContainer: {
//     width: '40%',
//     position: 'relative',
//   },
//   dropdownButton: {
//     height: 40,
//     borderRadius: 10,
//     backgroundColor: '#2D1B3D',
//     borderWidth: 1,
//     borderColor: '#00FF00',
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: 10,
//   },
//   dropdownButtonText: {
//     color: '#00FF00',
//     fontSize: 14,
//     flex: 1,
//     textAlign: 'center',
//   },
//   dropdownOverlay: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     zIndex: 9998,
//   },
//   dropdownList: {
//     position: 'absolute',
//     top: '50%',
//     left: '50%',
//     transform: [{ translateX: -80 }, { translateY: -60 }],
//     width: 160,
//     backgroundColor: '#2D1B3D',
//     borderRadius: 10,
//     borderWidth: 1,
//     borderColor: '#00FF00',
//     maxHeight: 150,
//     zIndex: 9999,
//     elevation: 20,
//   },
//   dropdownItem: {
//     padding: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: '#444',
//   },
//   dropdownItemText: {
//     color: '#00FF00',
//     fontSize: 14,
//     textAlign: 'center',
//   },
//   selectedItem: {
//     backgroundColor: '#444',
//   },
//   selectedItemText: {
//     color: '#FF00FF',
//     fontWeight: 'bold',
//   },
//   bottomNav: {
//     position: 'absolute',
//     bottom: 0,
//     width: '100%',
//     height: 70,
//     backgroundColor: '#2D1B3D',
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//     alignItems: 'center',
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//   },
//   homeIconContainer: {
//     backgroundColor: '#2D1B3D',
//     padding: 10,
//     borderRadius: 30,
//     marginBottom: 10,
//   },
//   button: {
//     backgroundColor: '#2D1B3D',
//     paddingVertical: 10,
//     width: '80%',
//     borderRadius: 10,
//     alignItems: 'center',
//     marginTop: 50,
//     borderWidth: 1,
//     borderColor: '#00FF00'
//   },
//   buttonText: {
//     color: '#FF00FF',
//     fontSize: 18,
//     fontWeight: 'bold',
//     textShadowColor: '#FF00FF',
//     textShadowOffset: { width: 0, height: 0 },
//     textShadowRadius: 10,
//   },
// });

// export default GameZone;

// // import React from 'react';
// // import { View, Text, TextInput, Image, StyleSheet , TouchableOpacity} from 'react-native';
// // import { Ionicons } from '@expo/vector-icons';
// // import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
// // import { getAuth } from 'firebase/auth';
// // import { getDatabase } from 'firebase/database';
// // import { get, ref } from 'firebase/database';
// // import { useEffect } from 'react';
// // import { useState } from 'react';

// // import StepSyncApiServices from '../services/StepSyncApi';

// // const GameZone = ({navigation}) => {

// //   const [username, setUsername] = useState('');

// //   const [profilePic, setprofilePic] = useState('');

// //   const profilePictures = {
// //   'default.jpg': require('../assets/defaultProfile.jpg'),
// //   'girlBlack.jpg': require('../assets/gamerGirlBlack.jpg'),
// //   'boyWhite.png': require('../assets/gamerBoyWhite.png'),
// //   'kid.png': require('../assets/gamerKid.png'),
// //   'girlAsian.png': require('../assets/gamerGirlAsian.png')
// //   };
  
// //   // Game mode options with recommended option
// //   const [gameModeOptions] = useState([
// //     { key: 'beat-clock', value: 'Beat the Clock', recommended: true },
// //     { key: 'memory', value: 'Memory Game', recommended: false },
// //     { key: 'mirror', value: 'Mirror Game', recommended: false }
// //   ]);
  
// //   // Difficulty level options with recommended option
// //   const [difficultyOptions, setDifficultyOptions] = useState([
// //     { key: 'easy', value: 'Easy', recommended: true },
// //     { key: 'medium', value: 'Medium', recommended: false },
// //     { key: 'hard', value: 'Hard', recommended: false }
// //   ]);
  
// //   // Get recommended options
// //   const getRecommendedOption = (options) => {
// //     return options.find(option => option.recommended);
// //   };
  
// //   // State for selected values - default to recommended
// //   const [selectedGameMode, setSelectedGameMode] = useState(getRecommendedOption(gameModeOptions)?.key || '');
// //   const [selectedDifficulty, setSelectedDifficulty] = useState(getRecommendedOption(difficultyOptions)?.key || '');

// //   // Function to update difficulty recommendations
// //   const updateRecommendedDifficulty = (newRecommendedKey) => {
// //     setDifficultyOptions(prev => 
// //       prev.map(option => ({
// //         ...option,
// //         recommended: option.key === newRecommendedKey
// //       }))
// //     );
// //     setSelectedDifficulty(newRecommendedKey);
// //   };

// //   // Function to update recommendations
// //   const updateRecommendedGameMode = (newRecommendedKey) => {
// //     setGameModeOptions(prev => 
// //       prev.map(option => ({
// //         ...option,
// //         recommended: option.key === newRecommendedKey
// //       }))
// //     );
// //   };

// //   useEffect(() => {
// //     const fetchUserDataAndRecommendation = async () => {
// //       const auth = getAuth();
// //       const user = auth.currentUser;

// //       if (user) {
// //         const uid = user.uid;
// //         const db = getDatabase();
// //         const snapshot = await get(ref(db, `users/${uid}`));

// //         if (snapshot.exists()) {
// //           const data = snapshot.val();
// //           setUsername(data.username);
// //           setprofilePic(data.profilePicUrl);
          
// //           // Get API recommendation
// //           try {
// //             // Calculate BMI if not provided
// //             let bmi = data.bmi;
// //             if (!bmi && data.weight && data.height) {
// //               bmi = data.weight / ((data.height / 100) ** 2);
// //             }

// //             const healthData = {
// //               age: data.age,
// //               bmi: bmi,
// //               restingBPM: data.restingBPM || 70,
// //               workoutFrequency: data.workoutFrequency || 100
// //             };

// //             console.log('User health data:', healthData);

// //             // Call your API
// //             const response = await fetch('https://stepsync-api-v2-production.up.railway.app/predict', {
// //               method: 'POST',
// //               headers: {
// //                 'Content-Type': 'application/json',
// //               },
// //               body: JSON.stringify({
// //                 features: [healthData.age, healthData.bmi, healthData.restingBPM, healthData.workoutFrequency]
// //               }),
// //             });

// //             if (response.ok) {
// //               const result = await response.json();
// //               console.log('API response:', result);
// //               const recommendedDifficulty = result.predicted_class.toLowerCase();
// //               console.log('Recommended difficulty:', recommendedDifficulty);
// //               updateRecommendedDifficulty(recommendedDifficulty);
// //             }
// //           } catch (error) {
// //             console.error('API error:', error);
// //             // Keep default "easy" if API fails
// //           }
// //         }
// //       }
// //     };

// //     fetchUserDataAndRecommendation();
// //   }, []);

// //   const buttonScale = useSharedValue(1);

// //   const animatedButtonStyle = useAnimatedStyle(() => {
// //     return {
// //       transform: [{ scale: buttonScale.value }],
// //       backgroundColor: buttonScale.value === 1 ? '#2D1B3D' : '#00FF00', // Change color on press
// //     };
// //   });

// //   const handlePressIn = () => {
// //     buttonScale.value = withTiming(0.95, { duration: 100 });
// //   };

// //   const handlePressOut = () => {
// //     buttonScale.value = withTiming(1, { duration: 100 });
// //     navigation.push('mode');
// //   };

// //   const homepage = () => {
// //     navigation.push('home');
// //   }

// //   const progresspage = () => {
// //     navigation.push('progress');
// //   }

// //   const leaderpage = () => {
// //     navigation.push('leaderboard');
// //   }

// //   const settings = () => {
// //     navigation.push('setting');
// //   }

// //   // Custom dropdown component
// //   const CustomDropdown = ({ data, placeholder, onSelect, selectedValue }) => {
// //     const [isOpen, setIsOpen] = useState(false);
    
// //     const selectedOption = data.find(item => item.key === selectedValue);
    
// //     return (
// //       <>
// //         <View style={styles.dropdownContainer}>
// //           <TouchableOpacity 
// //             style={styles.dropdownButton} 
// //             onPress={() => setIsOpen(!isOpen)}
// //           >
// //             <Text style={styles.dropdownButtonText}>
// //               {selectedOption ? selectedOption.value : placeholder}
// //               {selectedOption?.recommended && ' ⭐'}
// //             </Text>
// //             <Ionicons 
// //               name={isOpen ? "chevron-up" : "chevron-down"} 
// //               size={16} 
// //               color="#00FF00" 
// //             />
// //           </TouchableOpacity>
// //         </View>
        
// //         {isOpen && (
// //           <>
// //             <TouchableOpacity 
// //               style={styles.dropdownOverlay} 
// //               onPress={() => setIsOpen(false)}
// //               activeOpacity={1}
// //             />
// //             <View style={styles.dropdownList}>
// //               {data.map((item) => (
// //                 <TouchableOpacity
// //                   key={item.key}
// //                   style={[
// //                     styles.dropdownItem,
// //                     selectedValue === item.key && styles.selectedItem
// //                   ]}
// //                   onPress={() => {
// //                     onSelect(item.key);
// //                     setIsOpen(false);
// //                   }}
// //                 >
// //                   <Text style={[
// //                     styles.dropdownItemText,
// //                     selectedValue === item.key && styles.selectedItemText
// //                   ]}>
// //                     {item.value}
// //                     {item.recommended && ' ⭐'}
// //                   </Text>
// //                 </TouchableOpacity>
// //               ))}
// //             </View>
// //           </>
// //         )}
// //       </>
// //     );
// //   };

// //   return (
// //     <View style={styles.container}>
// //       {/* Header Section */}
// //       <View style={styles.headerBar}>
// //         <Text style={styles.headerText}>GAME ZONE</Text>
// //               {/* User Info Section */}
// //       <View style={styles.userSection}>
// //         <Image source={profilePictures[profilePic] } style={styles.profileImage} />
// //         <View style={styles.userInfo}>
// //           <Text style={styles.username}>{username}</Text>
// //           <Text style={styles.userStatus}>It's your 4th Day, Keep it up!</Text>
// //         </View>
// //       </View>
// //       </View>
      
// //       {/* Weight Info */}
// //       <View style={styles.weightSection}>
// //         <View style={styles.row}>
// //           <Text style={styles.label}>Game Mode:</Text>
// //           <CustomDropdown
// //             data={gameModeOptions}
// //             placeholder="Select Game Mode"
// //             selectedValue={selectedGameMode}
// //             onSelect={setSelectedGameMode}
// //           />
// //         </View>
// //         <View style={styles.row}>
// //           <Text style={styles.label}>Difficulty Level</Text>
// //           <CustomDropdown
// //             data={difficultyOptions}
// //             placeholder="Select Difficulty"
// //             selectedValue={selectedDifficulty}
// //             onSelect={setSelectedDifficulty}
// //           />
// //         </View>
// //         <View style={styles.row}>
// //           <Text style={styles.label}>Time Limit:</Text>
// //           <TextInput style={styles.input} value="00:10:00" editable={false} />
// //         </View>
// //       </View>
      
// //       {/* Bottom Navigation Bar */}
// //       <View style={styles.bottomNav}>
// //         <TouchableOpacity onPress={settings}><Ionicons name="settings" size={24} color="black" /></TouchableOpacity>
        
// //         <TouchableOpacity onPress={leaderpage}><Ionicons name="bar-chart" size={24} color="black" /></TouchableOpacity>
        

// //         <View style={styles.homeIconContainer}>
// //         <TouchableOpacity onPress={homepage}><Ionicons name="home" size={28} color="black" /></TouchableOpacity>

// //         </View>
// //         <Ionicons name="game-controller" size={24} color="#FF00FF" />
// //         <TouchableOpacity onPress={progresspage}><Ionicons name="flame" size={24} color="black" /></TouchableOpacity>

// //       </View>

// //         <Animated.View style={[styles.button, animatedButtonStyle]}>
// //           <TouchableOpacity 
// //             onPressIn={handlePressIn} 
// //             onPressOut={handlePressOut} 
// //             // onPress={() => console.log("Button Pressed")}
// //           ><Text style={styles.buttonText}>START GAME</Text></TouchableOpacity>
// //           </Animated.View>
// //     </View>
// //   );
// // };

// // const styles = StyleSheet.create({
// //   container: {
// //     flex: 1,
// //     alignItems: 'center',
// //     justifyContent: 'center',
// //     width: '100%'
// //   },
// //   headerBar: {
// //     width: '120%',
// //     height: 200,
// //     backgroundColor: '#2D1B3D',
// //     justifyContent: 'center',
// //     alignItems: 'center',
// //     borderBottomLeftRadius: 200,
// //     borderBottomRightRadius: 200,
// //     position: 'absolute',
// //     top: 0,
// //   },
// //   headerText: {
// //     color: '#FF00FF',
// //     fontSize: 28,
// //     fontWeight: 'bold',
// //     marginTop: '5%',
// //     textShadowColor: '#FF00FF',
// //     textShadowOffset: { width: 0, height: 0 },
// //     textShadowRadius: 10,
// //   },
// //   userSection: {
// //     flexDirection: 'row',
// //     alignItems: 'center',
// //     padding: 10,
// //     borderRadius: 15,
// //     shadowColor: '#000',
// //     shadowOffset: { width: 0, height: 2 },
// //     shadowOpacity: 0.1,
// //     shadowRadius: 4,
// //     marginTop: 10
// //   },
// //   profileImage: {
// //     width: 50,
// //     height: 50,
// //     borderRadius: 25,
// //     backgroundColor: '#D3B3E5',
// //   },
// //   userInfo: {
// //     marginLeft: 10,
// //   },
// //   username: {
// //     fontSize: 16,
// //     color: '#00FF00'
// //   },
// //   userStatus: {
// //     fontSize: 12,
// //     color: 'gray',
// //   },
// //   apiStatusContainer: {
// //     flexDirection: 'row',
// //     alignItems: 'center',
// //     marginTop: 4,
// //   },
// //   statusDot: {
// //     width: 8,
// //     height: 8,
// //     borderRadius: 4,
// //     marginRight: 6,
// //   },
// //   apiStatusText: {
// //     fontSize: 10,
// //     color: '#888',
// //   },
// //   testButton: {
// //     marginLeft: 8,
// //     paddingHorizontal: 6,
// //     paddingVertical: 2,
// //     backgroundColor: '#444',
// //     borderRadius: 4,
// //   },
// //   testButtonText: {
// //     fontSize: 8,
// //     color: '#00FF00',
// //   },
// //   weightSection: {
// //     marginTop: 100,
// //     width: '80%'
// //   },
// //   row: {
// //     flexDirection: 'row',
// //     justifyContent: 'space-between',
// //     alignItems: 'center',
// //     marginBottom: 30,
// //   },
// //   label: {
// //     fontSize: 16,
// //     fontWeight: 'bold',
// //     color: '#FF00FF'
// //   },
// //   input: {
// //     width: '40%',
// //     height: 40,
// //     borderRadius: 10,
// //     backgroundColor: '#2D1B3D',
// //     textAlign: 'center',
// //     color: '#00FF00',
// //     fontSize: 16,
// //     borderWidth: 1,
// //     borderColor: '#00FF00'
// //   },
// //   difficultyContainer: {
// //     flexDirection: 'row',
// //     alignItems: 'center',
// //     width: '45%',
// //   },
// //   refreshButton: {
// //     marginLeft: 8,
// //     padding: 8,
// //     borderRadius: 20,
// //     backgroundColor: '#2D1B3D',
// //     borderWidth: 1,
// //     borderColor: '#00FF00',
// //   },
// //   recommendationInfo: {
// //     backgroundColor: 'rgba(45, 27, 61, 0.3)',
// //     padding: 12,
// //     borderRadius: 8,
// //     marginTop: 10,
// //     borderWidth: 1,
// //     borderColor: '#00FF00',
// //   },
// //   recommendationText: {
// //     color: '#00FF00',
// //     fontSize: 12,
// //     textAlign: 'center',
// //     fontStyle: 'italic',
// //   },
// //   debugInfo: {
// //     backgroundColor: 'rgba(255, 0, 255, 0.1)',
// //     padding: 8,
// //     borderRadius: 4,
// //     marginTop: 10,
// //   },
// //   debugText: {
// //     color: '#FF00FF',
// //     fontSize: 10,
// //     textAlign: 'center',
// //   },
// //   dropdownContainer: {
// //     width: '40%',
// //     position: 'relative',
// //   },
// //   dropdownButton: {
// //     height: 40,
// //     borderRadius: 10,
// //     backgroundColor: '#2D1B3D',
// //     borderWidth: 1,
// //     borderColor: '#00FF00',
// //     flexDirection: 'row',
// //     justifyContent: 'space-between',
// //     alignItems: 'center',
// //     paddingHorizontal: 10,
// //   },
// //   dropdownButtonText: {
// //     color: '#00FF00',
// //     fontSize: 14,
// //     flex: 1,
// //     textAlign: 'center',
// //   },
// //   dropdownOverlay: {
// //     position: 'absolute',
// //     top: 0,
// //     left: 0,
// //     right: 0,
// //     bottom: 0,
// //     zIndex: 9998,
// //   },
// //   dropdownList: {
// //     position: 'absolute',
// //     top: '50%',
// //     left: '50%',
// //     transform: [{ translateX: -80 }, { translateY: -60 }],
// //     width: 160,
// //     backgroundColor: '#2D1B3D',
// //     borderRadius: 10,
// //     borderWidth: 1,
// //     borderColor: '#00FF00',
// //     maxHeight: 150,
// //     zIndex: 9999,
// //     elevation: 20,
// //   },
// //   dropdownItem: {
// //     padding: 12,
// //     borderBottomWidth: 1,
// //     borderBottomColor: '#444',
// //   },
// //   dropdownItemText: {
// //     color: '#00FF00',
// //     fontSize: 14,
// //     textAlign: 'center',
// //   },
// //   selectedItem: {
// //     backgroundColor: '#444',
// //   },
// //   selectedItemText: {
// //     color: '#FF00FF',
// //     fontWeight: 'bold',
// //   },
// //   bottomNav: {
// //     position: 'absolute',
// //     bottom: 0,
// //     width: '100%',
// //     height: 70,
// //     backgroundColor: '#2D1B3D',
// //     flexDirection: 'row',
// //     justifyContent: 'space-around',
// //     alignItems: 'center',
// //     borderTopLeftRadius: 20,
// //     borderTopRightRadius: 20,
// //   },
// //   homeIconContainer: {
// //     backgroundColor: '#2D1B3D',
// //     padding: 10,
// //     borderRadius: 30,
// //     marginBottom: 10,
// //   },
// //   button: {
// //     backgroundColor: '#2D1B3D',
// //     paddingVertical: 10,
// //     width: '80%',
// //     borderRadius: 10,
// //     alignItems: 'center',
// //     marginTop: 50,
// //     borderWidth: 1,
// //     borderColor: '#00FF00'
// //   },
// //   buttonText: {
// //     color: '#FF00FF',
// //     fontSize: 18,
// //     fontWeight: 'bold',
// //     textShadowColor: '#FF00FF',
// //     textShadowOffset: { width: 0, height: 0 },
// //     textShadowRadius: 10,
// //   },
// // });

// // export default GameZone;




// import React from 'react';
// import { View, Text, TextInput, Image, StyleSheet, TouchableOpacity, Alert } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
// import { getAuth } from 'firebase/auth';
// import { getDatabase, ref, get, push, set, onValue, off } from 'firebase/database';
// import { useEffect, useState } from 'react';

// const GameZone = ({navigation}) => {

//   const [username, setUsername] = useState('');
//   const [profilePic, setprofilePic] = useState('');
//   const [streakCount, setStreakCount] = useState(0);
//   const [totalSessions, setTotalSessions] = useState(0);
//   const [todaySessionCount, setTodaySessionCount] = useState(0);

//   const profilePictures = {
//     'default.jpg': require('../assets/defaultProfile.jpg'),
//     'girlBlack.jpg': require('../assets/gamerGirlBlack.jpg'),
//     'boyWhite.png': require('../assets/gamerBoyWhite.png'),
//     'kid.png': require('../assets/gamerKid.png'),
//     'girlAsian.png': require('../assets/gamerGirlAsian.png')
//   };
  
//   // Game mode options with recommended option
//   const [gameModeOptions, setGameModeOptions] = useState([
//     { key: 'btc', value: 'Beat the Clock', recommended: true },
//     { key: 'memory', value: 'Memory Game', recommended: false },
//     { key: 'mirror', value: 'Mirror Game', recommended: false }
//   ]);
  
//   // Difficulty level options with recommended option
//   const [difficultyOptions, setDifficultyOptions] = useState([
//     { key: 'easy', value: 'Easy', recommended: true },
//     { key: 'medium', value: 'Medium', recommended: false },
//     { key: 'hard', value: 'Hard', recommended: false }
//   ]);
  
//   // Get recommended options
//   const getRecommendedOption = (options) => {
//     return options.find(option => option.recommended);
//   };
  
//   // State for selected values - default to recommended
//   const [selectedGameMode, setSelectedGameMode] = useState(getRecommendedOption(gameModeOptions)?.key || '');
//   const [selectedDifficulty, setSelectedDifficulty] = useState(getRecommendedOption(difficultyOptions)?.key || '');

//   // Local recommendation logic based on user profile and activity
//   const getRecommendedDifficulty = (userData, streakCount, totalSessions, todaySessionCount) => {
//     // Calculate BMI if available
//     let bmi = userData.bmi;
//     if (!bmi && userData.weight && userData.height) {
//       bmi = userData.weight / ((userData.height / 100) ** 2);
//     }

//     const age = userData.age || 25;
//     const workoutFrequency = userData.workoutFrequency || 0;
//     const restingBPM = userData.restingBPM || 70;

//     // Rule-based recommendation system
//     let difficultyScore = 0;

//     // Age factor (younger = higher difficulty tolerance)
//     if (age < 25) {
//       difficultyScore += 2;
//     } else if (age < 40) {
//       difficultyScore += 1;
//     } else if (age > 55) {
//       difficultyScore -= 1;
//     }

//     // BMI factor (healthier BMI = higher difficulty)
//     if (bmi) {
//       if (bmi >= 18.5 && bmi <= 24.9) {
//         difficultyScore += 2; // Normal BMI
//       } else if (bmi >= 25 && bmi <= 29.9) {
//         difficultyScore += 1; // Overweight
//       } else {
//         difficultyScore -= 1; // Underweight or obese
//       }
//     }

//     // Workout frequency factor (more active = higher difficulty)
//     if (workoutFrequency >= 5) {
//       difficultyScore += 2; // Very active
//     } else if (workoutFrequency >= 3) {
//       difficultyScore += 1; // Moderately active
//     } else if (workoutFrequency <= 1) {
//       difficultyScore -= 1; // Sedentary
//     }

//     // Resting heart rate factor (lower = better fitness = higher difficulty)
//     if (restingBPM < 60) {
//       difficultyScore += 2; // Athlete level
//     } else if (restingBPM < 70) {
//       difficultyScore += 1; // Good fitness
//     } else if (restingBPM > 85) {
//       difficultyScore -= 1; // Poor fitness
//     }

//     // Gaming experience factor (based on total sessions and streak)
//     if (totalSessions >= 20) {
//       difficultyScore += 2; // Experienced player
//     } else if (totalSessions >= 10) {
//       difficultyScore += 1; // Some experience
//     }

//     if (streakCount >= 7) {
//       difficultyScore += 1; // Consistent player
//     }

//     // Today's fatigue factor (multiple sessions today = lower difficulty)
//     if (todaySessionCount >= 3) {
//       difficultyScore -= 2; // Likely fatigued
//     } else if (todaySessionCount >= 2) {
//       difficultyScore -= 1; // Some fatigue
//     }

//     // Determine difficulty based on score
//     if (difficultyScore >= 4) {
//       return 'hard';
//     } else if (difficultyScore >= 1) {
//       return 'medium';
//     } else {
//       return 'easy';
//     }
//   };

//   // Local game mode recommendation logic
//   const getRecommendedGameMode = (userData, streakCount, totalSessions, todaySessionCount) => {
//     const age = userData.age || 25;
    
//     // For new users, always recommend Beat the Clock (beginner-friendly)
//     if (totalSessions < 3) {
//       return 'btc';
//     }

//     // For players with some experience, vary based on profile
//     if (totalSessions >= 10) {
//       // Experienced players - recommend based on age and activity
//       if (age < 30 && todaySessionCount < 2) {
//         return 'mirror'; // More challenging for young, fresh players
//       } else if (streakCount >= 5) {
//         return 'memory'; // Memory game for consistent players
//       }
//     }

//     // Default to Beat the Clock for most cases
//     return 'btc';
//   };

//   // Helper function to calculate streak from session timestamps
//   const calculateStreakFromSessions = (sessions) => {
//     if (!sessions || Object.keys(sessions).length === 0) return 0;

//     const sessionDates = Object.values(sessions)
//       .map(session => {
//         const date = new Date(session.timestamp * 1000);
//         return date.toISOString().split('T')[0];
//       })
//       .filter(date => date);

//     const uniqueDates = [...new Set(sessionDates)].sort().reverse();
    
//     if (uniqueDates.length === 0) return 0;

//     const today = new Date();
//     const todayStr = today.toISOString().split('T')[0];
//     const yesterdayStr = new Date(today.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

//     let streak = 0;
//     let currentDate = new Date(today);
    
//     let startDate = todayStr;
//     if (uniqueDates[0] === yesterdayStr && !uniqueDates.includes(todayStr)) {
//       startDate = yesterdayStr;
//       currentDate = new Date(today.getTime() - 24 * 60 * 60 * 1000);
//     }

//     for (let i = 0; i < uniqueDates.length; i++) {
//       const sessionDate = uniqueDates[i];
//       const expectedDate = currentDate.toISOString().split('T')[0];
      
//       if (sessionDate === expectedDate) {
//         streak++;
//         currentDate.setDate(currentDate.getDate() - 1);
//       } else {
//         break;
//       }
//     }
    
//     return streak;
//   };


//   // Helper function to get today's session count
//   const getTodaySessionCount = (sessions) => {
//     if (!sessions) return 0;
    
//     const today = new Date().toISOString().split('T')[0];
    
//     return Object.values(sessions).filter(session => {
//       const sessionDate = new Date(session.timestamp * 1000).toISOString().split('T')[0];
//       return sessionDate === today;
//     }).length;
//   };

//   // Dynamic status message for GameZone
//   const getGameZoneStatusMessage = () => {
//     if (totalSessions === 0) {
//       return "Ready to start your first gaming session?";
//     } else if (todaySessionCount === 0) {
//       if (streakCount === 0) {
//         return "Time to get back in the game!";
//       } else if (streakCount >= 7) {
//         return `${streakCount}-day streak! Keep the fire burning! 🔥`;
//       } else {
//         return `Day ${streakCount} streak - don't break it now!`;
//       }
//     } else if (todaySessionCount >= 2) {
//       return `${todaySessionCount} sessions today! You're crushing it! 💪`;
//     } else {
//       return "Great session! Ready for another challenge?";
//     }
//   };

//   // Function to create game session
//   const createGameSession = async (userId, userEmail, gameMode, difficulty) => {
//     try {
//       const db = getDatabase();
      
//       // Create session ID using push().key
//       const sessionRef = push(ref(db, 'pendingSessions'));
//       const sessionId = sessionRef.key;
      
//       // Create pending session data
//       const pendingSession = {
//         userId: userId,
//         userEmail: userEmail,
//         gameMode: gameMode,
//         difficulty: difficulty,
//         timestamp: Date.now(),
//         status: 'pending'
//       };
      
//       // Write to pending sessions
//       await set(sessionRef, pendingSession);
      
//       console.log('Game session created:', sessionId);
//       return sessionId;
      
//     } catch (error) {
//       console.error('Error creating game session:', error);
//       throw error;
//     }
//   };

//   // Function to update difficulty recommendations
//   const updateRecommendedDifficulty = (newRecommendedKey) => {
//     setDifficultyOptions(prev => 
//       prev.map(option => ({
//         ...option,
//         recommended: option.key === newRecommendedKey
//       }))
//     );
//     setSelectedDifficulty(newRecommendedKey);
//   };

//   // Function to update game mode recommendations
//   const updateRecommendedGameMode = (newRecommendedKey) => {
//     setGameModeOptions(prev => 
//       prev.map(option => ({
//         ...option,
//         recommended: option.key === newRecommendedKey
//       }))
//     );
//     setSelectedGameMode(newRecommendedKey);
//   };

//   useEffect(() => {
//     const auth = getAuth();
//     const user = auth.currentUser;

//     if (user) {
//       const db = getDatabase();
//       const userRef = ref(db, `users/${user.uid}`);

//       const unsubscribe = onValue(userRef, (snapshot) => {
//         if (snapshot.exists()) {
//           const userData = snapshot.val();
          
//           setUsername(userData.username || 'Player');
//           setprofilePic(userData.profilePicUrl || 'default.jpg');
          
//           let calculatedStreak = 0;
//           let calculatedTodaySessions = 0;
//           let calculatedTotal = 0;

//           if (userData.sessions) {
//             const sessions = userData.sessions;
            
//             // Calculate dynamic values
//             calculatedStreak = calculateStreakFromSessions(sessions);
//             calculatedTodaySessions = getTodaySessionCount(sessions);
//             calculatedTotal = Object.keys(sessions).length;
            
//             setStreakCount(calculatedStreak);
//             setTodaySessionCount(calculatedTodaySessions);
//             setTotalSessions(calculatedTotal);
//           } else {
//             // No sessions data
//             setStreakCount(0);
//             setTodaySessionCount(0);
//             setTotalSessions(0);
//           }
          
//           // Apply local recommendation logic
//           const recommendedDifficulty = getRecommendedDifficulty(
//             userData, 
//             calculatedStreak, 
//             calculatedTotal, 
//             calculatedTodaySessions
//           );
          
//           const recommendedGameMode = getRecommendedGameMode(
//             userData, 
//             calculatedStreak, 
//             calculatedTotal, 
//             calculatedTodaySessions
//           );

//           console.log('Local recommendations:', {
//             difficulty: recommendedDifficulty,
//             gameMode: recommendedGameMode,
//             userStats: {
//               age: userData.age,
//               bmi: userData.bmi,
//               workoutFrequency: userData.workoutFrequency,
//               restingBPM: userData.restingBPM,
//               streak: calculatedStreak,
//               totalSessions: calculatedTotal,
//               todaySessions: calculatedTodaySessions
//             }
//           });

//           updateRecommendedDifficulty(recommendedDifficulty);
//           updateRecommendedGameMode(recommendedGameMode);
//         }
//       });

//       return () => {
//         off(userRef);
//       };
//     }
//   }, []);

//   const buttonScale = useSharedValue(1);

//   const animatedButtonStyle = useAnimatedStyle(() => {
//     return {
//       transform: [{ scale: buttonScale.value }],
//       backgroundColor: buttonScale.value === 1 ? '#2D1B3D' : '#00FF00', // Change color on press
//     };
//   });

//   const handlePressIn = () => {
//     buttonScale.value = withTiming(0.95, { duration: 100 });
//   };

//   const handlePressOut = () => {
//     buttonScale.value = withTiming(1, { duration: 100 });
//     onStartGame();
//   };

//   // Function to handle game start
//   const onStartGame = async () => {
//     try {
//       const auth = getAuth();
//       const user = auth.currentUser;
      
//       if (!user) {
//         Alert.alert('Error', 'Please log in to start a game');
//         return;
//       }

//       const userId = user.uid;
//       const userEmail = user.email;
      
//       // Validate selections
//       if (!selectedGameMode || !selectedDifficulty) {
//         Alert.alert('Error', 'Please select both game mode and difficulty');
//         return;
//       }

//       console.log('Starting game with:', {
//         userId,
//         userEmail,
//         gameMode: selectedGameMode,
//         difficulty: selectedDifficulty
//       });

//       // Create game session
//       const sessionId = await createGameSession(userId, userEmail, selectedGameMode, selectedDifficulty);
      
//       // Navigate to game mode page with session data
//       Alert.alert(
//         'Game Session Created!', 
//         `Your game session has been created. Session ID: ${sessionId}\n\nYou can now start the game on your PC.`,
//         [
//           {
//             text: 'OK',
//             onPress: () => {
//               // Navigate to the game mode page (PuzzleMode handles all game modes)
//               navigation.push('mode', { 
//                 sessionId: sessionId,
//                 gameMode: selectedGameMode,
//                 difficulty: selectedDifficulty 
//               });
//             }
//           }
//         ]
//       );
      
//     } catch (error) {
//       console.error('Error starting game:', error);
//       Alert.alert('Error', 'Failed to start game session. Please try again.');
//     }
//   };

//   const homepage = () => {
//     navigation.push('home');
//   }

//   const progresspage = () => {
//     navigation.push('progress');
//   }

//   const leaderpage = () => {
//     navigation.push('leaderboard');
//   }

//   const settings = () => {
//     navigation.push('setting');
//   }

//   // Custom dropdown component
//   const CustomDropdown = ({ data, placeholder, onSelect, selectedValue }) => {
//     const [isOpen, setIsOpen] = useState(false);
    
//     const selectedOption = data.find(item => item.key === selectedValue);
    
//     return (
//       <>
//         <View style={styles.dropdownContainer}>
//           <TouchableOpacity 
//             style={styles.dropdownButton} 
//             onPress={() => setIsOpen(!isOpen)}
//           >
//             <Text style={styles.dropdownButtonText}>
//               {selectedOption ? selectedOption.value : placeholder}
//               {selectedOption?.recommended && ' ⭐'}
//             </Text>
//             <Ionicons 
//               name={isOpen ? "chevron-up" : "chevron-down"} 
//               size={16} 
//               color="#00FF00" 
//             />
//           </TouchableOpacity>
//         </View>
        
//         {isOpen && (
//           <>
//             <TouchableOpacity 
//               style={styles.dropdownOverlay} 
//               onPress={() => setIsOpen(false)}
//               activeOpacity={1}
//             />
//             <View style={styles.dropdownList}>
//               {data.map((item) => (
//                 <TouchableOpacity
//                   key={item.key}
//                   style={[
//                     styles.dropdownItem,
//                     selectedValue === item.key && styles.selectedItem
//                   ]}
//                   onPress={() => {
//                     onSelect(item.key);
//                     setIsOpen(false);
//                   }}
//                 >
//                   <Text style={[
//                     styles.dropdownItemText,
//                     selectedValue === item.key && styles.selectedItemText
//                   ]}>
//                     {item.value}
//                     {item.recommended && ' ⭐'}
//                   </Text>
//                 </TouchableOpacity>
//               ))}
//             </View>
//           </>
//         )}
//       </>
//     );
//   };

//   return (
//     <View style={styles.container}>
//       {/* Header Section */}
//       <View style={styles.headerBar}>
//         <Text style={styles.headerText}>GAME ZONE</Text>
//               {/* User Info Section */}
//       <View style={styles.userSection}>
//         <Image source={profilePictures[profilePic] } style={styles.profileImage} />
//         <View style={styles.userInfo}>
//           <Text style={styles.username}>{username}</Text>
//           <Text style={styles.userStatus}>{getGameZoneStatusMessage()}</Text>
//         </View>
//       </View>
//       </View>
      
//       {/* Game Configuration */}
//       <View style={styles.weightSection}>
//         <View style={styles.row}>
//           <Text style={styles.label}>Game Mode:</Text>
//           <CustomDropdown
//             data={gameModeOptions}
//             placeholder="Select Game Mode"
//             selectedValue={selectedGameMode}
//             onSelect={setSelectedGameMode}
//           />
//         </View>
//         <View style={styles.row}>
//           <Text style={styles.label}>Difficulty Level</Text>
//           <CustomDropdown
//             data={difficultyOptions}
//             placeholder="Select Difficulty"
//             selectedValue={selectedDifficulty}
//             onSelect={setSelectedDifficulty}
//           />
//         </View>
//         <View style={styles.row}>
//           <Text style={styles.label}>Time Limit:</Text>
//           <TextInput style={styles.input} value="00:10:00" editable={false} />
//         </View>
//       </View>
      
//       {/* Bottom Navigation Bar */}
//       <View style={styles.bottomNav}>
//         <TouchableOpacity onPress={settings}><Ionicons name="settings" size={24} color="black" /></TouchableOpacity>
        
//         <TouchableOpacity onPress={leaderpage}><Ionicons name="bar-chart" size={24} color="black" /></TouchableOpacity>
        

//         <View style={styles.homeIconContainer}>
//         <TouchableOpacity onPress={homepage}><Ionicons name="home" size={28} color="black" /></TouchableOpacity>

//         </View>
//         <Ionicons name="game-controller" size={24} color="#FF00FF" />
//         <TouchableOpacity onPress={progresspage}><Ionicons name="flame" size={24} color="black" /></TouchableOpacity>

//       </View>

//         <Animated.View style={[styles.button, animatedButtonStyle]}>
//           <TouchableOpacity 
//             onPressIn={handlePressIn} 
//             onPressOut={handlePressOut} 
//             // onPress={() => console.log("Button Pressed")}
//           ><Text style={styles.buttonText}>START GAME</Text></TouchableOpacity>
//           </Animated.View>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     alignItems: 'center',
//     justifyContent: 'center',
//     width: '100%'
//   },
//   headerBar: {
//     width: '120%',
//     height: 200,
//     backgroundColor: '#2D1B3D',
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderBottomLeftRadius: 200,
//     borderBottomRightRadius: 200,
//     position: 'absolute',
//     top: 0,
//   },
//   headerText: {
//     color: '#FF00FF',
//     fontSize: 28,
//     fontWeight: 'bold',
//     marginTop: '5%',
//     textShadowColor: '#FF00FF',
//     textShadowOffset: { width: 0, height: 0 },
//     textShadowRadius: 10,
//   },
//   userSection: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     padding: 10,
//     borderRadius: 15,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     marginTop: 10
//   },
//   profileImage: {
//     width: 50,
//     height: 50,
//     borderRadius: 25,
//     backgroundColor: '#D3B3E5',
//   },
//   userInfo: {
//     marginLeft: 10,
//   },
//   username: {
//     fontSize: 16,
//     color: '#00FF00'
//   },
//   userStatus: {
//     fontSize: 12,
//     color: 'gray',
//   },
//   weightSection: {
//     marginTop: 100,
//     width: '80%'
//   },
//   row: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 30,
//   },
//   label: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     color: '#FF00FF'
//   },
//   input: {
//     width: '40%',
//     height: 40,
//     borderRadius: 10,
//     backgroundColor: '#2D1B3D',
//     textAlign: 'center',
//     color: '#00FF00',
//     fontSize: 16,
//     borderWidth: 1,
//     borderColor: '#00FF00'
//   },
//   dropdownContainer: {
//     width: '40%',
//     position: 'relative',
//   },
//   dropdownButton: {
//     height: 40,
//     borderRadius: 10,
//     backgroundColor: '#2D1B3D',
//     borderWidth: 1,
//     borderColor: '#00FF00',
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: 10,
//   },
//   dropdownButtonText: {
//     color: '#00FF00',
//     fontSize: 14,
//     flex: 1,
//     textAlign: 'center',
//   },
//   dropdownOverlay: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     zIndex: 9998,
//   },
//   dropdownList: {
//     position: 'absolute',
//     top: '50%',
//     left: '50%',
//     transform: [{ translateX: -80 }, { translateY: -60 }],
//     width: 160,
//     backgroundColor: '#2D1B3D',
//     borderRadius: 10,
//     borderWidth: 1,
//     borderColor: '#00FF00',
//     maxHeight: 150,
//     zIndex: 9999,
//     elevation: 20,
//   },
//   dropdownItem: {
//     padding: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: '#444',
//   },
//   dropdownItemText: {
//     color: '#00FF00',
//     fontSize: 14,
//     textAlign: 'center',
//   },
//   selectedItem: {
//     backgroundColor: '#444',
//   },
//   selectedItemText: {
//     color: '#FF00FF',
//     fontWeight: 'bold',
//   },
//   bottomNav: {
//     position: 'absolute',
//     bottom: 0,
//     width: '100%',
//     height: 70,
//     backgroundColor: '#2D1B3D',
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//     alignItems: 'center',
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//   },
//   homeIconContainer: {
//     backgroundColor: '#2D1B3D',
//     padding: 10,
//     borderRadius: 30,
//     marginBottom: 10,
//   },
//   button: {
//     backgroundColor: '#2D1B3D',
//     paddingVertical: 10,
//     width: '80%',
//     borderRadius: 10,
//     alignItems: 'center',
//     marginTop: 50,
//     borderWidth: 1,
//     borderColor: '#00FF00'
//   },
//   buttonText: {
//     color: '#FF00FF',
//     fontSize: 18,
//     fontWeight: 'bold',
//     textShadowColor: '#FF00FF',
//     textShadowOffset: { width: 0, height: 0 },
//     textShadowRadius: 10,
//   },
// });

// export default GameZone;











import React from 'react';
import { View, Text, TextInput, Image, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { getAuth } from 'firebase/auth';
import { getDatabase, ref, get, push, set, onValue, off } from 'firebase/database';
import { useEffect, useState } from 'react';

const GameZone = ({navigation}) => {

  const [username, setUsername] = useState('');
  const [profilePic, setprofilePic] = useState('');
  const [streakCount, setStreakCount] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);
  const [todaySessionCount, setTodaySessionCount] = useState(0);
  const [userData, setUserData] = useState(null); // Store user data for status message

  const profilePictures = {
    'default.jpg': require('../assets/defaultProfile.jpg'),
    'girlBlack.jpg': require('../assets/gamerGirlBlack.jpg'),
    'boyWhite.png': require('../assets/gamerBoyWhite.png'),
    'kid.png': require('../assets/gamerKid.png'),
    'girlAsian.png': require('../assets/gamerGirlAsian.png')
  };
  
  // Game mode options with recommended option
  const [gameModeOptions, setGameModeOptions] = useState([
    { key: 'btc', value: 'Beat the Clock', recommended: true },
    { key: 'memory', value: 'Memory Game', recommended: false },
    { key: 'mirror', value: 'Mirror Game', recommended: false }
  ]);
  
  // Difficulty level options with recommended option
  const [difficultyOptions, setDifficultyOptions] = useState([
    { key: 'easy', value: 'Easy', recommended: true },
    { key: 'medium', value: 'Medium', recommended: false },
    { key: 'hard', value: 'Hard', recommended: false }
  ]);
  
  // Get recommended options
  const getRecommendedOption = (options) => {
    return options.find(option => option.recommended);
  };
  
  // State for selected values - default to recommended
  const [selectedGameMode, setSelectedGameMode] = useState(getRecommendedOption(gameModeOptions)?.key || '');
  const [selectedDifficulty, setSelectedDifficulty] = useState(getRecommendedOption(difficultyOptions)?.key || '');

  // Enhanced recommendation logic based on user profile, BMI, and heart rate data
  const getRecommendedDifficulty = (userData, streakCount, totalSessions, todaySessionCount) => {
    // Calculate BMI if available
    let bmi = userData.bmi;
    if (!bmi && userData.weight && userData.height) {
      bmi = userData.weight / ((userData.height / 100) ** 2);
    }

    const age = userData.age || 25;
    const workoutFrequency = userData.workoutFrequency || 0;
    const restingBPM = userData.restingBPM || 70;

    // Calculate average heart rate from previous sessions
    let avgSessionHeartRate = null;
    let heartRateBasedScore = 0;
    
    if (userData.sessions && Object.keys(userData.sessions).length > 0) {
      const sessionsWithHeartRate = Object.values(userData.sessions)
        .filter(session => session.avg_heartrate && session.avg_heartrate > 0);
      
      if (sessionsWithHeartRate.length > 0) {
        const totalHeartRate = sessionsWithHeartRate.reduce((sum, session) => sum + session.avg_heartrate, 0);
        avgSessionHeartRate = totalHeartRate / sessionsWithHeartRate.length;
        
        console.log('Heart rate analysis:', {
          sessionsWithHeartRate: sessionsWithHeartRate.length,
          avgSessionHeartRate: avgSessionHeartRate,
          restingBPM: restingBPM
        });

        // Heart rate based scoring
        if (avgSessionHeartRate) {
          const heartRateIncrease = avgSessionHeartRate - restingBPM;
          
          // Analyze heart rate response to exercise
          if (heartRateIncrease >= 50) {
            // High heart rate response - might indicate lower fitness or high intensity tolerance
            if (heartRateIncrease >= 80) {
              heartRateBasedScore -= 1; // Very high response, suggest easier
            } else {
              heartRateBasedScore += 1; // Good response, can handle medium
            }
          } else if (heartRateIncrease >= 30) {
            heartRateBasedScore += 1; // Normal response
          } else if (heartRateIncrease >= 15) {
            heartRateBasedScore += 2; // Low response, good fitness, can handle harder
          } else {
            // Very low heart rate increase - either very fit or sensor issues
            if (avgSessionHeartRate < 100) {
              heartRateBasedScore += 2; // Likely very fit
            } else {
              heartRateBasedScore += 1; // Moderate response
            }
          }

          // Consider average session heart rate zones
          if (avgSessionHeartRate >= 140) {
            // High intensity zone - user can handle intense workouts
            heartRateBasedScore += 1;
          } else if (avgSessionHeartRate >= 120) {
            // Moderate intensity zone
            heartRateBasedScore += 0;
          } else if (avgSessionHeartRate >= 100) {
            // Light intensity zone - might need easier difficulty
            heartRateBasedScore -= 1;
          }
        }
      }
    }

    // Rule-based recommendation system
    let difficultyScore = 0;

    // Age factor (younger = higher difficulty tolerance)
    if (age < 25) {
      difficultyScore += 2;
    } else if (age < 40) {
      difficultyScore += 1;
    } else if (age > 55) {
      difficultyScore -= 1;
    }

    // BMI factor (healthier BMI = higher difficulty)
    if (bmi) {
      if (bmi >= 18.5 && bmi <= 24.9) {
        difficultyScore += 2; // Normal BMI
      } else if (bmi >= 25 && bmi <= 29.9) {
        difficultyScore += 1; // Overweight
      } else if (bmi >= 30) {
        difficultyScore -= 1; // Obese - easier difficulty
      } else {
        difficultyScore -= 1; // Underweight
      }
    }

    // Add heart rate based score (only if we have session data)
    if (avgSessionHeartRate) {
      difficultyScore += heartRateBasedScore;
      console.log('Heart rate score contribution:', heartRateBasedScore);
    }

    // Workout frequency factor (more active = higher difficulty)
    if (workoutFrequency >= 5) {
      difficultyScore += 2; // Very active
    } else if (workoutFrequency >= 3) {
      difficultyScore += 1; // Moderately active
    } else if (workoutFrequency <= 1) {
      difficultyScore -= 1; // Sedentary
    }

    // Resting heart rate factor (lower = better fitness = higher difficulty)
    if (restingBPM < 60) {
      difficultyScore += 2; // Athlete level
    } else if (restingBPM < 70) {
      difficultyScore += 1; // Good fitness
    } else if (restingBPM > 85) {
      difficultyScore -= 1; // Poor fitness
    }

    // Gaming experience factor (based on total sessions and streak)
    if (totalSessions >= 20) {
      difficultyScore += 2; // Experienced player
    } else if (totalSessions >= 10) {
      difficultyScore += 1; // Some experience
    }

    if (streakCount >= 7) {
      difficultyScore += 1; // Consistent player
    }

    // Today's fatigue factor (multiple sessions today = lower difficulty)
    if (todaySessionCount >= 3) {
      difficultyScore -= 2; // Likely fatigued
    } else if (todaySessionCount >= 2) {
      difficultyScore -= 1; // Some fatigue
    }

    // Performance trend analysis (if we have multiple sessions)
    if (totalSessions >= 3 && userData.sessions) {
      const recentSessions = Object.values(userData.sessions)
        .filter(session => session.avg_heartrate && session.score)
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 5); // Last 5 sessions

      if (recentSessions.length >= 3) {
        // Analyze performance trend
        const avgScore = recentSessions.reduce((sum, session) => sum + (session.score || 0), 0) / recentSessions.length;
        const avgHeartRate = recentSessions.reduce((sum, session) => sum + session.avg_heartrate, 0) / recentSessions.length;
        
        // If consistently high scores with moderate heart rate, increase difficulty
        if (avgScore > 1000 && avgHeartRate < 130) {
          difficultyScore += 1;
        }
        // If low scores with high heart rate, decrease difficulty
        else if (avgScore < 500 && avgHeartRate > 150) {
          difficultyScore -= 1;
        }
      }
    }

    console.log('Difficulty calculation:', {
      totalScore: difficultyScore,
      factors: {
        age: age,
        bmi: bmi,
        avgSessionHeartRate: avgSessionHeartRate,
        restingBPM: restingBPM,
        workoutFrequency: workoutFrequency,
        totalSessions: totalSessions,
        streakCount: streakCount,
        todaySessionCount: todaySessionCount,
        heartRateBasedScore: heartRateBasedScore
      }
    });

    // Determine difficulty based on score
    if (difficultyScore >= 5) {
      return 'hard';
    } else if (difficultyScore >= 2) {
      return 'medium';
    } else {
      return 'easy';
    }
  };

  // Enhanced game mode recommendation with heart rate consideration
  const getRecommendedGameMode = (userData, streakCount, totalSessions, todaySessionCount) => {
    const age = userData.age || 25;
    
    // For new users, always recommend Beat the Clock (beginner-friendly)
    if (totalSessions < 3) {
      return 'btc';
    }

    // Calculate average heart rate from previous sessions
    let avgSessionHeartRate = null;
    if (userData.sessions && Object.keys(userData.sessions).length > 0) {
      const sessionsWithHeartRate = Object.values(userData.sessions)
        .filter(session => session.avg_heartrate && session.avg_heartrate > 0);
      
      if (sessionsWithHeartRate.length > 0) {
        const totalHeartRate = sessionsWithHeartRate.reduce((sum, session) => sum + session.avg_heartrate, 0);
        avgSessionHeartRate = totalHeartRate / sessionsWithHeartRate.length;
      }
    }

    // For players with some experience, vary based on profile and heart rate data
    if (totalSessions >= 10) {
      // If user has low average heart rate during sessions, they might prefer physical games
      if (avgSessionHeartRate && avgSessionHeartRate < 110 && age < 35) {
        return 'mirror'; // Mirror game for users who don't get highly elevated heart rates
      }
      
      // If user has high heart rate response, stick to less physical games
      if (avgSessionHeartRate && avgSessionHeartRate > 140) {
        return 'memory'; // Memory game for users with high heart rate responses
      }
      
      // For experienced players with moderate heart rates
      if (age < 30 && todaySessionCount < 2 && (!avgSessionHeartRate || avgSessionHeartRate < 130)) {
        return 'mirror'; // More challenging for young, fresh players with good heart rate control
      } else if (streakCount >= 5) {
        return 'memory'; // Memory game for consistent players
      }
    }

    // Consider heart rate trends for mode selection
    if (avgSessionHeartRate) {
      if (avgSessionHeartRate > 150 && todaySessionCount >= 1) {
        return 'memory'; // Less physically demanding if already elevated today
      }
    }

    // Default to Beat the Clock for most cases
    return 'btc';
  };

  // Helper function to calculate streak from session timestamps
  const calculateStreakFromSessions = (sessions) => {
    if (!sessions || Object.keys(sessions).length === 0) {
      return 0;
    }

    try {
      // Convert sessions to array and validate timestamps
      const sessionArray = Object.values(sessions)
        .filter(session => {
          // Check if session has timestamp
          if (!session.timestamp) {
            console.warn('Session missing timestamp:', session);
            return false;
          }
          return true;
        })
        .map(session => {
          try {
            let timestamp = session.timestamp;
            
            // Convert to number if it's a string
            if (typeof timestamp === 'string') {
              timestamp = parseInt(timestamp, 10);
            }
            
            // Validate timestamp is a number
            if (isNaN(timestamp) || timestamp <= 0) {
              console.warn('Invalid timestamp:', session.timestamp);
              // Use current date as fallback
              timestamp = Math.floor(Date.now() / 1000);
            }
            
            // Check if timestamp is in seconds (Unix timestamp) - convert to milliseconds
            if (timestamp < 10000000000) { // Less than year 2286 in seconds
              timestamp = timestamp * 1000;
            }
            
            // Validate the timestamp range (reasonable dates)
            const minDate = new Date('2020-01-01').getTime(); // Minimum reasonable date
            const maxDate = new Date('2030-12-31').getTime(); // Maximum reasonable date
            
            if (timestamp < minDate || timestamp > maxDate) {
              console.warn('Timestamp out of reasonable range:', timestamp);
              // Use current date as fallback
              timestamp = Date.now();
            }
            
            // Create date and validate it
            const date = new Date(timestamp);
            if (isNaN(date.getTime())) {
              console.warn('Invalid date created from timestamp:', timestamp);
              // Use current date as fallback
              date = new Date();
            }
            
            return {
              ...session,
              date: date.toISOString().split('T')[0], // YYYY-MM-DD format
              validTimestamp: true
            };
            
          } catch (error) {
            console.error('Error processing session timestamp:', session.timestamp, error);
            
            // Return session with current date as fallback
            return {
              ...session,
              date: new Date().toISOString().split('T')[0],
              validTimestamp: false
            };
          }
        })
        .filter(session => session.validTimestamp) // Only keep sessions with valid timestamps
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      if (sessionArray.length === 0) {
        console.log('No valid sessions found for streak calculation');
        return 0;
      }

      // Calculate streak
      let currentStreak = 1;
      let maxStreak = 1;
      
      for (let i = 1; i < sessionArray.length; i++) {
        const currentDate = new Date(sessionArray[i].date);
        const previousDate = new Date(sessionArray[i - 1].date);
        
        // Calculate days difference
        const diffTime = Math.abs(currentDate - previousDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          // Consecutive day
          currentStreak++;
          maxStreak = Math.max(maxStreak, currentStreak);
        } else if (diffDays > 1) {
          // Break in streak
          currentStreak = 1;
        }
        // If diffDays === 0, it's the same day, so don't reset streak
      }
      
      console.log('Calculated streak:', maxStreak, 'from', sessionArray.length, 'valid sessions');
      return maxStreak;
      
    } catch (error) {
      console.error('Error calculating streak from sessions:', error);
      return 0;
    }
  };

  // Helper function to get today's session count
  const getTodaySessionCount = (sessions) => {
    if (!sessions) return 0;
    
    const today = new Date().toISOString().split('T')[0];
    
    return Object.values(sessions).filter(session => {
      try {
        let timestamp = session.timestamp;
        if (typeof timestamp === 'string') {
          timestamp = parseInt(timestamp, 10);
        }
        if (timestamp < 10000000000) {
          timestamp = timestamp * 1000;
        }
        const sessionDate = new Date(timestamp).toISOString().split('T')[0];
        return sessionDate === today;
      } catch (error) {
        return false;
      }
    }).length;
  };

  // Enhanced status message that considers heart rate data
  const getGameZoneStatusMessage = () => {
    if (totalSessions === 0) {
      return "Ready to start your first gaming session?";
    } 
    
    // Check if user has heart rate data
    let hasHeartRateData = false;
    let avgHeartRate = null;
    
    if (userData && userData.sessions) {
      const sessionsWithHeartRate = Object.values(userData.sessions)
        .filter(session => session.avg_heartrate && session.avg_heartrate > 0);
      
      if (sessionsWithHeartRate.length > 0) {
        hasHeartRateData = true;
        const totalHeartRate = sessionsWithHeartRate.reduce((sum, session) => sum + session.avg_heartrate, 0);
        avgHeartRate = Math.round(totalHeartRate / sessionsWithHeartRate.length);
      }
    }
    
    if (todaySessionCount === 0) {
      if (streakCount === 0) {
        return hasHeartRateData ? 
          `Time to get back in the game! Last avg HR: ${avgHeartRate} BPM` : 
          "Time to get back in the game!";
      } else if (streakCount >= 7) {
        return `${streakCount}-day streak! Keep the fire burning! 🔥`;
      } else {
        return `Day ${streakCount} streak - don't break it now!`;
      }
    } else if (todaySessionCount >= 2) {
      return hasHeartRateData ? 
        `${todaySessionCount} sessions today! Avg HR: ${avgHeartRate} BPM 💪` : 
        `${todaySessionCount} sessions today! You're crushing it! 💪`;
    } else {
      return hasHeartRateData ? 
        `Great session! Last HR: ${avgHeartRate} BPM. Ready for more?` : 
        "Great session! Ready for another challenge?";
    }
  };

  // Function to create game session
  const createGameSession = async (userId, userEmail, gameMode, difficulty) => {
    try {
      const db = getDatabase();
      
      // Create session ID using push().key
      const sessionRef = push(ref(db, 'pendingSessions'));
      const sessionId = sessionRef.key;
      
      // Create pending session data
      const pendingSession = {
        userId: userId,
        userEmail: userEmail,
        gameMode: gameMode,
        difficulty: difficulty,
        timestamp: Date.now(),
        status: 'pending'
      };
      
      // Write to pending sessions
      await set(sessionRef, pendingSession);
      
      console.log('Game session created:', sessionId);
      return sessionId;
      
    } catch (error) {
      console.error('Error creating game session:', error);
      throw error;
    }
  };

  // Function to update difficulty recommendations
  const updateRecommendedDifficulty = (newRecommendedKey) => {
    setDifficultyOptions(prev => 
      prev.map(option => ({
        ...option,
        recommended: option.key === newRecommendedKey
      }))
    );
    setSelectedDifficulty(newRecommendedKey);
  };

  // Function to update game mode recommendations
  const updateRecommendedGameMode = (newRecommendedKey) => {
    setGameModeOptions(prev => 
      prev.map(option => ({
        ...option,
        recommended: option.key === newRecommendedKey
      }))
    );
    setSelectedGameMode(newRecommendedKey);
  };

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (user) {
      const db = getDatabase();
      const userRef = ref(db, `users/${user.uid}`);

      const unsubscribe = onValue(userRef, (snapshot) => {
        if (snapshot.exists()) {
          const userData = snapshot.val();
          setUserData(userData); // Store user data for status message
          
          setUsername(userData.username || 'Player');
          setprofilePic(userData.profilePicUrl || 'default.jpg');
          
          let calculatedStreak = 0;
          let calculatedTodaySessions = 0;
          let calculatedTotal = 0;

          if (userData.sessions) {
            const sessions = userData.sessions;
            
            // Calculate dynamic values
            calculatedStreak = calculateStreakFromSessions(sessions);
            calculatedTodaySessions = getTodaySessionCount(sessions);
            calculatedTotal = Object.keys(sessions).length;
            
            setStreakCount(calculatedStreak);
            setTodaySessionCount(calculatedTodaySessions);
            setTotalSessions(calculatedTotal);
          } else {
            // No sessions data
            setStreakCount(0);
            setTodaySessionCount(0);
            setTotalSessions(0);
          }
          
          // Apply enhanced recommendation logic with heart rate data
          const recommendedDifficulty = getRecommendedDifficulty(
            userData, 
            calculatedStreak, 
            calculatedTotal, 
            calculatedTodaySessions
          );
          
          const recommendedGameMode = getRecommendedGameMode(
            userData, 
            calculatedStreak, 
            calculatedTotal, 
            calculatedTodaySessions
          );

          console.log('Enhanced recommendations:', {
            difficulty: recommendedDifficulty,
            gameMode: recommendedGameMode,
            userStats: {
              age: userData.age,
              bmi: userData.bmi,
              workoutFrequency: userData.workoutFrequency,
              restingBPM: userData.restingBPM,
              streak: calculatedStreak,
              totalSessions: calculatedTotal,
              todaySessions: calculatedTodaySessions,
              hasHeartRateData: userData.sessions ? Object.values(userData.sessions).some(s => s.avg_heartrate) : false
            }
          });

          updateRecommendedDifficulty(recommendedDifficulty);
          updateRecommendedGameMode(recommendedGameMode);
        }
      });

      return () => {
        off(userRef);
      };
    }
  }, []);

  const buttonScale = useSharedValue(1);

  const animatedButtonStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: buttonScale.value }],
      backgroundColor: buttonScale.value === 1 ? '#2D1B3D' : '#00FF00', // Change color on press
    };
  });

  const handlePressIn = () => {
    buttonScale.value = withTiming(0.95, { duration: 100 });
  };

  const handlePressOut = () => {
    buttonScale.value = withTiming(1, { duration: 100 });
    onStartGame();
  };

  // Function to handle game start
  const onStartGame = async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user) {
        Alert.alert('Error', 'Please log in to start a game');
        return;
      }

      const userId = user.uid;
      const userEmail = user.email;
      
      // Validate selections
      if (!selectedGameMode || !selectedDifficulty) {
        Alert.alert('Error', 'Please select both game mode and difficulty');
        return;
      }

      console.log('Starting game with:', {
        userId,
        userEmail,
        gameMode: selectedGameMode,
        difficulty: selectedDifficulty
      });

      // Create game session
      const sessionId = await createGameSession(userId, userEmail, selectedGameMode, selectedDifficulty);
      
      // Navigate to game mode page with session data
      Alert.alert(
        'Game Session Created!', 
        `Your game session has been created. Session ID: ${sessionId}\n\nYou can now start the game on your PC.`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate to the game mode page (PuzzleMode handles all game modes)
              navigation.push('mode', { 
                sessionId: sessionId,
                gameMode: selectedGameMode,
                difficulty: selectedDifficulty 
              });
            }
          }
        ]
      );
      
    } catch (error) {
      console.error('Error starting game:', error);
      Alert.alert('Error', 'Failed to start game session. Please try again.');
    }
  };

  const homepage = () => {
    navigation.push('home');
  }

  const progresspage = () => {
    navigation.push('progress');
  }

  const leaderpage = () => {
    navigation.push('leaderboard');
  }

  const settings = () => {
    navigation.push('setting');
  }

  // Custom dropdown component
  const CustomDropdown = ({ data, placeholder, onSelect, selectedValue }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    const selectedOption = data.find(item => item.key === selectedValue);
    
    return (
      <>
        <View style={styles.dropdownContainer}>
          <TouchableOpacity 
            style={styles.dropdownButton} 
            onPress={() => setIsOpen(!isOpen)}
          >
            <Text style={styles.dropdownButtonText}>
              {selectedOption ? selectedOption.value : placeholder}
              {selectedOption?.recommended && ' ⭐'}
            </Text>
            <Ionicons 
              name={isOpen ? "chevron-up" : "chevron-down"} 
              size={16} 
              color="#00FF00" 
            />
          </TouchableOpacity>
        </View>
        
        {isOpen && (
          <>
            <TouchableOpacity 
              style={styles.dropdownOverlay} 
              onPress={() => setIsOpen(false)}
              activeOpacity={1}
            />
            <View style={styles.dropdownList}>
              {data.map((item) => (
                <TouchableOpacity
                  key={item.key}
                  style={[
                    styles.dropdownItem,
                    selectedValue === item.key && styles.selectedItem
                  ]}
                  onPress={() => {
                    onSelect(item.key);
                    setIsOpen(false);
                  }}
                >
                  <Text style={[
                    styles.dropdownItemText,
                    selectedValue === item.key && styles.selectedItemText
                  ]}>
                    {item.value}
                    {item.recommended && ' ⭐'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.headerBar}>
        <Text style={styles.headerText}>GAME ZONE</Text>
              {/* User Info Section */}
      <View style={styles.userSection}>
        <Image source={profilePictures[profilePic] } style={styles.profileImage} />
        <View style={styles.userInfo}>
          <Text style={styles.username}>{username}</Text>
          <Text style={styles.userStatus}>{getGameZoneStatusMessage()}</Text>
        </View>
      </View>
      </View>
      
      {/* Game Configuration */}
      <View style={styles.weightSection}>
        <View style={styles.row}>
          <Text style={styles.label}>Game Mode:</Text>
          <CustomDropdown
            data={gameModeOptions}
            placeholder="Select Game Mode"
            selectedValue={selectedGameMode}
            onSelect={setSelectedGameMode}
          />
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Difficulty Level</Text>
          <CustomDropdown
            data={difficultyOptions}
            placeholder="Select Difficulty"
            selectedValue={selectedDifficulty}
            onSelect={setSelectedDifficulty}
          />
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Time Limit:</Text>
          <TextInput style={styles.input} value="00:10:00" editable={false} />
        </View>
      </View>
      
      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity onPress={settings}><Ionicons name="settings" size={24} color="black" /></TouchableOpacity>
        
        <TouchableOpacity onPress={leaderpage}><Ionicons name="bar-chart" size={24} color="black" /></TouchableOpacity>
        

        <View style={styles.homeIconContainer}>
        <TouchableOpacity onPress={homepage}><Ionicons name="home" size={28} color="black" /></TouchableOpacity>

        </View>
        <Ionicons name="game-controller" size={24} color="#FF00FF" />
        <TouchableOpacity onPress={progresspage}><Ionicons name="flame" size={24} color="black" /></TouchableOpacity>

      </View>

        <Animated.View style={[styles.button, animatedButtonStyle]}>
          <TouchableOpacity 
            onPressIn={handlePressIn} 
            onPressOut={handlePressOut} 
            // onPress={() => console.log("Button Pressed")}
          ><Text style={styles.buttonText}>START GAME</Text></TouchableOpacity>
          </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%'
  },
  headerBar: {
    width: '120%',
    height: 200,
    backgroundColor: '#2D1B3D',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomLeftRadius: 200,
    borderBottomRightRadius: 200,
    position: 'absolute',
    top: 0,
  },
  headerText: {
    color: '#FF00FF',
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: '5%',
    textShadowColor: '#FF00FF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginTop: 10
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#D3B3E5',
  },
  userInfo: {
    marginLeft: 10,
  },
  username: {
    fontSize: 16,
    color: '#00FF00'
  },
  userStatus: {
    fontSize: 12,
    color: 'gray',
  },
  weightSection: {
    marginTop: 100,
    width: '80%'
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF00FF'
  },
  input: {
    width: '40%',
    height: 40,
    borderRadius: 10,
    backgroundColor: '#2D1B3D',
    textAlign: 'center',
    color: '#00FF00',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#00FF00'
  },
  dropdownContainer: {
    width: '40%',
    position: 'relative',
  },
  dropdownButton: {
    height: 40,
    borderRadius: 10,
    backgroundColor: '#2D1B3D',
    borderWidth: 1,
    borderColor: '#00FF00',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  dropdownButtonText: {
    color: '#00FF00',
    fontSize: 14,
    flex: 1,
    textAlign: 'center',
  },
  dropdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9998,
  },
  dropdownList: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -80 }, { translateY: -60 }],
    width: 160,
    backgroundColor: '#2D1B3D',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#00FF00',
    maxHeight: 150,
    zIndex: 9999,
    elevation: 20,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  dropdownItemText: {
    color: '#00FF00',
    fontSize: 14,
    textAlign: 'center',
  },
  selectedItem: {
    backgroundColor: '#444',
  },
  selectedItemText: {
    color: '#FF00FF',
    fontWeight: 'bold',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: 70,
    backgroundColor: '#2D1B3D',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  homeIconContainer: {
    backgroundColor: '#2D1B3D',
    padding: 10,
    borderRadius: 30,
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#2D1B3D',
    paddingVertical: 10,
    width: '80%',
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 50,
    borderWidth: 1,
    borderColor: '#00FF00'
  },
  buttonText: {
    color: '#FF00FF',
    fontSize: 18,
    fontWeight: 'bold',
    textShadowColor: '#FF00FF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
});

export default GameZone;