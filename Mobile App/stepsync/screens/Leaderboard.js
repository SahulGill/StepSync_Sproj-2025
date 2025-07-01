import React from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAuth } from 'firebase/auth';
import { getDatabase, ref, onValue, off } from 'firebase/database';
import { useEffect, useState } from 'react';

const getRankIcon = (rank) => {
  switch (rank) {
    case 1:
      return 'medal';
    case 2:
      return 'medal-outline';
    case 3:
      return 'trophy-outline';
    default:
      return 'walk-outline';
  }
};

const getLatestSession = (userData) => {
  if (!userData || !userData.sessions || typeof userData.sessions !== 'object') return null;

  const sessions = userData.sessions;
  let latestSession = null;
  let latestTimestamp = 0;

  // Iterate through all sessions under the sessions node
  Object.keys(sessions).forEach(sessionKey => {
    const session = sessions[sessionKey];
    
    if (session && typeof session === 'object' && session.score !== undefined) {
      const sessionTimestamp = session.timestamp || 0;
      
      // Keep track of the session with the latest timestamp
      if (sessionTimestamp > latestTimestamp) {
        latestTimestamp = sessionTimestamp;
        latestSession = {
          sessionKey: sessionKey,
          score: session.score,
          timestamp: session.timestamp,
          gameMode: session.gameMode,
          difficulty: session.difficulty,
          duration: session.duration
        };
      }
    }
  });

  return latestSession;
};

const formatScore = (score) => {
  if (score === null || score === undefined) return '0';
  return score.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

const getProgressPercentage = (score, maxScore) => {
  if (!score || !maxScore) return 0;
  return Math.min((score / maxScore) * 100, 100);
};

const Leaderboard = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState(0);
  const [userScore, setUserScore] = useState(0);
  const [profilePic, setprofilePic] = useState('');

  const profilePictures = {
    'default.jpg': require('../assets/defaultProfile.jpg'),
    'girlBlack.jpg': require('../assets/gamerGirlBlack.jpg'),
    'boyWhite.png': require('../assets/gamerBoyWhite.png'),
    'kid.png': require('../assets/gamerKid.png'),
    'girlAsian.png': require('../assets/gamerGirlAsian.png')
  };

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (user) {
      setCurrentUserId(user.uid);

      const db = getDatabase();
      const usersRef = ref(db, 'users');

      const unsubscribe = onValue(usersRef, (snapshot) => {
        if (snapshot.exists()) {
          const usersData = snapshot.val();
          const currentUserData = usersData[user.uid];
          
          if (currentUserData) {
            setUsername(currentUserData.username || 'Unknown User');
            setprofilePic(currentUserData.profilePicUrl || 'default.jpg');
          }

          const usersArray = Object.keys(usersData).map((userId) => {
            const userData = usersData[userId];
            let latestScore = 0;
            let hasSession = false;

            // Get the latest session from this user's data
            const latestSession = getLatestSession(userData);
            
            if (latestSession && latestSession.score != null) {
              latestScore = Number(latestSession.score);
              hasSession = true;
            }

            return {
              id: userId,
              name: userData.username || 'Unknown User',
              score: latestScore,
              profileImage: userData.profilePicUrl || 'default.jpg',
              hasSession: hasSession,
            };
          });

          // Sort users by score (highest first)
          const sortedUsers = usersArray.sort((a, b) => {
            const aScore = a.score || 0;
            const bScore = b.score || 0;
            return bScore - aScore;
          });

          // Add rank to each user
          const rankedUsers = sortedUsers.map((user, index) => ({
            ...user,
            rank: index + 1,
            isCurrentUser: user.id === currentUserId,
          }));

          // Find current user's rank and score
          const currentUser = rankedUsers.find(
            (user) => user.id === currentUserId
          );
          if (currentUser) {
            setUserRank(currentUser.rank);
            setUserScore(currentUser.score ?? 0);
          }

          setLeaderboardData(rankedUsers);
          setLoading(false);
        } else {
          setLoading(false);
        }
      });

      return () => {
        off(usersRef);
      };
    }
  }, [currentUserId]);

  const homepage = () => navigation.push('home');
  const progresspage = () => navigation.push('progress');
  const Zonepage = () => navigation.push('gamezone');
  const settings = () => navigation.push('setting');

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#FF00FF" />
        <Text style={styles.loadingText}>Loading Leaderboard...</Text>
      </View>
    );
  }

  const maxScore =
    leaderboardData.length > 0 && leaderboardData[0].score
      ? leaderboardData[0].score
      : 1;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerBar}>
        <Text style={styles.headerText}>🏆 LEADERBOARD</Text>
        <View style={styles.userSection}>
          <Image source={profilePictures[profilePic]} style={styles.profileImage} />
          <View style={styles.userInfo}>
            <Text style={styles.username}>{username}</Text>
            <Text style={styles.userStatus}>
              Rank #{userRank} | Score: {formatScore(userScore)}
            </Text>
          </View>
        </View>
      </View>

      {/* Leaderboard Content */}
      <ScrollView style={styles.leaderboardContainer}>
        {leaderboardData.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No users found</Text>
          </View>
        ) : (
          leaderboardData.map((item) => (
            <View
              key={item.id}
              style={[
                styles.leaderboardItem,
                item.isCurrentUser && styles.highlightSelf,
              ]}
            >
              <Ionicons
                name={getRankIcon(item.rank)}
                size={20}
                color={item.rank <= 3 ? '#FFD700' : '#fff'}
                style={styles.rankIcon}
              />
              <Text style={styles.rankText}>{item.rank}.</Text>
              <Image 
                source={profilePictures[item.profileImage] || profilePictures['default.jpg']} 
                style={styles.avatar} 
              />
              <Text style={styles.name}>
                {item.isCurrentUser ? 'YOU' : item.name}
              </Text>
              <View style={styles.scoreSection}>
                <Text style={styles.score}>
                  Score: {formatScore(item.score)}
                </Text>
                {/* {item.score === 0 && !item.hasSession && (
                  <Text style={styles.noSessionText}>No games played</Text>
                )} */}

                <View style={styles.progressBarBg}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${getProgressPercentage(
                          item.score,
                          maxScore
                        )}%`,
                      },
                    ]}
                  />
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Bottom Nav */}
      <View style={styles.bottomNav}>
        <TouchableOpacity onPress={settings}>
          <Ionicons name="settings" size={24} color="black" />
        </TouchableOpacity>

        <Ionicons name="bar-chart" size={24} color="#FF00FF" />

        <View style={styles.homeIconContainer}>
          <TouchableOpacity onPress={homepage}>
            <Ionicons name="home" size={28} color="black" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={Zonepage}>
          <Ionicons name="game-controller" size={24} color="black" />
        </TouchableOpacity>

        <TouchableOpacity onPress={progresspage}>
          <Ionicons name="flame" size={24} color="black" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  loadingText: {
    color: '#FF00FF',
    fontSize: 16,
    marginTop: 10,
  },
  headerBar: {
    width: '100%',
    height: 200,
    backgroundColor: '#2D1B3D',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomLeftRadius: 150,
    borderBottomRightRadius: 150,
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
    marginTop: 10,
    padding: 10,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    color: '#00FF00',
    fontWeight: 'bold',
  },
  userStatus: {
    fontSize: 12,
    color: '#ccc',
  },
  leaderboardContainer: {
    paddingHorizontal: 20,
    marginTop: '60%',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    color: '#FF00FF',
    fontSize: 16,
  },
  leaderboardItem: {
    backgroundColor: '#2D1B3D',
    marginVertical: 10,
    padding: 15,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: '#00FF00',
  },
  highlightSelf: {
    borderColor: '#FFD700',
    borderWidth: 2,
    backgroundColor: '#3D2B4D',
  },
  rankIcon: {
    marginRight: 6,
  },
  rankText: {
    fontSize: 16,
    color: '#FF00FF',
    marginRight: 6,
    width: 24,
    fontWeight: 'bold',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  name: {
    flex: 1,
    color: '#FF00FF',
    fontSize: 16,
    fontWeight: item => item?.isCurrentUser ? 'bold' : 'normal',
  },
  stepSection: {
    alignItems: 'flex-end',
  },
  steps: {
    color: '#00FF00',
    fontSize: 14,
    marginBottom: 4,
    fontWeight: 'bold',
  },
  progressBarBg: {
    backgroundColor: '#fff',
    width: 100,
    height: 6,
    borderRadius: 4,
  },
  progressBarFill: {
    backgroundColor: '#FF00FF',
    height: 6,
    borderRadius: 4,
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
  score: {
    color: 'white',
  },
  scoreSection: {
    alignContent: 'flex-start'
  },
  noSessionText: {
    color: 'grey'
  }
});


export default Leaderboard;