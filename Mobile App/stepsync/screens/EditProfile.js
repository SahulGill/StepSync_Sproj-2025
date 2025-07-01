import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useEffect } from 'react';
import { get, ref } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { update } from 'firebase/database';
import { Alert } from 'react-native';
import { SelectList } from 'react-native-dropdown-select-list';
import { AntDesign } from '@expo/vector-icons';

const EditProfile = ({navigation}) => {
  const genders = [
      {key:'1', value:'Male'},
      {key:'2', value:'Female'},
      {key:'3', value:'Prefer not to say'}
  ];

  const handleAgeChange = (text) => {
      const numericValue = text.replace(/[^0-9]/g, '');
      setAge(numericValue);
  };

  const handleWeightChange = (text) => {
      const numericValue = text.replace(/[^0-9.]/g, '');
      setWeight(numericValue);
  };

  const handleHeightFTChange = (text) => {
      const numericValue = text.replace(/[^0-9]/g, '');
      setHeightFT(numericValue);
  };

  const handleHeightINChange = (text) => {
      const numericValue = text.replace(/[^0-9]/g, '');
      setHeightIN(numericValue);
  };

  const handleAgeBlur = () => {
      const numeric = age.replace(/[^0-9]/g, '');
      if (numeric) {
          if (!validateAge(numeric)) {
              Alert.alert("Invalid Age", "Age must be between 3 and 100 years");
              setAge("");
          } else {
              setAge(numeric + ' years');
          }
      }
  };

  const handleWeightBlur = () => {
      const numeric = weight.replace(/[^0-9.]/g, '');
      if (numeric) {
          if (!validateWeight(numeric)) {
              Alert.alert("Invalid Weight", "Weight must be between 13 and 200 kg");
              setWeight(""); 
          } else {
              setWeight(numeric + ' kg');
          }
      }
  };

  const handleHeightFTBlur = () => {
      const ft = heightFT.replace(/[^0-9]/g, '');
      const inches = heightIN.replace(/[^0-9]/g, '') || '0';
      if (ft) {
          if (!validateHeight(ft, inches)) {
              Alert.alert("Invalid Height", "Feet must be between 3 and 8.");
              setHeightFT("");
          } else {
              setHeightFT(ft + ' ft');
          }
      }
  };

  const handleHeightINBlur = () => {
      const inches = heightIN.replace(/[^0-9]/g, '');
      const ft = heightFT.replace(/[^0-9]/g, '') || '0';
      if (inches) {
          if (!validateHeight(ft, inches)) {
              Alert.alert("Invalid Height", "Inches must be between 0 and 11.");
              setHeightIN("");
          } else {
              setHeightIN(inches + ' in');
          }
      }
  };

  const handleAgeFocus = () => {
      const numericValue = age.replace(/[^0-9]/g, '');
      setAge(numericValue);
  };

  const handleWeightFocus = () => {
      const numericValue = weight.replace(/[^0-9.]/g, '');
      setWeight(numericValue);
  };

  const handleHeightFTFocus = () => {
      const numericValue = heightFT.replace(/[^0-9]/g, '');
      setHeightFT(numericValue);
  };

  const handleHeightINFocus = () => {
      const numericValue = heightIN.replace(/[^0-9]/g, '');
      setHeightIN(numericValue);
  };

  const bmi_calculator = (weight, heightFT, heightIN) => {
    const height = ((heightFT * 12) + heightIN) * 0.0254
    return parseFloat((weight / (height ** 2)).toFixed(2));
  };

  const validateAge = (value) => {
      const numericValue = typeof value === 'string' ? value.replace(/[^0-9]/g, '') : value.toString();
      const ageNum = parseInt(numericValue);
      return ageNum >= 3 && ageNum <= 100;
  };

  const validateWeight = (value) => {
      const numericValue = typeof value === 'string' ? value.replace(/[^0-9.]/g, '') : value.toString();
      const weightNum = parseFloat(numericValue);
      return weightNum >= 13 && weightNum <= 200;
  };

  const validateHeight = (ft, inches) => {
      const ftValue = typeof ft === 'string' ? ft.replace(/[^0-9]/g, '') : ft.toString();
      const inValue = typeof inches === 'string' ? inches.replace(/[^0-9]/g, '') : inches.toString();
      
      const ftNum = parseInt(ftValue);
      const inNum = parseInt(inValue);
      
      return (ftNum >= 3 && ftNum <= 8) && (inNum >= 0 && inNum <= 11);
  };

  const buttonScale = useSharedValue(1);

  const animatedButtonStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: buttonScale.value }],
      backgroundColor: buttonScale.value === 1 ? '#2D1B3D' : '#00FF00', 
    };
  });

  const handlePressIn = () => {
    buttonScale.value = withTiming(0.95, { duration: 100 });
  };

  const handlePressOut = () => {
    buttonScale.value = withTiming(1, { duration: 100 });
    // navigation.goBack()

    if (isEditing){
      handleSubmit();
      setIsEditing(false);
    }

    else {
      (setIsEditing(true));
    }
  };

  const back = () => {
    navigation.goBack();
  }

  const profilePictures = {
    'default.jpg': require('../assets/defaultProfile.jpg'),
    'girlBlack.jpg': require('../assets/gamerGirlBlack.jpg'),
    'boyWhite.png': require('../assets/gamerBoyWhite.png'),
    'kid.png': require('../assets/gamerKid.png'),
    'girlAsian.png': require('../assets/gamerGirlAsian.png')
  };

  const [profilePic, setProfilePic] = useState('');
  const [username, setUsername] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [weight, setWeight] = useState('');
  const [heightFT, setHeightFT] = useState('');
  const [heightIN, setHeightIN] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  const [isEditing, setIsEditing] = useState(false);

  const handleSelectPicture = (pic) => {
  setProfilePic(pic);
  setModalVisible(false);
  };

  const getProfilePicture = (genderValue) => {
      if (genderValue === "Female") return "girlAsian.png";
      if (genderValue === "Male") return "boyWhite.png";
      return "default.jpg";
  };


  useEffect(() => {
    const fetchUserData = async () => {
      const auth = getAuth();
      const user = auth.currentUser;

      if (user) {
        const uid = user.uid;
        const db = getDatabase();
        const snapshot = await get(ref(db, `users/${uid}`));

        if (snapshot.exists()) {
          const data = snapshot.val();
          setProfilePic(data.profilePicUrl);
          setUsername(data.username);
          setGender(data.gender);
          setAge(data.age + ' years');
          setWeight(data.weight_kg + ' kg');
          setHeightFT(data.height_ft + ' ft');
          setHeightIN(data.height_in + ' in');
        }
      }
    };

    fetchUserData();
    }, []);

  const handleSubmit = async () => {

    const profile = getProfilePicture(gender);
    const auth = getAuth();
    const user = auth.currentUser;

    if (user) {
      const uid = user.uid;
      const db = getDatabase();

      const ageValue = age.replace(/[^0-9]/g, '');
      const weightValue = weight.replace(/[^0-9.]/g, '');
      const heightFTValue = heightFT.replace(/[^0-9]/g, '');
      const heightINValue = heightIN.replace(/[^0-9]/g, '');

      if (!username.trim()) {
          Alert.alert("Missing Information", "Please enter a username");
          return;
      }

      if (username.length < 3) {
          Alert.alert("Invalid Username", "Username must be at least 3 characters long");
          return;
      }

      if (!ageValue) {
          Alert.alert("Missing Information", "Please enter your age");
          return;
      }

      if (!gender) {
          Alert.alert("Missing Information", "Please select your gender");
          return;
      }

      if (!weightValue) {
          Alert.alert("Missing Information", "Please enter your weight");
          return;
      }

      if (!heightFTValue || !heightINValue) {
          Alert.alert("Missing Information", "Please enter both feet and inches for height");
          return;
      }

      if (!validateAge(ageValue)) {
          Alert.alert("Invalid Age", "Age must be between 3 and 100 years");
          return;
      }

      if (!validateWeight(weightValue)) {
          Alert.alert("Invalid Weight", "Weight must be between 13 and 200 kg");
          return;
      }

      if (!validateHeight(heightFTValue, heightINValue)) {
          Alert.alert("Invalid Height", "Height must be between 3-8 feet and 0-11 inches");
          return;
      }

      const ageNum = Number(ageValue);
      const weightNum = Number(weightValue);
      const heightFTNum = Number(heightFTValue);
      const heightINNum = Number(heightINValue);

      const bmi = bmi_calculator(weightNum,heightFTNum,heightINNum);

      const updatedData = {
        username,
        age: ageNum,
        gender,
        bmi,
        profilePicUrl: profile,
        weight_kg: weightNum,
        height_ft: heightFTNum,
        height_in: heightINNum,
      };

      try {
        await update(ref(db, `users/${uid}`), updatedData);
        Alert.alert('Successful', 'Saved Changes!', [{ text: 'Continue' }]);
        setIsEditing(false);

      }
      
      catch (error) {
        console.error("Failed to update profile:", error);

      }
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={back}><Ionicons name="arrow-back" size={24} color="white" style={styles.backIcon} /></TouchableOpacity>
        <Text style={styles.headerText}>Edit Profile</Text>
      </View>
      
      <View style={styles.profileSection}>
        <View style={styles.profileImageContainer}>
          <Image source={profilePictures[profilePic] } style={styles.profileImage} />
        </View>
      </View>


        <Text style={styles.label}>Username</Text>
        <TextInput style={styles.input} value={username} onChangeText={setUsername} maxLength={20} editable={isEditing} />

      
      <View style={styles.row}>
        <View style={styles.column}>
          <Text style={styles.label}>Age:</Text>
          <TextInput style={styles.smallInput} 
            value={age} 
            onChangeText={handleAgeChange} 
            editable={isEditing}
            onFocus={handleAgeFocus}
            onBlur={handleAgeBlur}
            keyboardType="numeric"
            maxLength={8}
          />
        </View>
        <View style={styles.columnGap}></View>
        <View style={[styles.column, { zIndex: 999}]}>
          <Text style={styles.label}>Gender:</Text>
        {isEditing ? (
          <SelectList
            setSelected={(value) => { 
              setGender(value); 
              setProfilePic(getProfilePicture(value));
            }}

            data={genders}
            save="value"
            boxStyles={styles.smallInput}
            inputStyles={{ color: '#fff' }}
            dropdownStyles={{ backgroundColor: '#2D1B3D', borderColor: '#00ff00', position: 'absolute', top: 40 }}
            dropdownItemStyles={{ paddingVertical: 10, borderBottomWidth: 1, borderTopWidth: 1, borderColor: '#ff00ff' }}
            dropdownTextStyles={{ color: 'white' }}
            searchPlaceholder="search"
            arrowicon={<AntDesign name="caretdown" color={'#fff'} size={10} />}
            closeicon={<AntDesign name="close" color={'#fff'} size={15} />}
            searchicon={<AntDesign name="search1" color={'#fff'} size={15} style={{ right: 5 }} />}
            defaultOption={{ key: gender, value: gender }}
          />
        ) : (
          <Text style={[styles.smallInput, { color: '#fff', paddingVertical: 10 }]}>
            {gender}
          </Text>
        )}
        </View>
      </View>
      
      <View style={styles.row}>
        <View style={styles.column}>
          <Text style={styles.label}>Weight:</Text>
          <TextInput style={styles.smallInput} value={weight} editable={isEditing}
            onChangeText={handleWeightChange}
            onFocus={handleWeightFocus}
            onBlur={handleWeightBlur}
            keyboardType="numeric"
            maxLength={8}  
          />
        </View>

        <View style={styles.columnGap}></View>
        <View style={styles.column}>
          <Text style={styles.label}>Height:</Text>
          <View style={styles.heightRow}>
            <TextInput style={styles.heightInput} value={heightFT} editable={isEditing} 
              onChangeText={handleHeightFTChange}
              onFocus={handleHeightFTFocus}
              onBlur={handleHeightFTBlur}
              keyboardType="numeric"
              maxLength={5}
            />
            <TextInput style={styles.heightInput} value={heightIN}
              editable={isEditing}
              onChangeText={handleHeightINChange}
              onFocus={handleHeightINFocus}
              onBlur={handleHeightINBlur}
              keyboardType="numeric"
              maxLength={5}
             />
          </View>
        </View>
      </View>

      <Animated.View style={[styles.button, animatedButtonStyle]}>
        <TouchableOpacity 
          onPressIn={handlePressIn} 
          onPressOut={handlePressOut} 
          // onPress={() => console.log("Button Pressed")}
        >
          <Text style={styles.buttonText}>
            {isEditing ? 'SAVE CHANGES' : 'EDIT'}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // backgroundColor: 'transparent', // Dark background for neon effect
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        width: '100%',
      },
      headerBar: {
        width: '120%',
        height: 100,
        backgroundColor: '#2D1B3D',
        justifyContent: 'center',
        alignItems: 'center',
        borderBottomLeftRadius: 50,
        borderBottomRightRadius: 50,
        position: 'absolute',
        top: -1,
        borderWidth: 1,
        borderColor: '#00FF00', // Neon green border
        shadowColor: '#00FF00',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.8,
        shadowRadius: 10,
      },
      headerText: {
        color: '#FF00FF', 
        fontSize: 24,
        fontWeight: 'bold',
        textShadowRadius: 10,
        paddingTop: '10%',
        textShadowColor: '#FF00FF',
        textShadowOffset: { width: 0, height: 0 },
      },
backIcon: {
position: 'absolute',
left: '-40%',
top: 40,
color: '#00FF00'
},
profileSection: {
alignItems: 'center',
marginBottom: 20,

},
profileImageContainer: {
position: 'relative',

},
profileImage: {
width: 130,
height: 130,
borderRadius: 50,
backgroundColor: '#2D1B3D',
borderWidth: 2,
borderColor: '#00FF00', // Neon green border for inputs
marginTop: '20%'
},
editIcon: {
position: 'absolute',
bottom: 5,
right: 5,
backgroundColor: 'white',
borderRadius: 12,
},
label: {
fontSize: 16,
fontWeight: 'bold',
marginTop: 15,
textAlign: 'left',
alignSelf: 'stretch',
color: '#FF00FF',
paddingBottom: 5
},
input: {
width: '100%',
height: 50,
borderRadius: 10,
backgroundColor: '#2D1B3D',
paddingHorizontal: 15,
color: 'white',
fontSize: 16,
borderWidth: 1,
borderColor: '#00FF00',
},
row: {
flexDirection: 'row',
alignItems: 'center',
marginTop: 15,
},
column: {
width: '45%',
},
columnGap: {
width: '10%',
},
smallInput: {
height: 40,
borderRadius: 10,
backgroundColor: '#2D1B3D',
textAlign: 'center',
color: 'white',
fontSize: 16,
borderWidth: 1,
borderColor: '#00FF00',
},
heightRow: {
flexDirection: 'row',
justifyContent: 'space-between',

},
heightInput: {
width: '48%',
height: 40,
borderRadius: 10,
backgroundColor: '#2D1B3D',
textAlign: 'center',
color: 'white',
fontSize: 16,
borderWidth: 1,
borderColor: '#00FF00',
},
button: {
    paddingVertical: 15,
    width: '50%',
    borderWidth: 1,
    borderColor: '#00FF00', // Neon green border for inputs
    paddingHorizontal: 15,
    backgroundColor: '#2D1B3D',
    height: 'auto',
    borderRadius: 10,
    marginTop: '20%'
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
});

export default EditProfile;
