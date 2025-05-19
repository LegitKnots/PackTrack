import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView
} from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import CreateRouteModal from '../components/CreateRouteModal'
import { SERVER_URI } from '../config'
import { jwtDecode } from 'jwt-decode'
import { styles as globalStyles } from '../styles/RoutesScreen.styles'

export default function RoutesScreen() {
  const navigation = useNavigation()
  const [activeTab, setActiveTab] = useState<'my' | 'find'>('my')
  const [modalVisible, setModalVisible] = useState(false)
  const [myRoutes, setMyRoutes] = useState<any[]>([])

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const token = await AsyncStorage.getItem('token')
        if (!token) return Alert.alert('Authentication Error', 'Missing token')

        const decoded: any = jwtDecode(token)
        const userId = decoded?.userID
        if (!userId) throw new Error('Invalid token payload. Missing user ID.')

        const res = await fetch(`${SERVER_URI}/api/routes/user/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        const text = await res.text()
        let data
        try {
          data = JSON.parse(text)
        } catch (e) {
          throw new Error(text)
        }

        if (!res.ok) throw new Error(data.message || 'Failed to fetch routes')

        setMyRoutes(data)
      } catch (err: any) {
        Alert.alert('Error Fetching Routes', err.message)
      }
    }

    fetchRoutes()
  }, [])

  const handleCreateRoute = (newRoute: any) => {
    setMyRoutes(prev => [...prev, newRoute])
    setModalVisible(false)
  }

  const renderRouteCard = (route: any) => (
    <TouchableOpacity
      style={globalStyles.routeCard}
      onPress={() => navigation.navigate('RouteDetails', { route })}>
      <Text style={globalStyles.routeName} numberOfLines={1}>{route.name || 'Unnamed'}</Text>
      <Text style={globalStyles.routeText} numberOfLines={1}>{route.waypoints?.[0]?.label || 'Unknown'}</Text>
      <Text style={globalStyles.routeText} numberOfLines={1}>{route.waypoints?.[1]?.label || 'Unknown'}</Text>
      <Text style={globalStyles.distance}>{route.distance || '—'}</Text>
    </TouchableOpacity>
  )

  return (
    <View style={globalStyles.container}>
      <View style={globalStyles.tabs}>
        <TouchableOpacity style={globalStyles.tab} onPress={() => setActiveTab('my')}>
          <Text style={[globalStyles.tabText, activeTab === 'my' && globalStyles.activeTabText]}>My Routes</Text>
          {activeTab === 'my' && <View style={globalStyles.underline} />}
        </TouchableOpacity>

        <TouchableOpacity style={globalStyles.tab} onPress={() => setActiveTab('find')}>
          <Text style={[globalStyles.tabText, activeTab === 'find' && globalStyles.activeTabText]}>Find Routes</Text>
          {activeTab === 'find' && <View style={globalStyles.underline} />}
        </TouchableOpacity>
      </View>

      <View style={globalStyles.content}>
        {activeTab === 'my' ? (
          <View style={{ flex: 1 }}>
            <View style={globalStyles.plusBtnRow}>
              <TouchableOpacity style={globalStyles.plusBtn} onPress={() => setModalVisible(true)}>
                <Text style={globalStyles.plusIcon}>+</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
              {myRoutes.map(route => (
                <View key={route._id || route.id}>{renderRouteCard(route)}</View>
              ))}
            </ScrollView>
          </View>
        ) : (
          <Text style={globalStyles.placeholder}>Search for community routes here</Text>
        )}
      </View>

      <CreateRouteModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onCreate={handleCreateRoute}
      />
    </View>
  )
}
