import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  FlatList,
} from 'react-native';
import { styles } from '../styles/PacksScreen.styles';
import {useNavigation} from '@react-navigation/native';

const {width} = Dimensions.get('window');

export default function PacksScreen() {
  const navigation = useNavigation();

  const [activeTab, setActiveTab] = useState<'my' | 'find'>('my');

  const myPacks = [
    {
      id: '1',
      from: 'BP - Pleasant Hill',
      to: "Mazzy's",
      distance: '2.3Mi',
    },
    // Add more Packs if needed
  ];

  const renderPackCard = (Pack: (typeof myPacks)[0]) => (
    <TouchableOpacity style={styles.PackCard}>
      <Text style={styles.PackText}>{Pack.from}</Text>
      <Text style={styles.PackText}>{Pack.to}</Text>
      <Text style={styles.distance}>{Pack.distance}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        <TouchableOpacity style={styles.tab} onPress={() => setActiveTab('my')}>
          <Text
            style={[
              styles.tabText,
              activeTab === 'my' && styles.activeTabText,
            ]}>
            My Packs
          </Text>
          {activeTab === 'my' && <View style={styles.underline} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tab}
          onPress={() => setActiveTab('find')}>
          <Text
            style={[
              styles.tabText,
              activeTab === 'find' && styles.activeTabText,
            ]}>
            Find Packs
          </Text>
          {activeTab === 'find' && <View style={styles.underline} />}
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {activeTab === 'my' ? (
          <View>
            <View style={styles.plusBtnRow}>
              <TouchableOpacity style={styles.plusBtn}>
                <Text style={styles.plusIcon}>+</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={myPacks}
              keyExtractor={item => item.id}
              renderItem={({item}) => renderPackCard(item)}
            />
          </View>
        ) : (
          <Text style={styles.placeholder}>
            Search for community Packs here
          </Text>
        )}
      </View>
    </View>
  );
}

