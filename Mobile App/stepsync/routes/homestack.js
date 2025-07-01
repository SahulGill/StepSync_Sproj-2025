import { createStackNavigator } from "@react-navigation/stack";
import { NavigationContainer } from "@react-navigation/native";
import Login from "../screens/Login";
import Home from "../screens/Home";
import ForgotPassword from "../screens/FP";
import Register from "../screens/Register";
// import Progress from "../screens/Progress";
import PuzzleMode from "../screens/Mode";
import GameZone from "../screens/GameZone";
import Leaderboard from "../screens/Leaderboard";
import Settings from "../screens/Settings";
import EditProfile from "../screens/EditProfile";
import FAQs from "../screens/FAQs";
import ReportBug from "../screens/Bug";
import UserDetails from "../screens/UserDetails";
import ProgressPage from "../screens/Progress";

const HomeStack = createStackNavigator();

export default function Navigator() 
{
    return(
        <NavigationContainer>
            <HomeStack.Navigator screenOptions={{headerShown: false}}>
                <HomeStack.Screen name="login" component={Login} options={{cardStyle: {backgroundColor: 'transparent'}}}/>
                <HomeStack.Screen name="home" component={Home} options={{cardStyle: {backgroundColor: 'transparent'}}}/>
                <HomeStack.Screen name="forgotpassword" component={ForgotPassword} options={{cardStyle: {backgroundColor: 'transparent'}}}/>
                <HomeStack.Screen name="register" component={Register} options={{cardStyle: {backgroundColor: 'transparent'}}}/>
                <HomeStack.Screen name="progress" component={ProgressPage} options={{cardStyle: {backgroundColor: 'transparent'}}}/>
                <HomeStack.Screen name="mode" component={PuzzleMode} options={{cardStyle: {backgroundColor: 'transparent'}}}/>
                <HomeStack.Screen name="gamezone" component={GameZone} options={{cardStyle: {backgroundColor: 'transparent'}}}/>
                <HomeStack.Screen name="leaderboard" component={Leaderboard} options={{cardStyle: {backgroundColor: 'transparent'}}}/>
                <HomeStack.Screen name="setting" component={Settings} options={{cardStyle: {backgroundColor: 'transparent'}}}/>
                <HomeStack.Screen name="editprofile" component={EditProfile} options={{cardStyle: {backgroundColor: 'transparent'}}}/>
                <HomeStack.Screen name="help" component={FAQs} options={{cardStyle: {backgroundColor: 'transparent'}}}/>
                <HomeStack.Screen name="bugreport" component={ReportBug} options={{cardStyle: {backgroundColor: 'transparent'}}}/>
                <HomeStack.Screen name="userdetails" component={UserDetails} options={{cardStyle: {backgroundColor: 'transparent'}}}/>
            </HomeStack.Navigator>
        </NavigationContainer>
    );
}