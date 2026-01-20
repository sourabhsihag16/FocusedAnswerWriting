import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { streakAPI, progressAPI, questionsAPI } from '../services/api';

interface StreakData {
  current_streak: number;
  longest_streak: number;
  total_days_completed: number;
}

interface ProgressStats {
  total_sessions: number;
  total_time_minutes: number;
  questions_this_week: number;
}

interface TodayData {
  completed_count: number;
  total_count: number;
  today_completed: boolean;
}

export default function DashboardScreen({ navigation }: any) {
  const { user, logout } = useAuthStore();
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [today, setToday] = useState<TodayData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [streakData, statsData, todayData] = await Promise.all([
        streakAPI.getStreak(),
        progressAPI.getStats(),
        questionsAPI.getTodayQuestions(),
      ]);
      setStreak(streakData);
      setStats(statsData);
      setToday(todayData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#e97422" />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.name}>{user?.name?.split(' ')[0]} 👋</Text>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={24} color="#6366f1" />
          </TouchableOpacity>
        </View>

        {/* Streak Card */}
        <View style={styles.streakCard}>
          <View style={styles.streakContent}>
            <Text style={styles.streakEmoji}>🔥</Text>
            <View>
              <Text style={styles.streakNumber}>{streak?.current_streak || 0}</Text>
              <Text style={styles.streakLabel}>Day Streak</Text>
            </View>
          </View>
          <View style={styles.streakDivider} />
          <View style={styles.streakStats}>
            <View style={styles.streakStat}>
              <Text style={styles.statNumber}>{streak?.longest_streak || 0}</Text>
              <Text style={styles.statLabel}>Best</Text>
            </View>
            <View style={styles.streakStat}>
              <Text style={styles.statNumber}>{streak?.total_days_completed || 0}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
          </View>
        </View>

        {/* Today's Progress */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Progress</Text>
          <View style={styles.todayCard}>
            {today?.today_completed ? (
              <View style={styles.completedContainer}>
                <Text style={styles.completedEmoji}>🎉</Text>
                <Text style={styles.completedText}>All done for today!</Text>
                <Text style={styles.completedSubtext}>Come back tomorrow</Text>
              </View>
            ) : (
              <>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${((today?.completed_count || 0) / (today?.total_count || 1)) * 100}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {today?.completed_count || 0} of {today?.total_count || 0} completed
                </Text>
                <TouchableOpacity
                  style={styles.startButton}
                  onPress={() => navigation.navigate('Practice')}
                >
                  <Text style={styles.startButtonText}>Continue Practice</Text>
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>This Week</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="document-text-outline" size={28} color="#10b981" />
              <Text style={styles.statCardNumber}>{stats?.questions_this_week || 0}</Text>
              <Text style={styles.statCardLabel}>Questions</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="time-outline" size={28} color="#3b82f6" />
              <Text style={styles.statCardNumber}>{stats?.total_time_minutes || 0}</Text>
              <Text style={styles.statCardLabel}>Minutes</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="layers-outline" size={28} color="#8b5cf6" />
              <Text style={styles.statCardNumber}>{stats?.total_sessions || 0}</Text>
              <Text style={styles.statCardLabel}>Sessions</Text>
            </View>
          </View>
        </View>

        {/* Motivation */}
        <View style={styles.motivationCard}>
          <Text style={styles.motivationEmoji}>💪</Text>
          <Text style={styles.motivationText}>
            {streak?.current_streak === 0
              ? 'Start your streak today!'
              : streak && streak.current_streak < 7
              ? 'Keep building momentum!'
              : "You're on fire! Don't stop!"}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070714',
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 16,
    color: '#6366f1',
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  logoutButton: {
    padding: 8,
  },
  streakCard: {
    backgroundColor: '#0f0e2a',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e97422',
    shadowColor: '#e97422',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  streakContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  streakEmoji: {
    fontSize: 48,
    marginRight: 16,
  },
  streakNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#e97422',
  },
  streakLabel: {
    fontSize: 16,
    color: '#a5b8fc',
  },
  streakDivider: {
    height: 1,
    backgroundColor: '#1e1b4b',
    marginBottom: 16,
  },
  streakStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  streakStat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 14,
    color: '#6366f1',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  todayCard: {
    backgroundColor: '#0f0e2a',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1e1b4b',
  },
  completedContainer: {
    alignItems: 'center',
    padding: 20,
  },
  completedEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  completedText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  completedSubtext: {
    fontSize: 14,
    color: '#6366f1',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#1e1b4b',
    borderRadius: 4,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#e97422',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#a5b8fc',
    marginBottom: 16,
  },
  startButton: {
    backgroundColor: '#e97422',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#0f0e2a',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#1e1b4b',
  },
  statCardNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  statCardLabel: {
    fontSize: 12,
    color: '#6366f1',
    marginTop: 4,
  },
  motivationCard: {
    backgroundColor: 'rgba(233, 116, 34, 0.1)',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(233, 116, 34, 0.3)',
    marginBottom: 20,
  },
  motivationEmoji: {
    fontSize: 32,
    marginRight: 16,
  },
  motivationText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
    flex: 1,
  },
});
